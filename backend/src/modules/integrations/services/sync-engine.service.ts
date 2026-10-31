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
          if (change.action === 'delete') {
            // Exclusões externas exigem política explícita; jamais re-criar o registro.
            await prisma.integrationConflict.create({
              data: {
                organizationId: ev.organizationId,
                connectionId: ev.connectionId,
                entity: change.entity, externalId: change.externalId,
                strategy: 'MANUAL', status: 'OPEN',
                remoteSnapshot: { action: 'delete', data: (change.data || {}) as any } as any
              }
            });
            continue;
          }
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
  /**
   * Consumidor de saída persistente. Executar por worker dedicado; nunca na requisição HTTP.
   */
  public static async processPendingOutboxEvents(limit = 20) {
    const rows = await prisma.integrationOutboxEvent.findMany({
      where: {
        status: { in: [EventProcessingStatus.PENDING, EventProcessingStatus.RETRY_SCHEDULED] },
        nextAttemptAt: { lte: new Date() }
      },
      orderBy: { createdAt: 'asc' }, take: Math.max(1, Math.min(100, limit))
    });
    const results: Array<{ id: string; status: EventProcessingStatus }> = [];
    for (const event of rows) {
      const claimed = await prisma.integrationOutboxEvent.updateMany({
        where: { id: event.id, status: event.status },
        data: { status: EventProcessingStatus.PROCESSING, attempts: { increment: 1 } }
      });
      if (!claimed.count) continue;
      const attempts = event.attempts + 1;
      try {
        if (!event.connectionId) throw new Error('Evento sem conexão externa vinculada');
        const connection = await prisma.integrationConnection.findFirst({
          where: { id: event.connectionId, organizationId: event.organizationId },
          include: { connector: true }
        });
        if (!connection || !connection.syncEnabled || connection.status !== 'ACTIVE') {
          throw new Error('Conexão inativa ou não autorizada para sincronização');
        }
        const adapter = ConnectorRegistry.getInstance().get(connection.connector.key, connection.connector.version);
        if (!adapter?.outbound) throw new Error('Conector não implementa sincronização de saída');
        await adapter.outbound.push(
          { organizationId: event.organizationId, connectionId: connection.id, config: connection.config as Record<string, unknown> },
          event.aggregateType, event.payload as Record<string, unknown>,
          { idempotencyKey: event.idempotencyKey }
        );
        await prisma.integrationOutboxEvent.update({
          where: { id: event.id },
          data: { status: EventProcessingStatus.PROCESSED, dispatchedAt: new Date(), lastError: null }
        });
        results.push({ id: event.id, status: EventProcessingStatus.PROCESSED });
      } catch (err: any) {
        const permanent = attempts >= event.maxAttempts ||
          /sem conexão|inativa|não autorizada|não implementa/i.test(String(err.message));
        const status = permanent ? EventProcessingStatus.QUARANTINED : EventProcessingStatus.RETRY_SCHEDULED;
        const delayMs = Math.min(60000, Math.pow(2, attempts) * 1000);
        await prisma.integrationOutboxEvent.update({
          where: { id: event.id },
          data: { status, nextAttemptAt: new Date(Date.now() + delayMs), lastError: String(err.message).slice(0, 400) }
        });
        results.push({ id: event.id, status });
      }
    }
    return { processedCount: results.length, details: results };
  }

  /**
   * Reconciliação efetiva: pagina registros, compara CRM local e persiste diferenças.
   * Contadores de sucesso refletem somente alterações realmente realizadas.
   */
  public static async runReconciliation(connectionId: string, organizationId: string) {
    const connection = await prisma.integrationConnection.findFirst({
      where: { id: connectionId, organizationId },
      include: { connector: true }
    });
    if (!connection) throw new IntegrationNotFoundError('Conexão');
    const run = await prisma.integrationSyncRun.create({
      data: { organizationId, connectionId, kind: SyncRunKind.RECONCILIATION, status: 'RUNNING' }
    });
    let examined = 0, reconciled = 0, conflicted = 0, skipped = 0;
    try {
      const adapter = ConnectorRegistry.getInstance().get(connection.connector.key, connection.connector.version);
      if (!adapter?.inbound) throw new Error('Conector não possui adaptador inbound');
      const ctx = {
        organizationId, connectionId, config: connection.config as Record<string, unknown>
      };
      let cursor: string | undefined;
      const seen = new Set<string>();
      for (let page = 0; page < 100; page++) {
        const response = await adapter.inbound.list(ctx, 'customer', cursor);
        for (const item of response.records) {
          examined++;
          if (item.entity !== 'customer') { skipped++; continue; }
          const mapped = adapter.mapper.toLocal('customer', item.data);
          const cnpj = String(mapped.cnpj || mapped.taxId || '').trim();
          if (!cnpj) { skipped++; continue; }
          const previous = await prisma.company.findUnique({
            where: { organizationId_cnpj: { organizationId, cnpj } }
          });
          if (previous && connection.conflictStrategy === 'MANUAL' &&
              previous.name !== String(mapped.name || previous.name)) {
            const existingConflict = await prisma.integrationConflict.findFirst({
              where: { organizationId, connectionId, entity: 'company',
                externalId: item.externalId, status: 'OPEN' }
            });
            if (!existingConflict) {
              await prisma.integrationConflict.create({
                data: {
                  organizationId, connectionId, entity: 'company', externalId: item.externalId,
                  localId: previous.id, localSnapshot: { name: previous.name, cnpj },
                  remoteSnapshot: item.data as any, strategy: 'MANUAL', status: 'OPEN'
                }
              });
            }
            conflicted++;
            continue;
          }
          const company = await prisma.company.upsert({
            where: { organizationId_cnpj: { organizationId, cnpj } },
            update: {
              name: String(mapped.name || previous?.name || 'Empresa Importada'),
              annualRevenue: mapped.annualRevenue == null ? undefined : Number(mapped.annualRevenue)
            },
            create: {
              organizationId, cnpj,
              name: String(mapped.name || 'Empresa Importada'),
              annualRevenue: mapped.annualRevenue == null ? undefined : Number(mapped.annualRevenue)
            }
          });
          await prisma.integrationEntityLink.upsert({
            where: { connectionId_entity_externalId: {
              connectionId, entity: 'company', externalId: item.externalId
            } },
            update: { localId: company.id, lastSyncedAt: new Date() },
            create: {
              organizationId, connectionId, entity: 'company', externalId: item.externalId,
              localId: company.id
            }
          });
          reconciled++;
        }
        if (!response.nextCursor) break;
        if (seen.has(response.nextCursor)) throw new Error('Cursor repetido pelo provedor');
        seen.add(response.nextCursor);
        cursor = response.nextCursor;
        if (page === 99) throw new Error('Limite de páginas atingido; continuar em outro lote');
      }
      const status = conflicted || skipped ? 'PARTIAL' : 'COMPLETED';
      await prisma.integrationSyncRun.update({
        where: { id: run.id },
        data: { status, finishedAt: new Date(),
          stats: { remoteRecordsExamined: examined, reconciledSuccessfully: reconciled, conflicts: conflicted, skipped } }
      });
      return { success: status === 'COMPLETED', syncRunId: run.id,
        recordsChecked: examined, recordsSynced: reconciled, conflicts: conflicted, skipped };
    } catch (err: any) {
      await prisma.integrationSyncRun.update({
        where: { id: run.id },
        data: { status: 'FAILED', error: String(err.message).slice(0, 400), finishedAt: new Date(),
          stats: { remoteRecordsExamined: examined, reconciledSuccessfully: reconciled, conflicts: conflicted, skipped } }
      });
      return { success: false, syncRunId: run.id,
        recordsChecked: examined, recordsSynced: reconciled, conflicts: conflicted, skipped,
        error: String(err.message).slice(0, 400) };
    }
  }

}
