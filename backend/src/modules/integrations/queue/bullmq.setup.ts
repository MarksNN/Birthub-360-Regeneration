import { Queue, Worker, QueueEvents } from 'bullmq';
import { IntegrationSyncEngineService } from '../services/sync-engine.service';

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

export const queues = {
  inbox: new Queue('integration.inbox', { connection }),
  outbox: new Queue('integration.outbox', { connection }),
  reconcile: new Queue('integration.reconcile', { connection }),
  maintenance: new Queue('integration.maintenance', { connection }),
  deadLetter: new Queue('integration.dead-letter', { connection })
};

export async function addJobToQueue(queueName: keyof typeof queues, name: string, data: any, opts?: any) {
  const queue = queues[queueName];
  if (!queue) throw new Error(`Queue ${queueName} not found`);
  return queue.add(name, data, opts);
}

export function startWorkers() {
  const inboxWorker = new Worker('integration.inbox', async job => {
    // Process inbox
    // O sync engine processa em lote, então este worker pode apenas acionar o lote,
    // ou no futuro, processar individualmente.
    await IntegrationSyncEngineService.processPendingInboxEvents({ limit: 1 });
  }, { connection });

  const outboxWorker = new Worker('integration.outbox', async job => {
    // Process outbox
    await IntegrationSyncEngineService.processPendingOutboxEvents(1);
  }, { connection });

  // Outros workers se necessário (reconcile, maintenance, deadLetter)
  const reconcileWorker = new Worker('integration.reconcile', async job => {
    const { connectionId, organizationId } = job.data;
    await IntegrationSyncEngineService.runReconciliation(connectionId, organizationId);
  }, { connection });

  return { inboxWorker, outboxWorker, reconcileWorker };
}
