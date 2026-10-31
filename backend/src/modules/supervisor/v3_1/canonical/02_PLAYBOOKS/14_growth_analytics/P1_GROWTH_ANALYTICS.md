# P1 — Funil, conversão e coortes | Cientista de Inteligência de Receita

**Responsável:** `growth_analytics` · **Finalidade:** Medir performance do funil, coortes, canais, eficiência e experimentos de crescimento.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Definir evento e denominador por etapa; construir coortes por data de entrada e comparar períodos sem misturar janelas.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Coorte sem mesmo horizonte não é comparável.

## Portão de decisão
Coorte sem mesmo horizonte não é comparável.

## Saída exigida
`FunnelCohortAnalysis` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **01 · Analisar funil** (`comercial.growth_analytics.analisar-funil`; fase original: Essencial): Defina hipótese, período, unidade de análise, baseline e contrafactual quando aplicável; cruze fontes.
- **02 · Detectar gargalo** (`comercial.growth_analytics.detectar-gargalo`; fase original: Essencial): Defina condição observável, referência temporal e casos negativos; compare eventos sem assumir causalidade.
- **03 · Avaliar coortes** (`comercial.growth_analytics.avaliar-coortes`; fase original: Essencial): Use rubrica explícita, comparadores e limitações; apresente pontos de melhora.
- **07 · Identificar queda de conversão** (`comercial.growth_analytics.identificar-queda-de-conversao`; fase original: Essencial): Cruze critérios e fontes, classifique confirmação versus hipótese e mostre registros que sustentam o achado.
- **10 · Comparar períodos** (`comercial.growth_analytics.comparar-periodos`; fase original: Essencial): Normalize entidades e períodos; reporte denominadores, diferenças e fatores de confusão.
- **26 · Normalizar coortes** (`comercial.growth_analytics.normalizar-coortes`; fase original: Expansão): Defina padrão de schema, transformação reversível e comparação com valor original.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
