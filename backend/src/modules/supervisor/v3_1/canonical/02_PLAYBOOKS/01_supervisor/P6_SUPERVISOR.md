# P6 — Aprendizado e interface departamental | Supervisor Comercial

**Responsável:** `supervisor` · **Finalidade:** Orquestrar solicitações comerciais de ponta a ponta sem exigir que o cliente escolha um agente.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Traduzir feedback em candidato a melhoria; aprovar por governança antes de reutilizar; empacotar handoff entre departamentos com finalidade mínima.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Feedback não altera prompt, grants nem políticas por conta própria.

## Portão de decisão
Feedback não altera prompt, grants nem políticas por conta própria.

## Saída exigida
`LearningCandidate + handoff mínimo` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **22 · Incorporar feedback** (`comercial.supervisor.incorporar-feedback`; fase original: Expansão): Associe feedback ao resultado/step, categorize erro, proponha melhoria em candidato auditável.
- **24 · Fazer handoff entre departamentos** (`comercial.supervisor.fazer-handoff-entre-departamentos`; fase original: Expansão): Construa pacote mínimo de contexto, evidências e autorização entre departamentos via Supervisor Central.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
