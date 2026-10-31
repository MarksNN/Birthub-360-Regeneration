# P2 — Padrões por segmento e rival | Analista de Win/Loss e Aprendizado

**Responsável:** `winloss` · **Finalidade:** Explicar padrões de negócios ganhos e perdidos e retroalimentar playbooks e estratégia.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Estratificar por vertical, rival, duração, desconto e valor percebido; controlar tamanho amostral e comparabilidade.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Não confundir correlação com causa de perda.

## Portão de decisão
Não confundir correlação com causa de perda.

## Saída exigida
`CompetitiveWinLossMatrix` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **04 · Detectar padrão por segmento** (`comercial.winloss.detectar-padrao-por-segmento`; fase original: Essencial): Defina condição observável, referência temporal e casos negativos; compare eventos sem assumir causalidade.
- **05 · Comparar concorrentes** (`comercial.winloss.comparar-concorrentes`; fase original: Essencial): Normalize entidades e períodos; reporte denominadores, diferenças e fatores de confusão.
- **06 · Examinar ciclo de venda** (`comercial.winloss.examinar-ciclo-de-venda`; fase original: Essencial): Aplicar esta operação de forma explícita ao artefato `CompetitiveWinLossMatrix`: definir critério observável de “Examinar ciclo de venda”, evidência mínima, exceção e campo de saída correspondente.
- **07 · Identificar objeções recorrentes** (`comercial.winloss.identificar-objecoes-recorrentes`; fase original: Essencial): Cruze critérios e fontes, classifique confirmação versus hipótese e mostre registros que sustentam o achado.
- **08 · Comparar valor percebido** (`comercial.winloss.comparar-valor-percebido`; fase original: Essencial): Normalize entidades e períodos; reporte denominadores, diferenças e fatores de confusão.
- **16 · Analisar mudanças por trimestre** (`comercial.winloss.analisar-mudancas-por-trimestre`; fase original: Expansão): Defina hipótese, período, unidade de análise, baseline e contrafactual quando aplicável; cruze fontes.
- **18 · Avaliar influência de descontos** (`comercial.winloss.avaliar-influencia-de-descontos`; fase original: Expansão): Use rubrica explícita, comparadores e limitações; apresente pontos de melhora.
- **23 · Comparar contas similares** (`comercial.winloss.comparar-contas-similares`; fase original: Expansão): Normalize entidades e períodos; reporte denominadores, diferenças e fatores de confusão.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
