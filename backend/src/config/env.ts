// Configuração do ambiente da plataforma Birthub 360 Regeneration
export const ENV = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'birthhub360-super-secret-key-phase01-2026',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://birthhub_user:birthhub_secure_pwd_2026@localhost:5433/birthhub360_regen?schema=public',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173'
};
