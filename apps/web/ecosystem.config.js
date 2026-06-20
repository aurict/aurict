module.exports = {
  apps: [
    {
      name: "aurict-web",
      script: "bun",
      args: "run start",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        PORT: 3376,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
}
