const fs = require('fs');
const path = require('path');

const mappingDir = 'C:/Birthub 360  Regeneration/02_Mapeamento de Capacidades - 394 Agentes-20261029/Mapeamento de Capacidades - 394 Agentes';
const snap = JSON.parse(fs.readFileSync(path.join(mappingDir, 'BIRTHUB360_CATALOGO_SNAPSHOT_394.json'), 'utf8'));
const map = JSON.parse(fs.readFileSync(path.join(mappingDir, 'BIRTHUB360_MAPEAMENTO_FUNCIONAL_394_AGENTES.json'), 'utf8'));
const plano = JSON.parse(fs.readFileSync(path.join(mappingDir, 'BIRTHUB360_PLANO_CAPACIDADES_394.json'), 'utf8'));

const grantsByCode = new Map();
for (const g of snap.grants.agentCapabilities) {
  grantsByCode.set(g.agentCode, g);
}

const planoByCode = new Map();
for (const p of plano.agents) {
  planoByCode.set(p.agentCode, p);
}

// Os agentes com implementação real e ferramentas operacionais no backend da Fase 01/02
const executableBindings = {
  'sdr-qualification': {
    requiredRole: 'SDR',
    allowedTools: ['read_crm_state', 'create_crm_activity', 'inspect_crm_pipeline']
  },
  'bdr-outbound': {
    requiredRole: 'BDR',
    allowedTools: ['create_crm_activity', 'read_overdue_activities', 'read_crm_state']
  },
  'closer-sales': {
    requiredRole: 'CLOSER',
    allowedTools: ['inspect_crm_pipeline', 'create_crm_activity', 'read_crm_state']
  },
  'revenue-intelligence': {
    requiredRole: 'MANAGER',
    allowedTools: ['calculate_revops_metrics', 'inspect_crm_pipeline']
  },
  'manager-commercial': {
    requiredRole: 'MANAGER',
    allowedTools: ['calculate_revops_metrics', 'inspect_crm_pipeline', 'read_overdue_activities']
  },
  'coordinator-commercial': {
    requiredRole: 'MANAGER',
    allowedTools: ['inspect_crm_pipeline', 'read_overdue_activities', 'create_crm_activity']
  },
  'ldr-intelligence': {
    requiredRole: 'SDR',
    allowedTools: ['read_crm_state', 'inspect_crm_pipeline']
  },
  'account-detective': {
    requiredRole: 'SDR',
    allowedTools: ['read_crm_state', 'inspect_crm_pipeline']
  }
};

function inferRequiredRole(agent) {
  if (executableBindings[agent.code]) {
    return executableBindings[agent.code].requiredRole;
  }
  const roleStr = (agent.role || '').toUpperCase();
  const domainStr = (agent.domain || '').toUpperCase();
  if (roleStr.includes('DIRETORIA') || domainStr === 'EXECUTIVO' || domainStr === 'COMPLIANCE/JURÍDICO') {
    return 'ADMIN';
  }
  if (roleStr.includes('GERENTE') || roleStr.includes('COORDENADOR') || roleStr.includes('FINANCE') || domainStr === 'FINANCEIRO' || domainStr === 'OPERAÇÕES') {
    return 'MANAGER';
  }
  if (roleStr.includes('CLOSER') || (agent.subgroup || '').toLowerCase().includes('negociação')) {
    return 'CLOSER';
  }
  if (roleStr.includes('BDR') || (agent.subgroup || '').toLowerCase().includes('outbound')) {
    return 'BDR';
  }
  return 'SDR';
}

const consolidated = map.agents.map((a) => {
  const grantInfo = grantsByCode.get(a.code) || { capabilityCodes: ['agent.discover', 'agent.execute', 'agent.request_cross_role'], source: 'UNIVERSAL_ONLY' };
  const planoInfo = planoByCode.get(a.code) || {};

  const universalCapabilities = (grantInfo.capabilityCodes || []).filter((c) => c.startsWith('agent.'));
  const domainGrantCodes = (a.currentDomainGrants || []).map((g) => g.code);
  const essentialCodes = (a.essentialFunctions || []).map((f) => f.code);
  const optionalCodes = (a.optionalFunctions || []).map((f) => f.code);

  const specializedCapabilities = Array.from(new Set([...domainGrantCodes, ...essentialCodes]));
  const allCapabilities = Array.from(new Set([...universalCapabilities, ...specializedCapabilities]));

  const isExec = Boolean(executableBindings[a.code]);
  const hasDomainGrant = domainGrantCodes.length > 0;
  const operationalStatus = isExec
    ? 'EXECUTABLE'
    : hasDomainGrant
    ? 'AVAILABLE'
    : 'REGISTERED';

  const verifiedTools = isExec
    ? executableBindings[a.code].allowedTools
    : domainGrantCodes.length > 0
    ? domainGrantCodes
    : ['agent.discover', 'agent.execute'];

  const scope = grantInfo.source === 'UNIVERSAL_ONLY' && a.origin === 'CATÁLOGO_NORMALIZADO' && domainGrantCodes.length === 0
    ? 'UNIVERSAL'
    : 'SPECIALIZED';

  return {
    agentCode: a.code,
    name: a.name,
    characterRole: a.role || null,
    domain: a.domain,
    subgroup: a.subgroup,
    origin: a.origin,
    sourcePath: a.sourcePath,
    sourceVersion: '79e150471d920b2737e6df6707c6afe5b10ed55d',
    scope,
    description: a.mission || a.sourceDescription || `Agente especializado em ${a.domain} - ${a.subgroup}`,
    mission: a.mission,
    functionalCore: a.functionalCore,
    trigger: a.trigger,
    universalCapabilities,
    specializedCapabilities,
    optionalCapabilities: optionalCodes,
    capabilities: allCapabilities,
    allowedTools: verifiedTools,
    inputs: a.inputs || [],
    outputs: a.outputs || [],
    workflow: a.workflow || [],
    dependencies: a.dependencies || [],
    permissionsSummary: {
      grantSource: grantInfo.source,
      currentDomainGrants: a.currentDomainGrants || [],
      handoff: a.handoff,
      approval: a.approval,
      riskCatalog: a.riskCatalog,
      riskReview: a.riskReview
    },
    promptRef: a.routeDeclared || a.sourcePath || `catalog://${a.code}`,
    bindingType: a.bindingType,
    operationalStatus,
    requiredRole: inferRequiredRole(a),
    isActive: true,
    isExecutable: isExec
  };
});

const outDir = 'C:/Users/Administrator/Documents/Marks/Birthub-360-Regeneration/backend/src/modules/supervisor/catalog';
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'agents-394.catalog.json');
fs.writeFileSync(
  outFile,
  JSON.stringify(
    {
      schemaVersion: '2026-10-29.v1',
      sourceSnapshot: '79e150471d920b2737e6df6707c6afe5b10ed55d',
      totalAgents: consolidated.length,
      summary: {
        total: consolidated.length,
        normalized: consolidated.filter((a) => a.origin === 'CATÁLOGO_NORMALIZADO').length,
        commercialCell: consolidated.filter((a) => a.origin === 'CÉLULA_COMERCIAL').length,
        executable: consolidated.filter((a) => a.operationalStatus === 'EXECUTABLE').length,
        available: consolidated.filter((a) => a.operationalStatus === 'AVAILABLE').length,
        registered: consolidated.filter((a) => a.operationalStatus === 'REGISTERED').length
      },
      agents: consolidated
    },
    null,
    2
  ),
  'utf8'
);

console.log('Generated catalog JSON successfully at:', outFile);
console.log('Total:', consolidated.length);
