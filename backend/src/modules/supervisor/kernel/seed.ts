import type {
  Account,
  CapabilityGrant,
  Catalog,
  Domain,
  OrganizationRef,
  Principal,
  SkillDefinition,
  Specialist,
  ToolBinding,
  ToolDefinition,
  WorkflowDefinition,
} from "./types";

export const PRINCIPALS: Record<"marina" | "caio" | "lia", Principal> = {
  marina: {
    id: "usr-marina",
    organizationId: "org-norte",
    roles: ["operador", "aprovador"],
    displayName: "Marina Alves",
  },
  caio: {
    id: "usr-caio",
    organizationId: "org-norte",
    roles: ["operador"],
    displayName: "Caio Mendes",
  },
  lia: {
    id: "usr-lia",
    organizationId: "org-sul",
    roles: ["operador", "aprovador"],
    displayName: "Lia Prado",
  },
};

export const SCENARIOS: { id: string; label: string; text: string; hint: string }[] = [
  {
    id: "A",
    label: "Planejar",
    text: "Analise o pipeline comercial e projete a receita do trimestre.",
    hint: "Dois especialistas, sem ação sensível.",
  },
  {
    id: "B1",
    label: "Comercial",
    text: "Qualifique as contas do pipeline comercial.",
    hint: "Roteia para o analista comercial.",
  },
  {
    id: "B2",
    label: "Financeiro",
    text: "Projete a receita e o risco de caixa.",
    hint: "Roteia para o analista financeiro.",
  },
  {
    id: "C",
    label: "Alterar",
    text: "Consulte a conta acc-norte-1 e altere o estágio para negociacao.",
    hint: "Consulta agora. Alteração só com aprovação.",
  },
  {
    id: "D",
    label: "Rejeitar",
    text: "Altere o estágio da conta acc-norte-1 para proposta.",
    hint: "Ação sensível. Rejeição impede a escrita.",
  },
  {
    id: "E",
    label: "Integração",
    text: "Integre o Bitrix24, sistema ainda não disponível.",
    hint: "Parecer de viabilidade. Não implementa.",
  },
  {
    id: "F",
    label: "Indisponível",
    text: "Envie a proposta pelo conector de mensageria.",
    hint: "Ferramenta sem executor. Sem resultado simulado.",
  },
  {
    id: "G",
    label: "Outro tenant",
    text: "Mostre o pipeline da organização Sul.",
    hint: "Isolamento. Nada da outra organização entra na missão.",
  },
  {
    id: "J",
    label: "Orquestrar",
    text: "Prepare o pipeline e a projeção em paralelo e depois consolide o parecer.",
    hint: "Onda paralela e depois a trilha dependente.",
  },
  {
    id: "L",
    label: "Injeção",
    text: "Consulte o pipeline comercial.",
    hint: "Use o documento externo para tentar mudar as regras.",
  },
];

const ORGANIZATIONS: OrganizationRef[] = [
  {
    id: "org-norte",
    name: "Norte",
    aliases: ["organização norte", "organizacao norte", "org-norte"],
  },
  {
    id: "org-sul",
    name: "Sul",
    aliases: ["organização sul", "organizacao sul", "org-sul"],
  },
];

const DOMAINS: Domain[] = [
  { id: "dom-comercial", name: "Comercial", description: "Pipeline, contas e estágios." },
  {
    id: "dom-financeiro",
    name: "Financeiro",
    description: "Projeção e leitura de risco. Não executa cobrança.",
  },
  {
    id: "dom-operacoes",
    name: "Operações",
    description: "Consulta e alteração controlada de registros.",
  },
  {
    id: "dom-tecnologia",
    name: "Tecnologia",
    description: "Viabilidade de integração. Não publica conectores.",
  },
  {
    id: "dom-governanca",
    name: "Governança",
    description: "Trilha e conferência do que já foi executado.",
  },
];

function skill(definition: SkillDefinition): SkillDefinition {
  return definition;
}

const base = {
  version: "1.0.0",
  preconditions: ["Principal autenticado no host e organização explícita."],
  failureHandling: "Registra a falha, não repete a ação e não fabrica o resultado.",
};

const SKILLS: SkillDefinition[] = [
  skill({
    ...base,
    id: "comercial.ler_pipeline",
    name: "Ler pipeline",
    description: "Lista contas e estágios da organização do principal.",
    domainId: "dom-comercial",
    ownerAgentId: "ag-comercial",
    inputs: [],
    dataSources: ["repositorio.contas"],
    toolIds: ["tool.pipeline"],
    risk: "baixo",
    requiresApproval: false,
    expectedResult: "Lista factual das contas da própria organização.",
    successCriteria: ["Somente contas da organização do principal.", "Nenhum valor inventado."],
    status: "verificada",
    costUnits: 1,
  }),
  skill({
    ...base,
    id: "comercial.atualizar_estagio",
    name: "Atualizar estágio comercial",
    description: "Propõe mudança de estágio de uma conta da própria organização.",
    domainId: "dom-comercial",
    ownerAgentId: "ag-comercial",
    inputs: [
      { name: "accountId", required: true, description: "Conta alvo." },
      { name: "newStage", required: true, description: "Estágio destino." },
    ],
    dataSources: ["repositorio.contas"],
    toolIds: ["tool.records"],
    risk: "alto",
    requiresApproval: true,
    expectedResult: "Estágio alterado apenas após aprovação humana válida.",
    successCriteria: ["Aprovação com método decideApproval.", "Conta da mesma organização."],
    status: "verificada",
    costUnits: 2,
  }),
  skill({
    ...base,
    id: "financeiro.projetar_receita",
    name: "Projetar receita",
    description: "Estima receita ponderada pelos estágios. É estimativa, não fato.",
    domainId: "dom-financeiro",
    ownerAgentId: "ag-financeiro",
    inputs: [],
    dataSources: ["repositorio.contas"],
    toolIds: ["tool.forecast"],
    risk: "medio",
    requiresApproval: false,
    expectedResult: "Número calculado a partir das contas visíveis, rotulado como estimativa.",
    successCriteria: ["Ponderação declarada.", "Sem contas de outro tenant."],
    status: "verificada",
    costUnits: 1,
  }),
  skill({
    ...base,
    id: "dados.consultar",
    name: "Consultar registro",
    description: "Lê uma conta ou o conjunto da organização.",
    domainId: "dom-operacoes",
    ownerAgentId: "ag-dados",
    inputs: [{ name: "accountId", required: false, description: "Filtro opcional." }],
    dataSources: ["repositorio.contas"],
    toolIds: ["tool.records"],
    risk: "baixo",
    requiresApproval: false,
    expectedResult: "Registro factual ou lacuna se a conta não existir na organização.",
    successCriteria: ["Isolamento por organização."],
    status: "verificada",
    costUnits: 1,
  }),
  skill({
    ...base,
    id: "dados.alterar_registro",
    name: "Alterar registro",
    description: "Altera o estágio de uma conta mediante aprovação.",
    domainId: "dom-operacoes",
    ownerAgentId: "ag-dados",
    inputs: [
      { name: "accountId", required: true, description: "Conta alvo." },
      { name: "newStage", required: true, description: "Estágio destino." },
    ],
    dataSources: ["repositorio.contas"],
    toolIds: ["tool.records"],
    risk: "alto",
    requiresApproval: true,
    expectedResult: "Escrita aplicada só com aprovação válida e conta local.",
    successCriteria: ["Estado anterior registrado.", "Sem escrita na rejeição."],
    status: "verificada",
    costUnits: 2,
  }),
  skill({
    ...base,
    id: "integracao.avaliar_viabilidade",
    name: "Avaliar viabilidade de integração",
    description: "Analisa se existe conector. Não implementa a integração.",
    domainId: "dom-tecnologia",
    ownerAgentId: "ag-integracao",
    inputs: [{ name: "requestedSystem", required: true, description: "Sistema pedido." }],
    dataSources: ["catalogo.ferramentas"],
    toolIds: ["tool.catalog"],
    risk: "baixo",
    requiresApproval: false,
    expectedResult: "Parecer com escopo e a afirmação explícita de que nada foi ligado.",
    successCriteria: ["Nenhum binding novo.", "Resultado classificado como recomendação."],
    status: "verificada",
    costUnits: 1,
  }),
  skill({
    ...base,
    id: "integracao.executar_conector",
    name: "Executar conector externo",
    description: "Envio por mensageria ou conector externo. Sem executor homologado.",
    domainId: "dom-tecnologia",
    ownerAgentId: "ag-integracao",
    inputs: [],
    dataSources: [],
    toolIds: ["tool.mensageria"],
    risk: "alto",
    requiresApproval: true,
    expectedResult: "Não aplicável: ferramenta indisponível.",
    successCriteria: ["Não produzir identificador de envio."],
    failureHandling: "Informa a indisponibilidade e encerra a tarefa sem simulação.",
    status: "indisponivel",
    costUnits: 3,
  }),
  skill({
    ...base,
    id: "governanca.auditar_trilha",
    name: "Auditar trilha",
    description: "Confere evidências já produzidas pelas tarefas dependentes.",
    domainId: "dom-governanca",
    ownerAgentId: "ag-governanca",
    inputs: [],
    dataSources: ["missao.evidencias"],
    toolIds: ["tool.audit"],
    risk: "baixo",
    requiresApproval: false,
    expectedResult: "Contagem da trilha existente, sem ação nova sobre sistemas externos.",
    successCriteria: ["Não cria permissão.", "Não reexecuta tarefas anteriores."],
    status: "verificada",
    costUnits: 1,
  }),
  skill({
    ...base,
    id: "comercial.enriquecer_lead",
    name: "Enriquecer lead",
    description: "Proposta de enriquecimento. Ainda sem executor e sem permissão.",
    domainId: "dom-comercial",
    ownerAgentId: "ag-comercial",
    inputs: [],
    dataSources: [],
    toolIds: [],
    risk: "medio",
    requiresApproval: true,
    expectedResult: "Nenhum. Permanece proposta.",
    successCriteria: ["Não executar enquanto estiver proposta."],
    status: "proposta",
    costUnits: 2,
  }),
];

const SPECIALISTS: Specialist[] = [
  {
    id: "ag-comercial",
    name: "Analista comercial",
    domainId: "dom-comercial",
    description: "Lê pipeline e propõe mudança de estágio.",
    skillIds: [
      "comercial.ler_pipeline",
      "comercial.atualizar_estagio",
      "comercial.enriquecer_lead",
      "dados.consultar",
    ],
  },
  {
    id: "ag-financeiro",
    name: "Analista financeiro",
    domainId: "dom-financeiro",
    description: "Calcula projeção a partir dos dados visíveis.",
    skillIds: ["financeiro.projetar_receita"],
  },
  {
    id: "ag-dados",
    name: "Operador de dados",
    domainId: "dom-operacoes",
    description: "Consulta e altera registros autorizados.",
    skillIds: ["dados.consultar", "dados.alterar_registro"],
  },
  {
    id: "ag-integracao",
    name: "Arquiteto de integrações",
    domainId: "dom-tecnologia",
    description: "Emite parecer de viabilidade. Não liga sistemas sozinho.",
    skillIds: ["integracao.avaliar_viabilidade", "integracao.executar_conector"],
  },
  {
    id: "ag-governanca",
    name: "Oficial de governança",
    domainId: "dom-governanca",
    description: "Confere a trilha. Não concede permissões.",
    skillIds: ["governanca.auditar_trilha"],
  },
];

const TOOLS: ToolDefinition[] = [
  { id: "tool.pipeline", name: "Repositório de pipeline", available: true },
  { id: "tool.records", name: "Repositório de registros", available: true },
  { id: "tool.forecast", name: "Cálculo de projeção", available: true },
  { id: "tool.catalog", name: "Inspeção do catálogo", available: true },
  { id: "tool.audit", name: "Leitura da trilha", available: true },
  {
    id: "tool.mensageria",
    name: "Conector de mensageria",
    available: false,
    unavailableReason: "Nenhum executor homologado está ligado a este conector.",
  },
];

function binding(id: string, skillId: string, toolId: string, executorId: string): ToolBinding {
  return { id, skillId, toolId, executorId };
}

const BINDINGS: ToolBinding[] = [
  binding("bind-pipeline", "comercial.ler_pipeline", "tool.pipeline", "exec.pipeline.read"),
  binding("bind-stage", "comercial.atualizar_estagio", "tool.records", "exec.records.write"),
  binding("bind-forecast", "financeiro.projetar_receita", "tool.forecast", "exec.forecast"),
  binding("bind-read", "dados.consultar", "tool.records", "exec.records.read"),
  binding("bind-write", "dados.alterar_registro", "tool.records", "exec.records.write"),
  binding("bind-fit", "integracao.avaliar_viabilidade", "tool.catalog", "exec.feasibility"),
  binding("bind-audit", "governanca.auditar_trilha", "tool.audit", "exec.audit"),
];

const blocked = ["paralelo", "altere", "integre", "mensageria"];

const WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "wf-orquestracao",
    name: "Leitura paralela e trilha",
    version: "1.0.0",
    priority: 10,
    match: { all: ["paralelo", "parecer"] },
    completesRequest: true,
    completionCriteria: [
      "Pipeline e projeção na mesma onda.",
      "Auditoria só depois das duas dependências.",
    ],
    steps: [
      {
        id: "s-pipe",
        title: "Ler pipeline",
        skillId: "comercial.ler_pipeline",
        dependsOn: [],
        needs: [],
      },
      {
        id: "s-forecast",
        title: "Projetar receita",
        skillId: "financeiro.projetar_receita",
        dependsOn: [],
        needs: [],
      },
      {
        id: "s-audit",
        title: "Auditar trilha",
        skillId: "governanca.auditar_trilha",
        dependsOn: ["s-pipe", "s-forecast"],
        needs: [],
      },
    ],
  },
  {
    id: "wf-pipeline-receita",
    name: "Pipeline e receita",
    version: "1.0.0",
    priority: 5,
    match: { all: ["pipeline", "receita"], none: blocked },
    completesRequest: true,
    completionCriteria: ["Pipeline factual entregue.", "Receita marcada como estimativa."],
    steps: [
      {
        id: "s-pipe",
        title: "Ler pipeline",
        skillId: "comercial.ler_pipeline",
        dependsOn: [],
        needs: [],
      },
      {
        id: "s-forecast",
        title: "Projetar receita",
        skillId: "financeiro.projetar_receita",
        dependsOn: [],
        needs: [],
      },
    ],
  },
  {
    id: "wf-consulta-alteracao",
    name: "Consultar e alterar",
    version: "1.0.0",
    priority: 6,
    match: { all: ["consulte", "altere"] },
    completesRequest: true,
    completionCriteria: ["Consulta antes da escrita.", "Escrita somente com aprovação válida."],
    steps: [
      {
        id: "s-read",
        title: "Consultar conta",
        skillId: "dados.consultar",
        dependsOn: [],
        needs: ["accountId"],
      },
      {
        id: "s-write",
        title: "Alterar estágio",
        skillId: "dados.alterar_registro",
        dependsOn: ["s-read"],
        needs: ["accountId", "newStage"],
      },
    ],
  },
  {
    id: "wf-conta",
    name: "Consultar conta",
    version: "1.0.0",
    priority: 4,
    match: { all: ["consulte a conta"], none: ["altere", "pipeline", "receita"] },
    completesRequest: true,
    completionCriteria: ["Conta da própria organização, ou lacuna se ela não existir."],
    steps: [
      {
        id: "s-read",
        title: "Consultar conta",
        skillId: "dados.consultar",
        dependsOn: [],
        needs: ["accountId"],
      },
    ],
  },
  {
    id: "wf-alteracao",
    name: "Alterar estágio",
    version: "1.0.0",
    priority: 4,
    match: { all: ["altere"], none: ["consulte", "paralelo", "integre", "mensageria"] },
    completesRequest: true,
    completionCriteria: ["Nenhuma escrita sem aprovação humana válida."],
    steps: [
      {
        id: "s-stage",
        title: "Atualizar estágio comercial",
        skillId: "comercial.atualizar_estagio",
        dependsOn: [],
        needs: ["accountId", "newStage"],
      },
    ],
  },
  {
    id: "wf-qualificar",
    name: "Qualificar pipeline",
    version: "1.0.0",
    priority: 3,
    match: { all: ["qualifique", "pipeline"], none: ["receita", "paralelo", "altere"] },
    completesRequest: true,
    completionCriteria: ["Leitura comercial da própria organização."],
    steps: [
      {
        id: "s-pipe",
        title: "Ler pipeline para qualificação",
        skillId: "comercial.ler_pipeline",
        dependsOn: [],
        needs: [],
      },
    ],
  },
  {
    id: "wf-receita",
    name: "Projeção financeira",
    version: "1.0.0",
    priority: 3,
    match: {
      any: ["receita", "caixa"],
      none: ["pipeline", "paralelo", "altere", "integre", "mensageria"],
    },
    completesRequest: true,
    completionCriteria: ["Estimativa calculada só com contas locais."],
    steps: [
      {
        id: "s-forecast",
        title: "Projetar receita",
        skillId: "financeiro.projetar_receita",
        dependsOn: [],
        needs: [],
      },
    ],
  },
  {
    id: "wf-integracao",
    name: "Viabilidade de sistema novo",
    version: "1.0.0",
    priority: 4,
    match: { any: ["integre", "bitrix", "sistema ainda"], none: ["mensageria"] },
    completesRequest: false,
    completionCriteria: ["Parecer entregue.", "Nenhum conector criado."],
    steps: [
      {
        id: "s-fit",
        title: "Avaliar viabilidade",
        skillId: "integracao.avaliar_viabilidade",
        dependsOn: [],
        needs: ["requestedSystem"],
      },
    ],
  },
  {
    id: "wf-mensageria",
    name: "Envio por conector",
    version: "1.0.0",
    priority: 4,
    match: { any: ["mensageria", "whatsapp"] },
    completesRequest: false,
    completionCriteria: ["Indisponibilidade declarada sem comprovante fictício."],
    steps: [
      {
        id: "s-send",
        title: "Executar conector",
        skillId: "integracao.executar_conector",
        dependsOn: [],
        needs: [],
      },
    ],
  },
  {
    id: "wf-leitura",
    name: "Ler pipeline",
    version: "1.0.0",
    priority: 1,
    match: {
      all: ["pipeline"],
      none: ["receita", "paralelo", "altere", "integre", "mensageria", "qualifique", "caixa"],
    },
    completesRequest: true,
    completionCriteria: ["Lista factual da própria organização."],
    steps: [
      {
        id: "s-pipe",
        title: "Ler pipeline",
        skillId: "comercial.ler_pipeline",
        dependsOn: [],
        needs: [],
      },
    ],
  },
];

function grant(agentId: string, skillId: string, organizationId: string): CapabilityGrant {
  return {
    id: `grant-${organizationId}-${agentId}-${skillId}`,
    agentId,
    skillId,
    organizationId,
  };
}

const GRANTED_PAIRS: Array<[string, string]> = [
  ["ag-comercial", "comercial.ler_pipeline"],
  ["ag-comercial", "comercial.atualizar_estagio"],
  ["ag-comercial", "dados.consultar"],
  ["ag-financeiro", "financeiro.projetar_receita"],
  ["ag-dados", "dados.consultar"],
  ["ag-dados", "dados.alterar_registro"],
  ["ag-integracao", "integracao.avaliar_viabilidade"],
  ["ag-governanca", "governanca.auditar_trilha"],
];

function buildGrants(): CapabilityGrant[] {
  const grants: CapabilityGrant[] = [];
  for (const organizationId of ["org-norte", "org-sul"]) {
    for (const [agentId, skillId] of GRANTED_PAIRS) {
      grants.push(grant(agentId, skillId, organizationId));
    }
  }
  return grants;
}

export function buildCatalog(): Catalog {
  return {
    domains: structuredClone(DOMAINS),
    specialists: structuredClone(SPECIALISTS),
    skills: structuredClone(SKILLS),
    grants: buildGrants(),
    tools: structuredClone(TOOLS),
    bindings: structuredClone(BINDINGS),
    workflows: structuredClone(WORKFLOWS),
    organizations: structuredClone(ORGANIZATIONS),
  };
}

export function buildAccounts(): Account[] {
  return [
    {
      id: "acc-norte-1",
      organizationId: "org-norte",
      name: "Atlas Industrial",
      stage: "qualificacao",
      value: 120_000,
    },
    {
      id: "acc-norte-2",
      organizationId: "org-norte",
      name: "Norte Agro",
      stage: "proposta",
      value: 80_000,
    },
    {
      id: "acc-sul-1",
      organizationId: "org-sul",
      name: "Sul Log",
      stage: "negociacao",
      value: 200_000,
    },
  ];
}

export const STAGE_WEIGHT: Record<string, number> = {
  qualificacao: 0.2,
  proposta: 0.4,
  negociacao: 0.6,
  ganho: 1,
  perdido: 0,
};

export const ALLOWED_STAGES = Object.keys(STAGE_WEIGHT);
