# P3 — Discovery e despacho | Supervisor Comercial

**Responsável:** `supervisor` · **Finalidade:** Orquestrar solicitações comerciais de ponta a ponta sem exigir que o cliente escolha um agente.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Pesquisar skills indexadas; validar candidato com grants, binding e executor; delegar com budget, deadline e correlationId; otimizar modelo por latência/custo só entre opções permitidas.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Seleção não concede permissão; backend decide antes de executar.

## Portão de decisão
Seleção não concede permissão; backend decide antes de executar.

## Saída exigida
`DispatchPlan + execução rastreável` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **04 · Selecionar especialistas** (`comercial.supervisor.selecionar-especialistas`; fase original: Essencial): Filtre responsáveis por skillIds, grants, binding e disponibilidade; ranqueie custo, qualidade e afinidade.
- **05 · Confirmar autorização por organização** (`comercial.supervisor.confirmar-autorizacao-por-organizacao`; fase original: Essencial): Obtenha actorId, organizationId e role do auth-context; confronte recurso, actionScope e grants.
- **06 · Verificar capacidade executável** (`comercial.supervisor.verificar-capacidade-executavel`; fase original: Essencial): Consulte Capability Engine, ToolBinding, executor e status; diferencie catálogo de operação real.
- **08 · Delegar e acompanhar** (`comercial.supervisor.delegar-e-acompanhar`; fase original: Essencial): Envie task envelope com escopo, budget, deadline e correlationId; receba resultado normalizado.
- **18 · Otimizar escolha de modelos** (`comercial.supervisor.otimizar-escolha-de-modelos`; fase original: Expansão): Escolha modelo permitido por classe de tarefa, contexto, tool calling, latência e custo observados.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
