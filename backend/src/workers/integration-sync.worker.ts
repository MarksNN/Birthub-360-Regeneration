/**
 * Worker dedicado Fase 03 com BullMQ/Redis.
 * Processamento assíncrono durável.
 * Executar: npm run worker:integrations
 */
import { ConnectorRegistry } from '../modules/integrations/sdk/registry';
import { MockConnectorAdapter } from '../modules/integrations/sdk/mock-provider.adapter';
import prisma from '../lib/prisma';
import { startWorkers, queues, addJobToQueue } from '../modules/integrations/queue/bullmq.setup';
import { IntegrationSyncEngineService } from '../modules/integrations/services/sync-engine.service';

ConnectorRegistry.getInstance().register(new MockConnectorAdapter());

console.log('[Integration Worker] Iniciando workers BullMQ/Redis...');
const workers = startWorkers();

// Mantendo polling legado apenas para varrer pendências antigas se necessário
const intervalMs = Math.max(5000, Number(process.env.INTEGRATION_WORKER_INTERVAL_MS) || 10000);
let stopping = false;
let busy = false;

async function tick() {
  if (stopping || busy) return;
  busy = true;
  try {
    const inbox = await IntegrationSyncEngineService.processPendingInboxEvents({ limit: 5 });
    if (inbox.processedCount > 0) {
      console.log(`[Integration Worker Polling] Processado ${inbox.processedCount} eventos do inbox`);
    }
    const outbox = await IntegrationSyncEngineService.processPendingOutboxEvents(5);
    if (outbox.processedCount > 0) {
      console.log(`[Integration Worker Polling] Processado ${outbox.processedCount} eventos do outbox`);
    }
  } catch (error) {
    console.error('[Integration Worker Polling] Falha no ciclo:', error instanceof Error ? error.message : String(error));
  } finally {
    busy = false;
  }
}

const handle = setInterval(() => void tick(), intervalMs);
void tick();

async function shutdown() {
  if (stopping) return;
  stopping = true;
  console.log('[Integration Worker] Finalizando...');
  clearInterval(handle);
  await Promise.all([
    workers.inboxWorker.close(),
    workers.outboxWorker.close(),
    workers.reconcileWorker.close(),
    queues.inbox.close(),
    queues.outbox.close(),
    queues.reconcile.close(),
    queues.maintenance.close(),
    queues.deadLetter.close(),
  ]);
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
