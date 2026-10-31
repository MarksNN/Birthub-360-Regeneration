# P4 — Consolidação e auditoria | Supervisor Comercial

**Responsável:** `supervisor` · **Finalidade:** Orquestrar solicitações comerciais de ponta a ponta sem exigir que o cliente escolha um agente.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Conciliar evidências divergentes; identificar fonte mais confiável; separar executado, proposta e não verificado; produzir síntese com trilha de decisão.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Proibido declarar sucesso com apenas plano ou texto gerado.

## Portão de decisão
Proibido declarar sucesso com apenas plano ou texto gerado.

## Saída exigida
`Resumo auditável + divergências` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **09 · Identificar conflitos de resultado** (`comercial.supervisor.identificar-conflitos-de-resultado`; fase original: Essencial): Compare proposições de fontes divergentes, evidências, datas e owner; escale conflito não resolvido.
- **10 · Consolidar respostas** (`comercial.supervisor.consolidar-respostas`; fase original: Essencial): Agregue apenas resultados executados/consultivos identificados, remova duplicações e descreva pendências.
- **11 · Explicar decisões** (`comercial.supervisor.explicar-decisoes`; fase original: Essencial): Apresente razões resumidas por roteamento e bloqueio com critérios de custo/risco.
- **12 · Criar trilha de auditoria** (`comercial.supervisor.criar-trilha-de-auditoria`; fase original: Essencial): Concilie missionId, executionId, correlationId, model, capabilities, timestamp, aprovação e resultado.
- **19 · Reutilizar conhecimento aprovado** (`comercial.supervisor.reutilizar-conhecimento-aprovado`; fase original: Expansão): Consulte artefatos de aprendizado válidos por tenant, versão, data e finalidade; descarte precedentes desatualizados.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
