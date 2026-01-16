export default {
  apps: [
    {
      name: "dashboard-backend",
      script: "./server.js",
      cwd: "./",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "1G",
    },
  ],
};
