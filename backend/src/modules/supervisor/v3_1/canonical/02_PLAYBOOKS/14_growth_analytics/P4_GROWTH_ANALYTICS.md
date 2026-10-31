# P4 — Métricas, anomalias e alertas | Cientista de Inteligência de Receita

**Responsável:** `growth_analytics` · **Finalidade:** Medir performance do funil, coortes, canais, eficiência e experimentos de crescimento.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Versionar KPI, detectar variação fora da banda por baseline e amostra, abrir hipótese e propor plano de ação.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Alarme sem threshold configurado é apenas sinal exploratório.

## Portão de decisão
Alarme sem threshold configurado é apenas sinal exploratório.

## Saída exigida
`KPIDictionary + AlertPlan` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **09 · Criar KPI** (`comercial.growth_analytics.criar-kpi`; fase original: Essencial): Aplicar esta operação de forma explícita ao artefato `KPIDictionary + AlertPlan`: definir critério observável de “Criar KPI”, evidência mínima, exceção e campo de saída correspondente.
- **11 · Priorizar testes** (`comercial.growth_analytics.priorizar-testes`; fase original: Essencial): Defina score objetivo de potencial, urgência, custo, confiança e restrições.
- **13 · Detectar anomalias** (`comercial.growth_analytics.detectar-anomalias`; fase original: Essencial): Defina condição observável, referência temporal e casos negativos; compare eventos sem assumir causalidade.
- **14 · Recomendar ação** (`comercial.growth_analytics.recomendar-acao`; fase original: Essencial): Compare alternativas por impacto, esforço, risco, dados disponíveis e responsável.
- **23 · Definir alertas de performance** (`comercial.growth_analytics.definir-alertas-de-performance`; fase original: Expansão): Formule critérios claros, faixas e exceções; use fontes e decisões aprovadas.
- **25 · Criar scorecards** (`comercial.growth_analytics.criar-scorecards`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `KPIDictionary + AlertPlan`: definir critério observável de “Criar scorecards”, evidência mínima, exceção e campo de saída correspondente.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
