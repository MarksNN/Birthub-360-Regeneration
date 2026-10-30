/**
 * Worker dedicado Fase 03. Processamento PostgreSQL durável enquanto o backend
 * de filas Redis/BullMQ não estiver disponível. Executar: npm run worker:integrations
 */
import { ConnectorRegistry } from '../modules/integrations/sdk/registry';
import { MockConnectorAdapter } from '../modules/integrations/sdk/mock-provider.adapter';
import { IntegrationSyncEngineService } from '../modules/integrations/services/sync-engine.service';
import prisma from '../lib/prisma';

ConnectorRegistry.getInstance().register(new MockConnectorAdapter());
const intervalMs = Math.max(1000, Number(process.env.INTEGRATION_WORKER_INTERVAL_MS) || 5000);
let stopping = false;
let busy = false;

async function tick() {
  if (stopping || busy) return;
  busy = true;
  try {
    await IntegrationSyncEngineService.processPendingInboxEvents({ limit: 20 });
    await IntegrationSyncEngineService.processPendingOutboxEvents(20);
  } catch (error) {
    console.error('[Integration worker] Falha no ciclo:', error instanceof Error ? error.message : String(error));
  } finally {
    busy = false;
  }
}

const handle = setInterval(() => void tick(), intervalMs);
void tick();

async function shutdown() {
  if (stopping) return;
  stopping = true;
  clearInterval(handle);
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
