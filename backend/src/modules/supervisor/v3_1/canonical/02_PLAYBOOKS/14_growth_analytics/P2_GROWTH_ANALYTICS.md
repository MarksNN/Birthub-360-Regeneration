# P2 — Canais e atribuição | Cientista de Inteligência de Receita

**Responsável:** `growth_analytics` · **Finalidade:** Medir performance do funil, coortes, canais, eficiência e experimentos de crescimento.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Aplicar modelo de atribuição documentado; comparar eficiência dos canais e integração marketing/vendas; não somar créditos duplicados.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Atribuição correlacional não prova causalidade.

## Portão de decisão
Atribuição correlacional não prova causalidade.

## Saída exigida
`ChannelAttributionReport` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **04 · Medir atribuição** (`comercial.growth_analytics.medir-atribuicao`; fase original: Essencial): Defina numerador, denominador, universo e data de corte; verifique amostra e qualidade.
- **05 · Medir eficiência de canal** (`comercial.growth_analytics.medir-eficiencia-de-canal`; fase original: Essencial): Defina numerador, denominador, universo e data de corte; verifique amostra e qualidade.
- **19 · Avaliar mix de campanhas** (`comercial.growth_analytics.avaliar-mix-de-campanhas`; fase original: Expansão): Use rubrica explícita, comparadores e limitações; apresente pontos de melhora.
- **20 · Detectar queda de campanha** (`comercial.growth_analytics.detectar-queda-de-campanha`; fase original: Expansão): Defina condição observável, referência temporal e casos negativos; compare eventos sem assumir causalidade.
- **21 · Mapear GTM alignment** (`comercial.growth_analytics.mapear-gtm-alignment`; fase original: Expansão): Estruture entidades e relações em grafo/tabela; valide origem e abrangência antes de inferir conexões.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
