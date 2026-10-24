module.exports = {
  apps: [
    {
      name: 'garage-api',
      script: 'dist/server.js',
      // cluster solo si tu app es stateless (esta lo es) y quieres usar todos los cores.
      // Si usas instancias: 1. Con cluster, asegúrate de que NINGUNA lógica en memoria sea compartida.
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
      },
      // Logs
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
      time: true,
      // Graceful shutdown (coincide con SIGTERM/SIGINT que ya maneja server.ts)
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
