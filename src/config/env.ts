import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`[config] Falta la variable de entorno requerida: ${key}`);
  }
  return value;
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) {
  throw new Error('[config] JWT_SECRET debe tener al menos 32 caracteres.');
}

export const env = {
  server: {
    port: Number(process.env.PORT ?? 3000),
  },
  db: {
    host: required('DB_HOST'),
    port: Number(process.env.DB_PORT ?? 3306),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
    connectionLimit: Number(process.env.DB_POOL_LIMIT ?? 10),
  },
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '5m',
  },
  storage: {
    endpoint: required('GARAGE_ENDPOINT'),
    region: process.env.GARAGE_REGION ?? 'garage',
    accessKey: required('GARAGE_ACCESS_KEY'),
    secretKey: required('GARAGE_SECRET_KEY'),
    bucket: required('GARAGE_BUCKET'),
    publicBaseUrl: required('PUBLIC_BASE_URL').replace(/\/+$/, ''),
    maxUploadBytes: Number(process.env.MAX_UPLOAD_MB ?? 10) * 1024 * 1024,
  },
} as const;
