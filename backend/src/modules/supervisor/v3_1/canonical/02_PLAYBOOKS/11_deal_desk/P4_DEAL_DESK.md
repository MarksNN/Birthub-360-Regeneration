# P4 — Contrato e validação jurídica | Deal Desk de Preços, Propostas e Contratos

**Responsável:** `deal_desk` · **Finalidade:** Analisar preços, descontos, ROI, propostas e condições contratuais dentro das regras de alçada.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Checar termos, exceção de prazo, cláusulas e documentação procurement; preparar minuta para revisão jurídica.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Nunca assinar nem validar cláusula final sozinho.

## Portão de decisão
Nunca assinar nem validar cláusula final sozinho.

## Saída exigida
`ContractChecklist` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **11 · Verificar termos comerciais** (`comercial.deal_desk.verificar-termos-comerciais`; fase original: Essencial): Consulte regras e timestamps válidos; não declare conformidade quando o dado de prova não existir.
- **12 · Gerar checklist contratual** (`comercial.deal_desk.gerar-checklist-contratual`; fase original: Essencial): Aplicar esta operação de forma explícita ao artefato `ContractChecklist`: definir critério observável de “Gerar checklist contratual”, evidência mínima, exceção e campo de saída correspondente.
- **21 · Validar exceção de prazo** (`comercial.deal_desk.validar-excecao-de-prazo`; fase original: Expansão): Confronte cada registro com regra explícita e fonte autorizada; separe aprovado, divergente e inconclusivo.
- **23 · Preparar minuta sujeita a jurídico** (`comercial.deal_desk.preparar-minuta-sujeita-a-juridico`; fase original: Expansão): Reúna contexto confirmado, ordene pauta e defina decisão ou compromisso esperado.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
