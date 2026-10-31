import { canonicalJson, hashDocument, sha256 } from '../domain/hash';
import { PricingCalculationResult } from './pricing.engine';

export interface ProposalArtifactsInput {
  proposalNumber: string;
  version: number;
  kind: string;
  organizationName: string;
  organizationSlug: string;
  providerName: string;
  projectCode: string;
  projectTitle: string;
  scopeContent: {
    objective: string;
    justification: string;
    deliverables: string[];
    includedFeatures: string[];
    excludedFeatures: string[];
    integratedEntities: Array<{ name: string; localTarget: string; fields: string[]; syncDirection: string }>;
    syncFlows: string[];
    dependencies: string[];
    clientPrerequisites: string[];
    acceptanceCriteria: string[];
    limitations: string[];
    estimatedTimelineDays: number;
    risksAndAssumptions: string[];
  };
  feasibilityContent: {
    verdict: string;
    complexity: string;
    hasOfficialApi: boolean | null;
    documentationUrl?: string | null;
    authMethods: string[];
    rateLimitNotes?: string | null;
    supportsWebhooks: boolean | null;
    readCapabilities: string[];
    writeCapabilities: string[];
    licensingDependencies?: string | null;
    risks: string[];
    uncertainties: string[];
    reusableConnectorIds: string[];
    requiresPaidDiscovery: boolean;
  };
  pricingResult: PricingCalculationResult;
  validUntil: string;
}

export interface GeneratedProposalArtifacts {
  scopeHtml: string;
  feasibilityHtml: string;
  proposalHtml: string;
  estimateBreakdownJson: string;
  acceptanceTermsHtml: string;
  contentHash: string; // Hash SHA-256 da proposta comercial canônica
}

export class ProposalArtifactGenerator {
  public static generate(input: ProposalArtifactsInput): GeneratedProposalArtifacts {
    const {
      proposalNumber,
      version,
      organizationName,
      providerName,
      projectCode,
      projectTitle,
      scopeContent,
      feasibilityContent,
      pricingResult,
      validUntil
    } = input;

    // 1. INTEGRATION_SCOPE.html
    const scopeHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Escopo Técnico da Integração — ${proposalNumber} v${version}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 40px auto; padding: 20px; }
    h1 { color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
    h2 { color: #334155; margin-top: 24px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; background: #e0f2fe; color: #0369a1; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
    ul { padding-left: 20px; }
    .footer { margin-top: 40px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  </style>
</head>
<body>
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <h1>Birthub 360° — Escopo Técnico</h1>
    <span class="badge">Proposta ${proposalNumber} • Versão ${version}</span>
  </div>
  <p><strong>Projeto:</strong> ${projectCode} — ${projectTitle}</p>
  <p><strong>Organização:</strong> ${organizationName} | <strong>Provedor Alvo:</strong> ${providerName}</p>
  <p><strong>Prazo Estimado de Execução:</strong> ${scopeContent.estimatedTimelineDays} dias úteis</p>

  <h2>1. Objetivo & Justificativa</h2>
  <p><strong>Objetivo:</strong> ${scopeContent.objective}</p>
  <p><strong>Justificativa:</strong> ${scopeContent.justification}</p>

  <h2>2. Entregáveis Contratados</h2>
  <ul>
    ${scopeContent.deliverables.map((d) => `<li>${d}</li>`).join('')}
  </ul>

  <h2>3. Funcionalidades Incluídas vs. Excluídas</h2>
  <table>
    <tr><th>Incluído no Escopo</th><th>Excluído do Escopo</th></tr>
    <tr>
      <td><ul>${scopeContent.includedFeatures.map((f) => `<li>${f}</li>`).join('')}</ul></td>
      <td><ul>${scopeContent.excludedFeatures.map((f) => `<li>${f}</li>`).join('')}</ul></td>
    </tr>
  </table>

  <h2>4. Entidades, Campos & Direção de Sincronização</h2>
  <table>
    <tr><th>Entidade Remota</th><th>Entidade Birthub</th><th>Campos Mapeados</th><th>Direção</th></tr>
    ${scopeContent.integratedEntities
      .map(
        (e) => `<tr>
      <td><code>${e.name}</code></td>
      <td><code>${e.localTarget}</code></td>
      <td>${e.fields.join(', ')}</td>
      <td>${e.syncDirection}</td>
    </tr>`
      )
      .join('')}
  </table>

  <h2>5. Pré-requisitos & Critérios de Aceite</h2>
  <p><strong>Pré-requisitos do Cliente:</strong></p>
  <ul>
    ${scopeContent.clientPrerequisites.map((p) => `<li>${p}</li>`).join('')}
  </ul>
  <p><strong>Critérios de Aceite da Entrega:</strong></p>
  <ul>
    ${scopeContent.acceptanceCriteria.map((c) => `<li>${c}</li>`).join('')}
  </ul>

  <div class="footer">
    Documento integrante da proposta ${proposalNumber} v${version}. Gerado em ${new Date().toLocaleDateString('pt-BR')}.
  </div>
</body>
</html>`;

    // 2. TECHNICAL_FEASIBILITY.html
    const feasibilityHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Análise de Viabilidade Técnica — ${providerName}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 40px auto; padding: 20px; }
    h1 { color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
    .badge-feasible { background: #dcfce7; color: #15803d; }
    .badge-complex { background: #fef3c7; color: #b45309; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  <h1>Birthub 360° — Relatório de Viabilidade Técnica</h1>
  <p><strong>Provedor Analisado:</strong> ${providerName}</p>
  <p><strong>Veredito:</strong> <span class="badge badge-feasible">${feasibilityContent.verdict}</span> | <strong>Complexidade:</strong> <span class="badge badge-complex">${feasibilityContent.complexity}</span></p>

  <h2>Parâmetros Técnicos Identificados</h2>
  <table>
    <tr><th>Parâmetro</th><th>Situação</th></tr>
    <tr><td>API Oficial</td><td>${feasibilityContent.hasOfficialApi ? 'Confirmada' : 'Sob consulta / Proprietária'}</td></tr>
    <tr><td>Documentação</td><td>${feasibilityContent.documentationUrl || 'Pública / Fornecida pelo cliente'}</td></tr>
    <tr><td>Autenticação</td><td>${feasibilityContent.authMethods.join(', ') || 'Pendente'}</td></tr>
    <tr><td>Webhooks</td><td>${feasibilityContent.supportsWebhooks ? 'Suportado' : 'Indisponível / Polling necessário'}</td></tr>
    <tr><td>Limites de Uso</td><td>${feasibilityContent.rateLimitNotes || 'Sob limites padrão da API'}</td></tr>
  </table>

  <h2>Riscos e Incertezas Mapeados</h2>
  <p><strong>Riscos Técnicos:</strong></p>
  <ul>${feasibilityContent.risks.map((r) => `<li>${r}</li>`).join('')}</ul>
  ${feasibilityContent.uncertainties.length > 0 ? `<p><strong>Incertezas que exigem alinhamento:</strong></p><ul>${feasibilityContent.uncertainties.map((u) => `<li>${u}</li>`).join('')}</ul>` : ''}
</body>
</html>`;

    // 3. ESTIMATE_BREAKDOWN.json
    const estimateBreakdownJson = canonicalJson(pricingResult);

    // 4. COMMERCIAL_PROPOSAL.html
    const oneTime = pricingResult.clientBreakdown.oneTimeFee;
    const monthly = pricingResult.clientBreakdown.recurringMonthly;

    const proposalHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Proposta Comercial de Integração — ${proposalNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 40px auto; padding: 20px; }
    .header { border-bottom: 3px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; }
    .brand { font-size: 24px; font-weight: bold; color: #0284c7; }
    .title { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 8px; }
    .price-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .total-highlight { font-size: 26px; font-weight: bold; color: #0284c7; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
    th { background: #f1f5f9; }
    .amount { text-align: right; font-family: monospace; font-size: 14px; }
    .notice { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; margin: 20px 0; font-size: 13px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Birthub 360° Regeneration — Integration Factory</div>
    <div class="title">Proposta Comercial de Integração #${proposalNumber} (Versão ${version})</div>
    <p>Cliente: <strong>${organizationName}</strong> | Provedor: <strong>${providerName}</strong> | Validade: <strong>${new Date(validUntil).toLocaleDateString('pt-BR')}</strong></p>
  </div>

  <h2>1. Investimento Único de Implantação & Desenvolvimento</h2>
  <table>
    <tr><th>Item</th><th class="amount">Valor (R$)</th></tr>
    <tr><td>Desenvolvimento Sob Demanda do Conector</td><td class="amount">R$ ${oneTime.onDemandDevelopment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
    <tr><td>Setup, Mapeamento de Dados, Testes e Homologação</td><td class="amount">R$ ${oneTime.setupAndDeployment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
    <tr><td>Documentação Técnica e Treinamento Operacional</td><td class="amount">R$ ${oneTime.trainingAndDocumentation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
    <tr><td><strong>Subtotal de Implantação</strong></td><td class="amount"><strong>R$ ${oneTime.subtotalOneTime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td></tr>
    ${oneTime.discountAmount > 0 ? `<tr><td style="color: #16a34a;">Desconto Comercial Aplicado (${pricingResult.discountPct}%)</td><td class="amount" style="color: #16a34a;">- R$ ${oneTime.discountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>` : ''}
    <tr style="background: #f0f9ff;"><td style="font-size: 16px;"><strong>VALOR TOTAL DA IMPLANTAÇÃO (TAXA ÚNICA)</strong></td><td class="amount" style="font-size: 16px; font-weight: bold; color: #0284c7;">R$ ${oneTime.totalOneTime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
  </table>

  <h2>2. Serviços Recorrentes e Manutenção (Mensalidade)</h2>
  <table>
    <tr><th>Serviço Recorrente</th><th class="amount">Valor Mensal (R$)</th></tr>
    <tr><td>Manutenção Preventiva e Atualização de APIs</td><td class="amount">R$ ${monthly.maintenance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
    <tr><td>Suporte Operacional Especializado</td><td class="amount">R$ ${monthly.support.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
    <tr><td>Licenciamento Externo de Provedor (se aplicável)</td><td class="amount">R$ ${monthly.externalLicenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
    <tr><td>Consumo Variável Estimado de Chamadas de API</td><td class="amount">R$ ${monthly.projectedConsumption.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
    <tr style="background: #f8fafc;"><td style="font-size: 15px;"><strong>TOTAL MENSAL ESTIMADO</strong></td><td class="amount" style="font-size: 15px; font-weight: bold;">R$ ${monthly.totalMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</td></tr>
  </table>

  ${pricingResult.clientBreakdown.planCoveredComponents.length > 0 ? `<div class="notice"><strong>Benefícios Inclusos no seu Plano Atual:</strong><ul>${pricingResult.clientBreakdown.planCoveredComponents.map((c) => `<li>${c}</li>`).join('')}</ul></div>` : ''}

  <h2>3. Condições Comerciais e Prazos</h2>
  <p>• Prazo estimado de desenvolvimento: <strong>${scopeContent.estimatedTimelineDays} dias úteis</strong> após autorização formal.</p>
  <p>• Pagamento da implantação: 50% na autorização do projeto e 50% na homologação final da entrega.</p>
  <p>• Validade desta proposta: até <strong>${new Date(validUntil).toLocaleDateString('pt-BR')}</strong>.</p>
</body>
</html>`;

    // 5. ACCEPTANCE_TERMS.html
    const acceptanceTermsHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Termos de Aceite Comercial — ${proposalNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 40px auto; padding: 20px; }
    h1 { color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
    .alert-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 16px; margin: 20px 0; }
    ol { padding-left: 20px; }
    li { margin-bottom: 10px; }
  </style>
</head>
<body>
  <h1>Termo de Aceite Comercial e Autorização de Projeto</h1>
  <p>Proposta: <strong>${proposalNumber}</strong> | Versão: <strong>${version}</strong></p>
  <p>Contratante: <strong>${organizationName}</strong></p>

  <div class="alert-box">
    <strong>ATENÇÃO — EFEITOS LEGAIS E OPERACIONAIS DO ACEITE:</strong><br>
    O clique no botão de aceite formaliza o acordo sobre os valores de implantação de <strong>R$ ${oneTime.totalOneTime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> e as condições aqui descritas. O desenvolvimento efetivo terá início imediatamente após a confirmação da autorização interna da plataforma.
  </div>

  <h2>Cláusulas Principais:</h2>
  <ol>
    <li><strong>Vinculação ao Escopo Específico:</strong> O projeto será executado estritamente conforme o documento de escopo técnico versão ${version}. Qualquer alteração material posterior ensejará um Change Request com nova proposta complementar sujeita a aceite.</li>
    <li><strong>Bloqueio Comercial:</strong> A contratante reconhece que nenhuma linha de código específico ou sincronização em produção é executada antes da aprovação formal e da autorização interna correspondente.</li>
    <li><strong>Garantia e Homologação:</strong> A contratada concederá 30 dias de garantia técnica após a homologação para correção de eventuais desvios em relação ao escopo acordado.</li>
    <li><strong>Assinatura Eletrônica e Rastreabilidade:</strong> Este aceite é registrado eletronicamente com registro de data/hora, identificador do usuário responsável, hash de integridade SHA-256 e IP de origem.</li>
  </ol>
</body>
</html>`;

    // Hash canônico da proposta
    const canonicalPayload = {
      proposalNumber,
      version,
      organizationName,
      providerName,
      projectCode,
      oneTimeTotal: oneTime.totalOneTime,
      monthlyTotal: monthly.totalMonthly,
      scopeHash: hashDocument(scopeContent),
      feasibilityHash: hashDocument(feasibilityContent),
      validUntil
    };

    const contentHash = hashDocument(canonicalPayload);

    return {
      scopeHtml,
      feasibilityHtml,
      proposalHtml,
      estimateBreakdownJson,
      acceptanceTermsHtml,
      contentHash
    };
  }
}
