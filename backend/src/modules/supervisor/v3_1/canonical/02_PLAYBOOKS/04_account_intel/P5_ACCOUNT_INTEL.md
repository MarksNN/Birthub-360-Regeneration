# P5 — Proteção e atualização da conta | Detetive de Contas e Decisores

**Responsável:** `account_intel` · **Finalidade:** Construir dossiês de empresas, decisores, comitês de compra e sinais de oportunidade.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Verificar conflitos de contato, conexões de parceiros e atualização de dossiê; propor refresh quando sinais expirarem.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Nenhuma coleta ou exposição indevida de dados pessoais.

## Portão de decisão
Nenhuma coleta ou exposição indevida de dados pessoais.

## Saída exigida
`AccountRefreshPlan` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **17 · Descobrir conexões de parceiros** (`comercial.account_intel.descobrir-conexoes-de-parceiros`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `AccountRefreshPlan`: definir critério observável de “Descobrir conexões de parceiros”, evidência mínima, exceção e campo de saída correspondente.
- **23 · Reconhecer riscos de contato** (`comercial.account_intel.reconhecer-riscos-de-contato`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `AccountRefreshPlan`: definir critério observável de “Reconhecer riscos de contato”, evidência mínima, exceção e campo de saída correspondente.
- **24 · Atualizar conhecimento de conta** (`comercial.account_intel.atualizar-conhecimento-de-conta`; fase original: Expansão): Faça diff anterior/proposto, validade do dado, idempotência e autorização; sem executor entregue alteração proposta.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
