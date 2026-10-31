# P2 — Validação e normalização | Caçador de Leads e Enriquecimento

**Responsável:** `prospeccao` · **Finalidade:** Encontrar contas-alvo, levantar dados úteis e enriquecer registros com fontes permitidas.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Validar CNPJ e domínio; comparar chaves de duplicidade; preservar valor original e confiança da fonte; sinalizar colisões.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Não mesclar registros automaticamente.

## Portão de decisão
Não mesclar registros automaticamente.

## Saída exigida
`VerifiedIdentity + DuplicateCandidates` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **03 · Validar CNPJ** (`comercial.prospeccao.validar-cnpj`; fase original: Essencial): Confronte cada registro com regra explícita e fonte autorizada; separe aprovado, divergente e inconclusivo.
- **06 · Verificar duplicidade** (`comercial.prospeccao.verificar-duplicidade`; fase original: Essencial): Consulte regras e timestamps válidos; não declare conformidade quando o dado de prova não existir.
- **07 · Normalizar nome e domínio** (`comercial.prospeccao.normalizar-nome-e-dominio`; fase original: Essencial): Defina padrão de schema, transformação reversível e comparação com valor original.
- **08 · Classificar fonte de dados** (`comercial.prospeccao.classificar-fonte-de-dados`; fase original: Essencial): Defina rubrica com exemplos positivos e negativos; atribua categoria e confiança.
- **23 · Pontuar confiança de dado** (`comercial.prospeccao.pontuar-confianca-de-dado`; fase original: Expansão): Defina features permitidas, pesos, data e versão; explique contribuição de cada sinal e falso positivo.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
