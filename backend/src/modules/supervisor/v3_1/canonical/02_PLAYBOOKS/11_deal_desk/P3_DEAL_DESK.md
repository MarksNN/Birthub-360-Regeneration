# P3 — ROI, ARR e plurianual | Deal Desk de Preços, Propostas e Contratos

**Responsável:** `deal_desk` · **Finalidade:** Analisar preços, descontos, ROI, propostas e condições contratuais dentro das regras de alçada.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Calcular ROI e impacto em ARR por cenário, identificar premissas, desconto composto e horizonte contratual.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Não vender projeção como receita realizada.

## Portão de decisão
Não vender projeção como receita realizada.

## Saída exigida
`ROIScenario + ARRBridge` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **07 · Calcular ROI** (`comercial.deal_desk.calcular-roi`; fase original: Essencial): Escreva fórmula, fonte, período, unidade e denominador; refaça conferência aritmética.
- **08 · Simular contrato plurianual** (`comercial.deal_desk.simular-contrato-plurianual`; fase original: Essencial): Declare parâmetros e cenários hipotéticos; não apresente simulação como observação.
- **17 · Simular cenários financeiros** (`comercial.deal_desk.simular-cenarios-financeiros`; fase original: Expansão): Declare parâmetros e cenários hipotéticos; não apresente simulação como observação.
- **18 · Estimar impacto em ARR** (`comercial.deal_desk.estimar-impacto-em-arr`; fase original: Expansão): Defina premissas, limites e cenários; indique intervalo e sensibilidade, não valor certo.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
