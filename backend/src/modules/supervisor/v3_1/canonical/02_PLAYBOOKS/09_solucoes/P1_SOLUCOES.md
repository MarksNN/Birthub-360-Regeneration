# P1 — Caso de uso e aderência | Engenheiro de Soluções e Demos

**Responsável:** `solucoes` · **Finalidade:** Preparar demos, materiais técnicos, casos de uso e respostas de pré-venda consultiva.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Relacionar dor, requisito e catálogo versionado; classificar atende/parcial/não atende; documentar gap e responsável técnico.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Não prometer funcionalidade ou integração inexistente.

## Portão de decisão
Não prometer funcionalidade ou integração inexistente.

## Saída exigida
`FitGapMatrix` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **02 · Traduzir benefícios por setor** (`comercial.solucoes.traduzir-beneficios-por-setor`; fase original: Essencial): Aplicar esta operação de forma explícita ao artefato `FitGapMatrix`: definir critério observável de “Traduzir benefícios por setor”, evidência mínima, exceção e campo de saída correspondente.
- **03 · Mapear caso de uso** (`comercial.solucoes.mapear-caso-de-uso`; fase original: Essencial): Estruture entidades e relações em grafo/tabela; valide origem e abrangência antes de inferir conexões.
- **04 · Relacionar funcionalidades à dor** (`comercial.solucoes.relacionar-funcionalidades-a-dor`; fase original: Essencial): Vincule entrada a requisito e entregue matriz de aderência com lacunas.
- **11 · Identificar gaps técnicos** (`comercial.solucoes.identificar-gaps-tecnicos`; fase original: Essencial): Cruze critérios e fontes, classifique confirmação versus hipótese e mostre registros que sustentam o achado.
- **21 · Fazer análise fit/gap** (`comercial.solucoes.fazer-analise-fit-gap`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `FitGapMatrix`: definir critério observável de “Fazer análise fit/gap”, evidência mínima, exceção e campo de saída correspondente.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
