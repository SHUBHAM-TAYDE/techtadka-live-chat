require('dotenv').config();

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const { createAdapter } = require('@socket.io/redis-adapter');

const { connectDB }              = require('./config/db');
const { pubClient, subClient }   = require('./config/redis');
const logger                     = require('./config/logger');
const { socketAuthMiddleware }   = require('./middleware/authMiddleware');
const { registerSocketHandlers } = require('./socket/socket');

const authRoutes    = require('./routes/auth.routes');
const roomRoutes    = require('./routes/room.routes');
const messageRoutes = require('./routes/message.routes');

const app    = express();
const server = http.createServer(app);

// ─── Allowed Origins ─────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

// ─── Socket.io ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:      allowedOrigins,
    methods:     ['GET', 'POST'],
    credentials: true,
  },
  // Sticky session not strictly required with Redis adapter, but good practice
  transports: ['websocket', 'polling'],
  pingTimeout:  60000,
  pingInterval: 25000,
});

// Redis adapter — syncs events across all Node.js instances
io.adapter(createAdapter(pubClient, subClient));

// Socket auth
io.use(socketAuthMiddleware);

// Register all socket event handlers
registerSocketHandlers(io);

// ─── Express Middleware ──────────────────────────────────────────────────────
app.set('trust proxy', 1); // Needed behind Nginx / Utho Load Balancer

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Global rate limiter
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/rooms',   roomRoutes);
app.use('/api/rooms',   messageRoutes);

// Health-check endpoint (for Utho Load Balancer health probes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    pid:       process.pid,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── Graceful shutdown ───────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

// ─── Boot ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;

(async () => {
  try {
    await connectDB();
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`, {
        env: process.env.NODE_ENV,
        pid: process.pid,
      });
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
})();

module.exports = { app, io }; // for testing
