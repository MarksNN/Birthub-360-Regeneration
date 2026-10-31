# P3 — Priorização e alertas | Analista de Risco e Saúde de Deals

**Responsável:** `deal_health` · **Finalidade:** Monitorar saúde, estagnação, promessas, próximos passos e riscos de oportunidades.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Pontuar riscos explicáveis por evidência, impacto e urgência; produzir alerta com dono e gatilho de escalonamento.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Não emitir alerta crítico por heurística isolada.

## Portão de decisão
Não emitir alerta crítico por heurística isolada.

## Saída exigida
`RiskRadar + EscalationProposal` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **06 · Classificar urgência** (`comercial.deal_health.classificar-urgencia`; fase original: Essencial): Defina rubrica com exemplos positivos e negativos; atribua categoria e confiança.
- **12 · Priorizar risco** (`comercial.deal_health.priorizar-risco`; fase original: Essencial): Defina score objetivo de potencial, urgência, custo, confiança e restrições.
- **13 · Gerar alertas explicáveis** (`comercial.deal_health.gerar-alertas-explicaveis`; fase original: Essencial): Aplicar esta operação de forma explícita ao artefato `RiskRadar + EscalationProposal`: definir critério observável de “Gerar alertas explicáveis”, evidência mínima, exceção e campo de saída correspondente.
- **16 · Detectar perda iminente** (`comercial.deal_health.detectar-perda-iminente`; fase original: Expansão): Defina condição observável, referência temporal e casos negativos; compare eventos sem assumir causalidade.
- **19 · Alertar gestor responsável** (`comercial.deal_health.alertar-gestor-responsavel`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `RiskRadar + EscalationProposal`: definir critério observável de “Alertar gestor responsável”, evidência mínima, exceção e campo de saída correspondente.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
