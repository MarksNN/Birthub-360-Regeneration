# P5 — Alçadas e auditoria | Deal Desk de Preços, Propostas e Contratos

**Responsável:** `deal_desk` · **Finalidade:** Analisar preços, descontos, ROI, propostas e condições contratuais dentro das regras de alçada.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Detectar discount leakage; registrar decisão, aprovador, vigência, exceções e histórico de condições.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Nenhuma ação de aprovação pelo próprio agente.

## Portão de decisão
Nenhuma ação de aprovação pelo próprio agente.

## Saída exigida
`ApprovalPacket + PricingAudit` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **10 · Detectar discount leakage** (`comercial.deal_desk.detectar-discount-leakage`; fase original: Essencial): Defina condição observável, referência temporal e casos negativos; compare eventos sem assumir causalidade.
- **13 · Encaminhar aprovação** (`comercial.deal_desk.encaminhar-aprovacao`; fase original: Essencial): Aplicar esta operação de forma explícita ao artefato `ApprovalPacket + PricingAudit`: definir critério observável de “Encaminhar aprovação”, evidência mínima, exceção e campo de saída correspondente.
- **14 · Registrar justificativas** (`comercial.deal_desk.registrar-justificativas`; fase original: Essencial): Associe cada evento/compromisso a recurso, autor, timestamp e prova; evite duplicidade.
- **24 · Auditar histórico de condições** (`comercial.deal_desk.auditar-historico-de-condicoes`; fase original: Expansão): Compare trilhas imutáveis, políticas vigentes e eventos; registre divergência reproduzível.
- **26 · Documentar alçadas** (`comercial.deal_desk.documentar-alcadas`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `ApprovalPacket + PricingAudit`: definir critério observável de “Documentar alçadas”, evidência mínima, exceção e campo de saída correspondente.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
