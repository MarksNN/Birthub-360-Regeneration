# P3 — Enriquecimento cascata | Caçador de Leads e Enriquecimento

**Responsável:** `prospeccao` · **Finalidade:** Encontrar contas-alvo, levantar dados úteis e enriquecer registros com fontes permitidas.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Consultar provedores autorizados por ordem de custo/qualidade; reconciliar cargos e e-mail corporativo; registrar conflitos e lacunas.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Pessoas físicas exigem finalidade, necessidade, fonte e controles LGPD.

## Portão de decisão
Pessoas físicas exigem finalidade, necessidade, fonte e controles LGPD.

## Saída exigida
`EnrichmentEvidence + Confidence` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **04 · Enriquecer empresa** (`comercial.prospeccao.enriquecer-empresa`; fase original: Essencial): Faça lookup em fonte autorizada, compare proveniência e confiança, minimize dados pessoais.
- **05 · Enriquecer lead** (`comercial.prospeccao.enriquecer-lead`; fase original: Essencial): Faça lookup em fonte autorizada, compare proveniência e confiança, minimize dados pessoais.
- **15 · Enriquecimento em cascata** (`comercial.prospeccao.enriquecimento-em-cascata`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `EnrichmentEvidence + Confidence`: definir critério observável de “Enriquecimento em cascata”, evidência mínima, exceção e campo de saída correspondente.
- **16 · Validação de e-mail corporativo quando autorizada** (`comercial.prospeccao.validacao-de-e-mail-corporativo-quando-autorizada`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `EnrichmentEvidence + Confidence`: definir critério observável de “Validação de e-mail corporativo quando autorizada”, evidência mínima, exceção e campo de saída correspondente.
- **17 · Detecção de cargos** (`comercial.prospeccao.deteccao-de-cargos`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `EnrichmentEvidence + Confidence`: definir critério observável de “Detecção de cargos”, evidência mínima, exceção e campo de saída correspondente.
- **18 · Conciliar fontes conflitantes** (`comercial.prospeccao.conciliar-fontes-conflitantes`; fase original: Expansão): Compare registros entre sistemas por IDs e timestamps; não escolha fonte vencedora sem regra.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
