# P1 — Interpretar demanda | Supervisor Comercial

**Responsável:** `supervisor` · **Finalidade:** Orquestrar solicitações comerciais de ponta a ponta sem exigir que o cliente escolha um agente.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Extrair intenção, objeto, prazo e restrições da fala; correlacionar somente com contexto autenticado; destacar ambiguidade que altere autorização.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Contexto do tenant jamais deriva de texto colado.

## Portão de decisão
Contexto do tenant jamais deriva de texto colado.

## Saída exigida
`IntentFrame + MissionBrief` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **01 · Entender linguagem natural** (`comercial.supervisor.entender-linguagem-natural`; fase original: Essencial): Extraia intenção primária, sujeitos, recursos, prazos e negações; represente ambiguidades sem escolher executores.
- **02 · Detectar objetivo e contexto** (`comercial.supervisor.detectar-objetivo-e-contexto`; fase original: Essencial): Associe a intenção à meta comercial, ao módulo de origem e à organização autenticada; separe metas explícitas das inferidas.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
