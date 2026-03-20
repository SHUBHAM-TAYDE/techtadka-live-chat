const { Pool } = require('pg');
const logger  = require('./logger');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,

  // Connection pool tuning for production
  max:              20,   // max simultaneous connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => logger.debug('PostgreSQL: new client connected'));
pool.on('error',  (err) => logger.error('PostgreSQL pool error', { error: err.message }));

// Health-check helper
const connectDB = async () => {
  const client = await pool.connect();
  await client.query('SELECT 1');
  client.release();
  logger.info('PostgreSQL connection pool ready');
};

module.exports = { pool, connectDB };
