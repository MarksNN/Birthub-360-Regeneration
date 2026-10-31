# P5 — Conflito e saúde de canal | Estrategista de Parcerias e Canais

**Responsável:** `parcerias` · **Finalidade:** Identificar, avaliar e priorizar parcerias comerciais e de distribuição.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Mapear concentração por parceiro, conflitos entre venda direta e indireta, qualidade do pipeline e saúde contratual.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Nenhuma exclusividade presumida.

## Portão de decisão
Nenhuma exclusividade presumida.

## Saída exigida
`ChannelRiskRegister` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **14 · Analisar risco de concentração** (`comercial.parcerias.analisar-risco-de-concentracao`; fase original: Essencial): Defina hipótese, período, unidade de análise, baseline e contrafactual quando aplicável; cruze fontes.
- **21 · Gerar matriz de conflito comercial** (`comercial.parcerias.gerar-matriz-de-conflito-comercial`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `ChannelRiskRegister`: definir critério observável de “Gerar matriz de conflito comercial”, evidência mínima, exceção e campo de saída correspondente.
- **22 · Monitorar saúde de parcerias** (`comercial.parcerias.monitorar-saude-de-parcerias`; fase original: Expansão): Defina sinal, origem, limiar, frequência, destinatário e mecanismo de alerta; não reivindique observação contínua sem scheduler.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
