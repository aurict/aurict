module.exports = {
  apps: [
    {
      name: "decision-aurict-web",
      script: "bun",
      args: "run start",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        PORT: 3211,
        HOSTNAME: "127.0.0.1",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "768M",
    },
  ],
}
