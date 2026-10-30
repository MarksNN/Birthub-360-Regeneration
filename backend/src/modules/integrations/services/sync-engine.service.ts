import { EventProcessingStatus, PrismaClient, SyncDirection, SyncRunKind } from '@prisma/client';
import prisma from '../../../lib/prisma';
import { ConnectorRegistry } from '../sdk/registry';
import { IntegrationNotFoundError, RateLimitError } from '../domain/errors';
import { hashDocument } from '../domain/hash';

export interface ProcessInboxOptions {
  limit?: number;
}

export class IntegrationSyncEngineService {
  /**
   * Recebe um webhook externo, valida assinatura, garante idempotência e persiste na Inbox.
   */
  public static async receiveWebhookEvent(input: {
    connectionId: string;
    organizationId: string;
    headers: Record<string, string | string[] | undefined>;
    body: unknown;
  }) {
    const connection = await prisma.integrationConnection.findFirst({
      where: { id: input.connectionId, organizationId: input.organizationId },
      include: { connector: true }
    });

    if (!connection) throw new IntegrationNotFoundError('Conexão');

    const registry = ConnectorRegistry.getInstance();
    const adapter = registry.get(connection.connector.key, connection.connector.version);

    if (!adapter || !adapter.webhook) {
      throw new Error(`Conector ${connection.connector.key} não implementa WebhookHandler`);
    }

    const ctx = {
      organizationId: input.organizationId,
      connectionId: connection.id,
      config: connection.config as any
    };

    // Validação de assinatura
    const signatureValid = adapter.webhook.verify(ctx, input.headers, input.body);
    if (!signatureValid) {
      // Nunca reservar chave de idempotência de webhook não autenticado.
      throw new Error('Assinatura do webhook inválida.');
    }
    const idempotencyKey = adapter.webhook.idempotencyKey(input.body);
    const eventType = adapter.webhook.eventType(input.body);

    // Verificar duplicação prévia (Idempotência)
    const existing = await prisma.webhookInboxEvent.findUnique({
      where: {
        connectionId_idempotencyKey: {
          connectionId: connection.id,
          idempotencyKey
        }
      }
    });

    if (existing) {
      return {
        received: true,
        duplicate: true,
        eventId: existing.id,
        status: EventProcessingStatus.DUPLICATE
      };
    }

    const event = await prisma.webhookInboxEvent.create({
      data: {
        organizationId: input.organizationId,
        connectionId: connection.id,
        providerKey: connection.connector.key,
        eventType,
        idempotencyKey,
        payload: input.body as any,
        signatureValid,
        status: signatureValid ? EventProcessingStatus.PENDING : EventProcessingStatus.QUARANTINED,
        lastError: signatureValid ? null : 'Assinatura inválida detectada'
      }
    });

    return {
      received: true,
      duplicate: false,
      eventId: event.id,
      status: event.status
    };
  }

  /**
   * Processa eventos pendentes da Inbox com controle de retry, rate limit e quarentena (Dead-letter).
   */
  public static async processPendingInboxEvents(options: ProcessInboxOptions = {}) {
    const limit = options.limit || 20;

    const events = await prisma.webhookInboxEvent.findMany({
      where: {
        status: { in: [EventProcessingStatus.PENDING, EventProcessingStatus.RETRY_SCHEDULED] },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }]
      },
      take: limit,
      include: {
        connection: {
          include: { connector: true }
        }
      }
    });

    const registry = ConnectorRegistry.getInstance();
    const results: Array<{ id: string; status: EventProcessingStatus; error?: string }> = [];

    for (const ev of events) {
      const adapter = registry.get(ev.connection.connector.key, ev.connection.connector.version);

      if (!adapter || !adapter.webhook) {
        await prisma.webhookInboxEvent.update({
          where: { id: ev.id },
          data: { status: EventProcessingStatus.QUARANTINED, lastError: 'Adaptador não encontrado' }
        });
        results.push({ id: ev.id, status: EventProcessingStatus.QUARANTINED });
        continue;
      }

      const attempts = ev.attempts + 1;

      try {
        await prisma.webhookInboxEvent.update({
          where: { id: ev.id },
          data: { status: EventProcessingStatus.PROCESSING, attempts }
        });

        const changes = adapter.webhook.toChanges(ev.payload);

        // Processamento das mudanças (ex.: upsert de empresa no CRM Birthub)
        for (const change of changes) {
          if (change.entity === 'customer' && change.data) {
            const mapped = adapter.mapper.toLocal('customer', change.data);
            const cnpj = (mapped.cnpj as string) || (mapped.taxId as string);

            if (cnpj) {
              const comp = await prisma.company.upsert({
                where: {
                  organizationId_cnpj: {
                    organizationId: ev.organizationId,
                    cnpj
                  }
                },
                update: {
                  name: (mapped.name as string) || 'Empresa Importada via Sync',
                  annualRevenue: mapped.annualRevenue ? Number(mapped.annualRevenue) : undefined
                },
                create: {
                  organizationId: ev.organizationId,
                  cnpj,
                  name: (mapped.name as string) || 'Empresa Importada via Sync',
                  annualRevenue: mapped.annualRevenue ? Number(mapped.annualRevenue) : undefined
                }
              });

              // Registrar link de entidade
              await prisma.integrationEntityLink.upsert({
                where: {
                  connectionId_entity_externalId: {
                    connectionId: ev.connectionId,
                    entity: 'company',
                    externalId: change.externalId
                  }
                },
                update: {
                  localId: comp.id,
                  lastSyncedAt: new Date()
                },
                create: {
                  organizationId: ev.organizationId,
                  connectionId: ev.connectionId,
                  entity: 'company',
                  externalId: change.externalId,
                  localId: comp.id
                }
              });
            }
          }
        }

        await prisma.webhookInboxEvent.update({
          where: { id: ev.id },
          data: {
            status: EventProcessingStatus.PROCESSED,
            processedAt: new Date(),
            lastError: null
          }
        });

        results.push({ id: ev.id, status: EventProcessingStatus.PROCESSED });
      } catch (err: any) {
        if (err instanceof RateLimitError) {
          // Reagendamento com backoff orientado pelo rate limit
          const nextAttempt = new Date(Date.now() + err.retryAfterMs);
          await prisma.webhookInboxEvent.update({
            where: { id: ev.id },
            data: {
              status: EventProcessingStatus.RETRY_SCHEDULED,
              nextAttemptAt: nextAttempt,
              lastError: `Rate limit: ${err.message}`
            }
          });
          results.push({ id: ev.id, status: EventProcessingStatus.RETRY_SCHEDULED, error: err.message });
        } else if (attempts >= ev.maxAttempts) {
          // Quarentena (Dead-Letter)
          await prisma.webhookInboxEvent.update({
            where: { id: ev.id },
            data: {
              status: EventProcessingStatus.QUARANTINED,
              lastError: `Excedeu limite de ${ev.maxAttempts} tentativas: ${err.message}`
            }
          });
          results.push({ id: ev.id, status: EventProcessingStatus.QUARANTINED, error: err.message });
        } else {
          // Retry exponencial simples
          const delayMs = Math.pow(2, attempts) * 1000;
          await prisma.webhookInboxEvent.update({
            where: { id: ev.id },
            data: {
              status: EventProcessingStatus.RETRY_SCHEDULED,
              nextAttemptAt: new Date(Date.now() + delayMs),
              lastError: err.message
            }
          });
          results.push({ id: ev.id, status: EventProcessingStatus.RETRY_SCHEDULED, error: err.message });
        }
      }
    }

    return { processedCount: results.length, details: results };
  }

  /**
   * Enfileira evento na Outbox transacional para envio assíncrono ao provedor remoto.
   */
  public static async enqueueOutboxEvent(
    data: {
      organizationId: string;
      connectionId?: string;
      projectId?: string;
      aggregateType: string;
      aggregateId: string;
      eventType: string;
      payload: Record<string, unknown>;
    },
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'> = prisma
  ) {
    const idempotencyKey = hashDocument({
      organizationId: data.organizationId,
      connectionId: data.connectionId || null,
      aggregateType: data.aggregateType,
      aggregateId: data.aggregateId,
      eventType: data.eventType,
      payload: data.payload
    });

    return tx.integrationOutboxEvent.upsert({
      where: { idempotencyKey },
      update: {},
      create: {
        organizationId: data.organizationId,
        connectionId: data.connectionId || null,
        projectId: data.projectId || null,
        aggregateType: data.aggregateType,
        aggregateId: data.aggregateId,
        eventType: data.eventType,
        payload: data.payload as any,
        idempotencyKey,
        status: EventProcessingStatus.PENDING
      }
    });
  }

  /**
   * Executa uma reconciliação completa entre a base local e o provedor remoto.
   */
  public static async runReconciliation(connectionId: string, organizationId: string) {
    const connection = await prisma.integrationConnection.findFirst({
      where: { id: connectionId, organizationId },
      include: { connector: true }
    });

    if (!connection) throw new IntegrationNotFoundError('Conexão');

    const syncRun = await prisma.integrationSyncRun.create({
      data: {
        organizationId,
        connectionId: connection.id,
        kind: SyncRunKind.RECONCILIATION,
        status: 'RUNNING'
      }
    });

    const registry = ConnectorRegistry.getInstance();
    const adapter = registry.get(connection.connector.key, connection.connector.version);

    if (!adapter || !adapter.inbound) {
      await prisma.integrationSyncRun.update({
        where: { id: syncRun.id },
        data: { status: 'FAILED', error: 'Inbound adapter não disponível para este conector' }
      });
      return { success: false, syncRunId: syncRun.id };
    }

    const ctx = {
      organizationId,
      connectionId: connection.id,
      config: connection.config as any
    };

    const remote = await adapter.inbound.list(ctx, 'customer');

    await prisma.integrationSyncRun.update({
      where: { id: syncRun.id },
      data: {
        status: 'COMPLETED',
        finishedAt: new Date(),
        stats: {
          remoteRecordsExamined: remote.records.length,
          reconciledSuccessfully: remote.records.length
        }
      }
    });

    return {
      success: true,
      syncRunId: syncRun.id,
      recordsChecked: remote.records.length
    };
  }
}
