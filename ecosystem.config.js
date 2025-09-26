module.exports = {
  apps: [
    {
      name: "farsi-dutch-bot",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: "5s",
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: "3000"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: "3000"
      }
    }
  ]
};