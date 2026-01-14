module.exports = {
  apps: [
    {
      name: "spheronix-backend",
      script: "./server.js",
      instances: 1, // Or "max" to use all CPU cores
      exec_mode: "fork", // Use "cluster" if instances > 1
      env: {
        NODE_ENV: "production",
        PORT: 5001,
      },
      // Error handling and restarts
      max_memory_restart: "1G",
      restart_delay: 4000,
      autorestart: true,
      watch: false, // Don't watch files in production
      time: true, // Log timestamps
    },
  ],
};
