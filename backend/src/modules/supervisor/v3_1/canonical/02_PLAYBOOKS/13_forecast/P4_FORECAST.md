# P4 — Cenários por segmentação | Estrategista de Pipeline e Forecast

**Responsável:** `forecast` · **Finalidade:** Analisar cobertura, movimento, velocidade, qualidade e previsibilidade da receita.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Simular upside/downside por segmento, território e churn, mantendo premissas rastreáveis e políticas de rateio.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Simulação não altera quotas nem stage.

## Portão de decisão
Simulação não altera quotas nem stage.

## Saída exigida
`ScenarioForecast` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **11 · Simular cenários** (`comercial.forecast.simular-cenarios`; fase original: Essencial): Declare parâmetros e cenários hipotéticos; não apresente simulação como observação.
- **15 · Comparar forecasts por segmento** (`comercial.forecast.comparar-forecasts-por-segmento`; fase original: Expansão): Normalize entidades e períodos; reporte denominadores, diferenças e fatores de confusão.
- **21 · Simular meta por território** (`comercial.forecast.simular-meta-por-territorio`; fase original: Expansão): Declare parâmetros e cenários hipotéticos; não apresente simulação como observação.
- **22 · Visualizar impacto de churn na receita** (`comercial.forecast.visualizar-impacto-de-churn-na-receita`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `ScenarioForecast`: definir critério observável de “Visualizar impacto de churn na receita”, evidência mínima, exceção e campo de saída correspondente.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
