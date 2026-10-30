import { SyncDirection } from '@prisma/client';
import prisma from '../../../lib/prisma';
import { IntegrationNotFoundError } from '../domain/errors';
import { IntegrationActor } from '../domain/actor';
import { CommercialLockService } from './commercial-lock.service';

export interface DiscoveryQuestion {
  id: string;
  field: string;
  question: string;
  required: boolean;
  options?: string[];
  answer?: string;
  answeredAt?: string;
  answeredById?: string;
}

export interface UpdateDiscoveryInput {
  toolName?: string;
  objective?: string;
  processes?: string[];
  dataEntities?: Array<{ name: string; fields: string[]; estimatedRecords?: number }>;
  direction?: SyncDirection;
  frequency?: string;
  estimatedVolume?: string;
  technicalRequirements?: string[];
  authenticationNeeds?: string;
  thirdPartyDependencies?: string[];
  operationalConstraints?: string[];
  answers?: Array<{ questionId: string; answer: string }>;
}

export class IntegrationDiscoveryService {
  /**
   * Inicializa o discovery para uma nova solicitação de integração.
   */
  public static async initializeDiscovery(
    projectId: string,
    organizationId: string,
    initialData: Partial<UpdateDiscoveryInput> = {}
  ) {
    const defaultQuestions: DiscoveryQuestion[] = [
      {
        id: 'q1',
        field: 'toolName',
        question: 'Qual é o nome exato da ferramenta, ERP ou sistema legado a ser integrado?',
        required: true
      },
      {
        id: 'q2',
        field: 'objective',
        question: 'Qual é o objetivo comercial primordial desta integração (ex.: sincronizar faturamento, importar contatos)?',
        required: true
      },
      {
        id: 'q3',
        field: 'direction',
        question: 'Qual será a direção do fluxo de dados?',
        required: true,
        options: ['INBOUND (apenas importar para Birthub)', 'OUTBOUND (apenas enviar do Birthub)', 'BIDIRECTIONAL (mão dupla)']
      },
      {
        id: 'q4',
        field: 'frequency',
        question: 'Qual é a frequência de sincronização desejada?',
        required: true,
        options: ['TEMPO_REAL (Webhooks)', 'HOURLY (A cada hora)', 'DAILY (Diário / Noturno)', 'ON_DEMAND (Manual)']
      },
      {
        id: 'q5',
        field: 'estimatedVolume',
        question: 'Qual a volumetria estimada de registros (ex.: 5.000 clientes, 20.000 faturas/mês)?',
        required: false
      },
      {
        id: 'q6',
        field: 'authenticationNeeds',
        question: 'O sistema possui documentação de API ou método conhecido de autenticação (OAuth2, API Key, Token)?',
        required: false
      }
    ];

    return prisma.integrationDiscovery.upsert({
      where: { projectId },
      update: {},
      create: {
        organizationId,
        projectId,
        toolName: initialData.toolName || null,
        objective: initialData.objective || null,
        processes: initialData.processes || [],
        dataEntities: (initialData.dataEntities as any) || [],
        direction: initialData.direction || null,
        frequency: initialData.frequency || null,
        estimatedVolume: initialData.estimatedVolume || null,
        technicalRequirements: initialData.technicalRequirements || [],
        authenticationNeeds: initialData.authenticationNeeds || null,
        thirdPartyDependencies: initialData.thirdPartyDependencies || [],
        operationalConstraints: initialData.operationalConstraints || [],
        questions: defaultQuestions as any,
        completeness: 20
      }
    });
  }

  /**
   * Atualiza as informações do discovery com respostas do cliente ou do Supervisor.
   */
  public static async updateDiscovery(
    projectId: string,
    organizationId: string,
    input: UpdateDiscoveryInput,
    actor: IntegrationActor
  ) {
    const discovery = await prisma.integrationDiscovery.findFirst({
      where: { projectId, organizationId }
    });

    if (!discovery) throw new IntegrationNotFoundError('Discovery');

    const questions = (discovery.questions as any as DiscoveryQuestion[]) || [];

    if (input.answers) {
      for (const ans of input.answers) {
        const q = questions.find((item) => item.id === ans.questionId);
        if (q) {
          q.answer = ans.answer;
          q.answeredAt = new Date().toISOString();
          q.answeredById = actor.userId;

          // Mapear respostas diretas para os campos de discovery
          if (q.field === 'toolName') input.toolName = ans.answer;
          if (q.field === 'objective') input.objective = ans.answer;
          if (q.field === 'direction') {
            if (ans.answer.includes('INBOUND')) input.direction = SyncDirection.INBOUND;
            else if (ans.answer.includes('OUTBOUND')) input.direction = SyncDirection.OUTBOUND;
            else input.direction = SyncDirection.BIDIRECTIONAL;
          }
          if (q.field === 'frequency') input.frequency = ans.answer;
          if (q.field === 'estimatedVolume') input.estimatedVolume = ans.answer;
          if (q.field === 'authenticationNeeds') input.authenticationNeeds = ans.answer;
        }
      }
    }

    // Calcular completude percentual
    let completedPoints = 0;
    const totalPoints = 6;
    if (input.toolName || discovery.toolName) completedPoints++;
    if (input.objective || discovery.objective) completedPoints++;
    if (input.direction || discovery.direction) completedPoints++;
    if (input.frequency || discovery.frequency) completedPoints++;
    if (input.estimatedVolume || discovery.estimatedVolume) completedPoints++;
    if (input.authenticationNeeds || discovery.authenticationNeeds) completedPoints++;

    const completeness = Math.min(100, Math.round((completedPoints / totalPoints) * 100));

    const updated = await prisma.integrationDiscovery.update({
      where: { id: discovery.id },
      data: {
        toolName: input.toolName !== undefined ? input.toolName : discovery.toolName,
        objective: input.objective !== undefined ? input.objective : discovery.objective,
        processes: input.processes || discovery.processes,
        dataEntities: input.dataEntities ? (input.dataEntities as any) : discovery.dataEntities,
        direction: input.direction !== undefined ? input.direction : discovery.direction,
        frequency: input.frequency !== undefined ? input.frequency : discovery.frequency,
        estimatedVolume: input.estimatedVolume !== undefined ? input.estimatedVolume : discovery.estimatedVolume,
        technicalRequirements: input.technicalRequirements || discovery.technicalRequirements,
        authenticationNeeds: input.authenticationNeeds !== undefined ? input.authenticationNeeds : discovery.authenticationNeeds,
        thirdPartyDependencies: input.thirdPartyDependencies || discovery.thirdPartyDependencies,
        operationalConstraints: input.operationalConstraints || discovery.operationalConstraints,
        questions: questions as any,
        completeness
      }
    });

    return updated;
  }
}
