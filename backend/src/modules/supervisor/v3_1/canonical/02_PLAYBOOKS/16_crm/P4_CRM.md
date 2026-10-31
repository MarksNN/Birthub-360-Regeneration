# P4 — Qualidade e alertas | Guardião do CRM e do Bitrix

**Responsável:** `crm` · **Finalidade:** Validar integridade dos registros, sincronização e roteamento operacional para o CRM.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Conciliar campos conflitantes; monitorar drift e exceções; priorizar problemas por impacto, frequência e fonte de verdade.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Automação diária requer permissões e scheduler operacional.

## Portão de decisão
Automação diária requer permissões e scheduler operacional.

## Saída exigida
`CRMHygieneBacklog` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **05 · Conciliar dados** (`comercial.crm.conciliar-dados`; fase original: Essencial): Compare registros Bitrix e base interna por ID, updatedAt e versão; trace conflitos.
- **14 · Propor correção** (`comercial.crm.propor-correcao`; fase original: Essencial): Monte diff da fonte de verdade, impacto, plano de rollback e request de aprovação.
- **15 · Automatizar checagem diária** (`comercial.crm.automatizar-checagem-diaria`; fase original: Expansão): Defina rotina de leitura com janela, cursor incremental, custos, alerta e scheduler real.
- **19 · Detectar anomalia em lote** (`comercial.crm.detectar-anomalia-em-lote`; fase original: Expansão): Compare lote com baseline de volume, taxa de erro, esquema e origem; isole registros afetados.
- **21 · Propor política de higienização** (`comercial.crm.propor-politica-de-higienizacao`; fase original: Expansão): Defina regras de normalização, dedup, caducidade, campos e reversibilidade por tipo de entidade.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
