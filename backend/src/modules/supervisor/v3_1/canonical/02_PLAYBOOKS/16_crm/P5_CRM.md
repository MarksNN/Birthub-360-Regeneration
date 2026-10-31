# P5 — Correção aprovada | Guardião do CRM e do Bitrix

**Responsável:** `crm` · **Finalidade:** Validar integridade dos registros, sincronização e roteamento operacional para o CRM.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Gerar patch explícito antes/depois, dry-run e compensação; exigir grant write, aprovação e idempotency key antes de persistir.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Falha em qualquer gate impede alteração.

## Portão de decisão
Falha em qualquer gate impede alteração.

## Saída exigida
`ApprovedCRMChangeSet` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **16 · Corrigir dados mediante aprovação** (`comercial.crm.corrigir-dados-mediante-aprovacao`; fase original: Expansão): Gere diff idempotente por registro, vincule approvalRequest e aplique pelo executor autorizado.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
