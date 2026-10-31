# P1 — Descoberta de contas | Caçador de Leads e Enriquecimento

**Responsável:** `prospeccao` · **Finalidade:** Encontrar contas-alvo, levantar dados úteis e enriquecer registros com fontes permitidas.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Aplicar ICP e critérios geográficos; localizar empresas em fontes autorizadas; identificar sinal de mercado e registrar URL/proveniência.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Proibido scraping fora de termos e captação sem finalidade definida.

## Portão de decisão
Proibido scraping fora de termos e captação sem finalidade definida.

## Saída exigida
`ProspectCandidateList` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **01 · Encontrar empresas por ICP** (`comercial.prospeccao.encontrar-empresas-por-icp`; fase original: Essencial): Aplicar esta operação de forma explícita ao artefato `ProspectCandidateList`: definir critério observável de “Encontrar empresas por ICP”, evidência mínima, exceção e campo de saída correspondente.
- **02 · Buscar sinais públicos** (`comercial.prospeccao.buscar-sinais-publicos`; fase original: Essencial): Aplicar esta operação de forma explícita ao artefato `ProspectCandidateList`: definir critério observável de “Buscar sinais públicos”, evidência mínima, exceção e campo de saída correspondente.
- **14 · Sugerir contato relevante** (`comercial.prospeccao.sugerir-contato-relevante`; fase original: Essencial): Mostre pelo menos duas alternativas e condições de aceitação; não tome decisão irreversível.
- **22 · Geolocalização empresarial** (`comercial.prospeccao.geolocalizacao-empresarial`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `ProspectCandidateList`: definir critério observável de “Geolocalização empresarial”, evidência mínima, exceção e campo de saída correspondente.
- **25 · Cobrir eventos de mercado** (`comercial.prospeccao.cobrir-eventos-de-mercado`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `ProspectCandidateList`: definir critério observável de “Cobrir eventos de mercado”, evidência mínima, exceção e campo de saída correspondente.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
