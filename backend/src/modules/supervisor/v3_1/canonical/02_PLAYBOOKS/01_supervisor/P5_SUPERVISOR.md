# P5 — Exceções e escalonamento | Supervisor Comercial

**Responsável:** `supervisor` · **Finalidade:** Orquestrar solicitações comerciais de ponta a ponta sem exigir que o cliente escolha um agente.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Classificar falha, solicitação humana, timeout e orçamento; pausar dependências arriscadas; replanejar somente passos seguros e idempotentes.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Nunca se autoaprovar nem ultrapassar teto de missão.

## Portão de decisão
Nunca se autoaprovar nem ultrapassar teto de missão.

## Saída exigida
`EscalationDecision + plano de recuperação` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **13 · Escalar exceções** (`comercial.supervisor.escalar-excecoes`; fase original: Essencial): Classifique violação por risco e destinatário autorizado, fornecendo contexto mínimo e decisão pendente.
- **14 · Solicitar aprovação humana** (`comercial.supervisor.solicitar-aprovacao-humana`; fase original: Essencial): Monte proposta de ação com recurso, diff, risco, destinatário, validade e escopo para inbox.
- **15 · Replanejar missão por falha** (`comercial.supervisor.replanejar-missao-por-falha`; fase original: Expansão): Identifique step falho e efeitos já aplicados; preserve evidências, proponha ramo alternativo sem repetir side-effect.
- **16 · Controlar orçamento de IA** (`comercial.supervisor.controlar-orcamento-de-ia`; fase original: Expansão): Consulte telemetry por missionId, calcule tokens/custo consumidos e reserve teto para resposta final.
- **25 · Gerenciar SLA de agentes** (`comercial.supervisor.gerenciar-sla-de-agentes`; fase original: Expansão): Meça fila, duração de etapa, deadline e estado de bloqueio por tipo de especialidade.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
