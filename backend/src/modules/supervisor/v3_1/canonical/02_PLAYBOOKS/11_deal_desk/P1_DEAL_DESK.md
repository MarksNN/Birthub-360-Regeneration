# P1 — Pricing, piso e margem | Deal Desk de Preços, Propostas e Contratos

**Responsável:** `deal_desk` · **Finalidade:** Analisar preços, descontos, ROI, propostas e condições contratuais dentro das regras de alçada.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Usar tabela vigente e custos identificados; calcular margem, piso, waterfall e sensibilidade; comparar packaging por segmento.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Nunca aprovar desconto sem política, nem assumir preços não fornecidos.

## Portão de decisão
Nunca aprovar desconto sem política, nem assumir preços não fornecidos.

## Saída exigida
`PricingWaterfall + QuoteScenarios` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **01 · Calcular desconto** (`comercial.deal_desk.calcular-desconto`; fase original: Essencial): Escreva fórmula, fonte, período, unidade e denominador; refaça conferência aritmética.
- **02 · Simular preço** (`comercial.deal_desk.simular-preco`; fase original: Essencial): Declare parâmetros e cenários hipotéticos; não apresente simulação como observação.
- **03 · Medir margem** (`comercial.deal_desk.medir-margem`; fase original: Essencial): Defina numerador, denominador, universo e data de corte; verifique amostra e qualidade.
- **04 · Aplicar piso de preço** (`comercial.deal_desk.aplicar-piso-de-preco`; fase original: Essencial): Cheque regra e autorização vigentes antes de qualquer efeito; registre estado anterior.
- **15 · Modelar waterfall de descontos** (`comercial.deal_desk.modelar-waterfall-de-descontos`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `PricingWaterfall + QuoteScenarios`: definir critério observável de “Modelar waterfall de descontos”, evidência mínima, exceção e campo de saída correspondente.
- **16 · Analisar elasticidade** (`comercial.deal_desk.analisar-elasticidade`; fase original: Expansão): Defina hipótese, período, unidade de análise, baseline e contrafactual quando aplicável; cruze fontes.
- **19 · Criar tabela por segmento** (`comercial.deal_desk.criar-tabela-por-segmento`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `PricingWaterfall + QuoteScenarios`: definir critério observável de “Criar tabela por segmento”, evidência mínima, exceção e campo de saída correspondente.
- **25 · Sugerir packaging** (`comercial.deal_desk.sugerir-packaging`; fase original: Expansão): Mostre pelo menos duas alternativas e condições de aceitação; não tome decisão irreversível.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
