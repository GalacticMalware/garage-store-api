import { env } from './config/env.js';
import { createApp } from './app.js';
import { closePool, pool } from './infra/mysql.js';

async function bootstrap(): Promise<void> {
  // Fail fast: verifica conexión a MySQL al arrancar.
  await pool.query('SELECT 1');

  const app = createApp();
  const server = app.listen(env.server.port, () => {
    console.log(`[server] escuchando en http://localhost:${env.server.port}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[server] ${signal} recibido, cerrando...`);
    server.close();
    await closePool();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  console.error('[server] no se pudo iniciar', error);
  process.exit(1);
});
