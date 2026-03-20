const Redis  = require('ioredis');
const logger = require('./logger');

const redisConfig = {
  host:            process.env.REDIS_HOST     || '127.0.0.1',
  port:            parseInt(process.env.REDIS_PORT, 10) || 6379,
  password:        process.env.REDIS_PASSWORD || undefined,
  retryStrategy:   (times) => Math.min(times * 100, 3000), // exponential back-off
  lazyConnect:     false,
  enableReadyCheck: true,
};

// Two separate clients required by @socket.io/redis-adapter
const pubClient = new Redis(redisConfig);
const subClient = pubClient.duplicate();

pubClient.on('connect', () => logger.info('Redis pubClient connected'));
pubClient.on('error',  (err) => logger.error('Redis pubClient error', { error: err.message }));

subClient.on('connect', () => logger.info('Redis subClient connected'));
subClient.on('error',  (err) => logger.error('Redis subClient error', { error: err.message }));

module.exports = { pubClient, subClient };
