module.exports = {
  apps: [
    {
      name: "mobile-aurict-web",
      script: "bun",
      args: "run start",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        PORT: 3377,
        HOSTNAME: "127.0.0.1",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
}
