import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import authRoutes from './routes/auth.routes';
import crmRoutes from './routes/crm.routes';
import dashboardRoutes from './routes/dashboard.routes';
import supervisorRoutes from './modules/supervisor/supervisor.routes';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/supervisor', supervisorRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Birthub 360 Regeneration API',
    phase: 'FASE 01 - FUNDAÇÃO OPERACIONAL',
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(ENV.PORT, () => {
    console.log(`[BIRTHUB 360 API] Servidor operando na porta ${ENV.PORT}`);
  });
}

export default app;
