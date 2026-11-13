module.exports = {
  apps: [
    {
      name: "aurict-web",
      script: "bun",
      // Do not pass --hostname 127.0.0.1 here: the locale proxy (src/proxy.ts) rewrites to
      // localhost, which Next then proxies and fails with 500 when the server is bound to
      // 127.0.0.1 only. Keep the port closed with the firewall, or run it in a container that
      // publishes the port on 127.0.0.1.
      args: "run start",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        PORT: 3376,
        HOSTNAME: "127.0.0.1",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
}
