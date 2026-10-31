# P3 — Calibração e precisão | Analista de Intenção e Lead Scoring

**Responsável:** `intencao` · **Finalidade:** Classificar intenção de compra, interesse e adequação ao ICP para ordenar oportunidades.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Comparar score antigo com conversões verificadas; avaliar precisão/recall, deriva, recalibração, sazonalidade e estabilidade.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Sem amostra rotulada, indicar inconclusivo.

## Portão de decisão
Sem amostra rotulada, indicar inconclusivo.

## Saída exigida
`CalibrationReport` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **13 · Medir confiança** (`comercial.intencao.medir-confianca`; fase original: Essencial): Defina numerador, denominador, universo e data de corte; verifique amostra e qualidade.
- **14 · Reavaliar score** (`comercial.intencao.reavaliar-score`; fase original: Essencial): Aplicar esta operação de forma explícita ao artefato `CalibrationReport`: definir critério observável de “Reavaliar score”, evidência mínima, exceção e campo de saída correspondente.
- **15 · Scoring calibrado por segmento** (`comercial.intencao.scoring-calibrado-por-segmento`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `CalibrationReport`: definir critério observável de “Scoring calibrado por segmento”, evidência mínima, exceção e campo de saída correspondente.
- **17 · Medir precisão histórica** (`comercial.intencao.medir-precisao-historica`; fase original: Expansão): Defina numerador, denominador, universo e data de corte; verifique amostra e qualidade.
- **18 · Detectar drift** (`comercial.intencao.detectar-drift`; fase original: Expansão): Defina condição observável, referência temporal e casos negativos; compare eventos sem assumir causalidade.
- **23 · Prever propensão em cenários aprovados** (`comercial.intencao.prever-propensao-em-cenarios-aprovados`; fase original: Expansão): Use baseline histórico com validação temporal; não simule modelo ausente como previsão operacional.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
