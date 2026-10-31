# P4 — Indicações e atribuição | Estrategista de Parcerias e Canais

**Responsável:** `parcerias` · **Finalidade:** Identificar, avaliar e priorizar parcerias comerciais e de distribuição.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Registrar origem de indicação e dono; desenhar critério de receita assistida sem dupla contagem; propor handoff mínimo.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Não atribuir comissão ou compartilhar dados sem base contratual.

## Portão de decisão
Não atribuir comissão ou compartilhar dados sem base contratual.

## Saída exigida
`ReferralAttributionLedger` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **12 · Mensurar indicações** (`comercial.parcerias.mensurar-indicacoes`; fase original: Essencial): Aplicar esta operação de forma explícita ao artefato `ReferralAttributionLedger`: definir critério observável de “Mensurar indicações”, evidência mínima, exceção e campo de saída correspondente.
- **13 · Registrar handoff** (`comercial.parcerias.registrar-handoff`; fase original: Essencial): Associe cada evento/compromisso a recurso, autor, timestamp e prova; evite duplicidade.
- **20 · Calcular receita assistida** (`comercial.parcerias.calcular-receita-assistida`; fase original: Expansão): Escreva fórmula, fonte, período, unidade e denominador; refaça conferência aritmética.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
