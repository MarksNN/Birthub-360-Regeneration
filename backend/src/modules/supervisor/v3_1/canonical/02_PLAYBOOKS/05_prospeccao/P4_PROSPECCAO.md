# P4 — Qualidade e atualização incremental | Caçador de Leads e Enriquecimento

**Responsável:** `prospeccao` · **Finalidade:** Encontrar contas-alvo, levantar dados úteis e enriquecer registros com fontes permitidas.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Medir completude por campo; identificar stale data usando updatedAt; criar fila incremental com custo/erro por fornecedor.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Jamais afirmar que um dado está válido sem verificação.

## Portão de decisão
Jamais afirmar que um dado está válido sem verificação.

## Saída exigida
`DataQualityQueue` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **09 · Medir completude** (`comercial.prospeccao.medir-completude`; fase original: Essencial): Defina numerador, denominador, universo e data de corte; verifique amostra e qualidade.
- **10 · Detectar dados obsoletos** (`comercial.prospeccao.detectar-dados-obsoletos`; fase original: Essencial): Defina condição observável, referência temporal e casos negativos; compare eventos sem assumir causalidade.
- **11 · Priorizar atualização** (`comercial.prospeccao.priorizar-atualizacao`; fase original: Essencial): Defina score objetivo de potencial, urgência, custo, confiança e restrições.
- **12 · Registrar proveniência** (`comercial.prospeccao.registrar-proveniencia`; fase original: Essencial): Associe cada evento/compromisso a recurso, autor, timestamp e prova; evite duplicidade.
- **19 · Atualização incremental** (`comercial.prospeccao.atualizacao-incremental`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `DataQualityQueue`: definir critério observável de “Atualização incremental”, evidência mínima, exceção e campo de saída correspondente.
- **20 · Monitorar qualidade de fornecedor** (`comercial.prospeccao.monitorar-qualidade-de-fornecedor`; fase original: Expansão): Defina sinal, origem, limiar, frequência, destinatário e mecanismo de alerta; não reivindique observação contínua sem scheduler.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
