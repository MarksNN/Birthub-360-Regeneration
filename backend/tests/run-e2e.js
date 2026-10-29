async function runE2E() {
  try {
    const loginRes = await fetch("http://127.0.0.1:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@birthhub360.com", password: "admin123" })
    });
    const login = await loginRes.json();
    console.log("LOGIN_STATUS:", login.success);
    console.log("USER_NAME:", login.user.name);
    console.log("USER_ROLE:", login.user.role);

    const metricsRes = await fetch("http://127.0.0.1:3001/api/dashboard/metrics", {
      headers: { Authorization: `Bearer ${login.token}` }
    });
    const metrics = await metricsRes.json();
    console.log("COMPANIES_COUNT:", metrics.data.summary.totalCompanies);
    console.log("LEADS_COUNT:", metrics.data.summary.totalLeads);
    console.log("DEALS_COUNT:", metrics.data.summary.totalDeals);
    console.log("PIPELINE_AMOUNT:", metrics.data.summary.totalPipelineAmount);

    const supRes = await fetch("http://127.0.0.1:3001/api/supervisor/orchestrate", {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${login.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ targetModule: "CRM", prompt: "Analisar novas contas e pontuar ICP" })
    });
    const sup = await supRes.json();
    console.log("SUPERVISOR_ROUTED_AGENT:", sup.data.suggestedAgentName);
    console.log("SUPERVISOR_TOOLS:", sup.data.requiredTools.join(", "));
    console.log("SUPERVISOR_RBAC_PASS:", sup.data.authorizationCheck.hasPermission);
    process.exit(0);
  } catch (err) {
    console.error("E2E_ERROR:", err);
    process.exit(1);
  }
}
runE2E();
