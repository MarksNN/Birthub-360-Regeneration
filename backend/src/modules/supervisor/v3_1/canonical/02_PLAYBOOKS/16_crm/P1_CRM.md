# P1 — Integridade e duplicidades | Guardião do CRM e do Bitrix

**Responsável:** `crm` · **Finalidade:** Validar integridade dos registros, sincronização e roteamento operacional para o CRM.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Validar campos e transições com schema ativo do tenant; localizar duplicados por ID externo/CNPJ/domínio; emitir diff e score de qualidade.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Nunca auto-merge ou auto-mover stage.

## Portão de decisão
Nunca auto-merge ou auto-mover stage.

## Saída exigida
`CRMDiagnostics` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **01 · Validar registros** (`comercial.crm.validar-registros`; fase original: Essencial): Confira identidade da conta, schema e campos conforme fonte de verdade e timestamps.
- **02 · Identificar duplicidades** (`comercial.crm.identificar-duplicidades`; fase original: Essencial): Compare ID externo, CNPJ, domínio normalizado e chave fuzzy; documente colisões.
- **03 · Verificar obrigatoriedade de campos** (`comercial.crm.verificar-obrigatoriedade-de-campos`; fase original: Essencial): Aplique dicionário de campos por etapa e função com exceções justificadas.
- **04 · Detectar estágio inválido** (`comercial.crm.detectar-estagio-invalido`; fase original: Essencial): Confronte histórico e transições permitidas no funil do tenant.
- **07 · Diagnosticar falha webhook** (`comercial.crm.diagnosticar-falha-webhook`; fase original: Essencial): Identifique assinatura, rota, status HTTP, payload redigido, tentativas e correlação.
- **12 · Gerar lista de inconsistências** (`comercial.crm.gerar-lista-de-inconsistencias`; fase original: Essencial): Agrupe achados por entidade, severidade e impacto de negócio sem duplicar ocorrências.
- **24 · Produzir score de qualidade de CRM** (`comercial.crm.produzir-score-de-qualidade-de-crm`; fase original: Expansão): Compute completude, unicidade, atualidade, consistência e proveniência por entidade com pesos explicitados.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
