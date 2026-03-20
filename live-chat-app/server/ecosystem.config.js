module.exports = {
  apps: [
    {
      name:             'live-chat-server',
      script:           './index.js',
      instances:        'max',        // One process per CPU core
      exec_mode:        'cluster',    // PM2 cluster mode
      watch:            false,
      max_memory_restart: '512M',

      env_production: {
        NODE_ENV: 'production',
        PORT:     5000,
      },

      // Graceful reload — zero-downtime deploys
      kill_timeout:    5000,
      wait_ready:      true,
      listen_timeout:  10000,

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file:      '/var/log/pm2/live-chat-error.log',
      out_file:        '/var/log/pm2/live-chat-out.log',
      merge_logs:      true,
    },
  ],
};
