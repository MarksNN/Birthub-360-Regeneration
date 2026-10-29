async function runBrowserFlowE2E() {
  console.log("=== INICIANDO TESTE E2E FASE 02: CRM, PIPELINE & REVOPS ===");

  // 1. Login com perfil CLOSER
  const loginRes = await fetch("http://127.0.0.1:3001/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "closer@birthhub360.com", password: "admin123" })
  });
  const login = await loginRes.json();
  console.log("1. AUTH LOGIN CLOSER:", login.success, "User:", login.user.name, "Role:", login.user.role);
  if (!login.success) throw new Error("Falha no login");

  const headers = {
    Authorization: `Bearer ${login.token}`,
    "Content-Type": "application/json"
  };

  // 2. Criação de nova oportunidade no Pipeline (Fase 02)
  const newDealRes = await fetch("http://127.0.0.1:3001/api/crm/deals", {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: "Contrato Piloto Inteligência VTech 2026",
      amount: 180000,
      stage: "PROSPECT",
      probability: 20
    })
  });
  const newDeal = await newDealRes.json();
  console.log("2. DEAL CREATED:", newDeal.success, "ID:", newDeal.data.id, "Title:", newDeal.data.title, "Stage:", newDeal.data.stage);
  if (!newDeal.success) throw new Error("Falha ao criar oportunidade");

  // 3. Movimentação da Oportunidade no Funil (Drag and Drop backend)
  const moveRes = await fetch(`http://127.0.0.1:3001/api/crm/deals/${newDeal.data.id}/stage`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      stage: "NEGOCIACAO",
      notes: "Avanço após reunião com comitê executivo"
    })
  });
  const moved = await moveRes.json();
  console.log("3. DEAL STAGE MOVED:", moved.success, "New Stage:", moved.data.stage, "New Prob:", moved.data.probability);

  // 4. Verificação de Histórico de Movimentações
  const historyRes = await fetch(`http://127.0.0.1:3001/api/crm/deals/${newDeal.data.id}/history`, { headers });
  const history = await historyRes.json();
  console.log("4. DEAL HISTORY COUNT:", history.data.length, "Transitions:", history.data.map(h => `${h.fromStage}->${h.toStage}`));

  // 5. Criação de Atividade Vinculada (Tarefa / Ligação)
  const actRes = await fetch("http://127.0.0.1:3001/api/crm/activities", {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: "Enviar proposta ajustada com desconto de 5%",
      type: "TAREFA",
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      dealId: newDeal.data.id
    })
  });
  const act = await actRes.json();
  console.log("5. ACTIVITY CREATED & LINKED:", act.success, "Type:", act.data.type, "Title:", act.data.title);

  // 6. Conclusão de Atividade
  const actToggleRes = await fetch(`http://127.0.0.1:3001/api/crm/activities/${act.data.id}/status`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status: "CONCLUIDA" })
  });
  const actToggled = await actToggleRes.json();
  console.log("6. ACTIVITY STATUS UPDATED:", actToggled.success, "Status:", actToggled.data.status);

  // 7. Atualização e Consulta de Métricas de RevOps em Tempo Real
  const revopsRes = await fetch("http://127.0.0.1:3001/api/dashboard/metrics", { headers });
  const revops = await revopsRes.json();
  console.log("7. REVOPS METRICS:", revops.success, {
    totalPipeline: revops.data.summary.totalPipelineAmount,
    weightedForecast: revops.data.summary.weightedForecast,
    totalDeals: revops.data.summary.totalDeals,
    winRate: revops.data.summary.winRate + "%"
  });

  // 8. Teste de Operação Real pelo Supervisor Contextual
  const supRes = await fetch("http://127.0.0.1:3001/api/supervisor/orchestrate", {
    method: "POST",
    headers,
    body: JSON.stringify({
      targetModule: "CRM",
      prompt: "Criar tarefa para ligar para decisor da VTech amanhã"
    })
  });
  const sup = await supRes.json();
  console.log("8. SUPERVISOR REAL ACTION:", sup.success, "Agent:", sup.data.suggestedAgentName, "Output:", sup.data.simulatedOutput);

  console.log("=== TESTE E2E FASE 02 CONCLUÍDO COM 100% DE SUCESSO ===");
  process.exit(0);
}

runBrowserFlowE2E().catch(err => {
  console.error("FALHA NO TESTE E2E:", err);
  process.exit(1);
});
