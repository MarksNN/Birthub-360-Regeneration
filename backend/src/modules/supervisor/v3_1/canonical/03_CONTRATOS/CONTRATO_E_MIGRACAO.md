# Integração semântica do contrato V3.1

- **Entre agentes:** objeto JSON único validado contra `AGENT_RESULT_V3_1_GLOBAL.schema.json`. `resumo_humano` sempre presente; UI apresenta síntese do Supervisor sem expor o JSON cru.
- **Status:** `COMPLETED`, `PARTIAL`, `BLOCKED`, `APPROVAL_REQUIRED`, `NEEDS_INFO`; `mode` `CONSULTIVO`, `OPERACIONAL`, `BLOQUEADO`.
- **UNKNOWN:** em check de compliance ou sinal de canal = ausência de verificação, nunca aprovação. `sendEligible=false` ao faltar gate obrigatório.
- **Executado vs proposto:** `execution.performed=false` em rascunhos/simulações. Persistência e ações reais exigem executionId, idempotência, evidência e backend.
- **Schema compartilhado:** `agentId` e `handoffs[].to` aceitam os 19 IDs. Tipos de artefato e ação foram ampliados em relação ao Outbound V3.1 original; clientes antigos precisam de adapter e teste antes da migração.
- **Uso pelo modelo:** schema é contrato estruturado validado pelo runtime, não texto de política de segurança autoexecutável.
- **Meta:** não migrar o backend por substituir prompts; implementar adaptador explícito e comparar snapshots dos consumidores.
