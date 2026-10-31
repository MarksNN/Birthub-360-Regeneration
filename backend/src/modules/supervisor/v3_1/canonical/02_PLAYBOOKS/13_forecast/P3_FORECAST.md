# P3 — Velocidade e variações | Estrategista de Pipeline e Forecast

**Responsável:** `forecast` · **Finalidade:** Analisar cobertura, movimento, velocidade, qualidade e previsibilidade da receita.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Calcular evolução e ponte de período; quantificar criação, avanço, perda e sazonalidade; informar denominadores.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Variação sem cutoff comparável é inconclusiva.

## Portão de decisão
Variação sem cutoff comparável é inconclusiva.

## Saída exigida
`ForecastBridge` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **06 · Avaliar velocidade** (`comercial.forecast.avaliar-velocidade`; fase original: Essencial): Use rubrica explícita, comparadores e limitações; apresente pontos de melhora.
- **10 · Acompanhar tendência** (`comercial.forecast.acompanhar-tendencia`; fase original: Essencial): Aplicar esta operação de forma explícita ao artefato `ForecastBridge`: definir critério observável de “Acompanhar tendência”, evidência mínima, exceção e campo de saída correspondente.
- **12 · Explicar variações** (`comercial.forecast.explicar-variacoes`; fase original: Essencial): Decomponha resultado em contribuição dos fatores, evidências e limites de interpretação.
- **18 · Criar ponte mensal** (`comercial.forecast.criar-ponte-mensal`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `ForecastBridge`: definir critério observável de “Criar ponte mensal”, evidência mínima, exceção e campo de saída correspondente.
- **23 · Analisar sazonalidade** (`comercial.forecast.analisar-sazonalidade`; fase original: Expansão): Defina hipótese, período, unidade de análise, baseline e contrafactual quando aplicável; cruze fontes.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
