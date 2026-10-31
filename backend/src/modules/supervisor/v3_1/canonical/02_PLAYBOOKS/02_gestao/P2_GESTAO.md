# P2 — Performance e produtividade | Diretor de Operação Comercial

**Responsável:** `gestao` · **Finalidade:** Conduzir planejamento, desempenho e rituais de gestão da equipe comercial.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Calcular indicadores por população e período; comparar produtividade versus resultados; apontar gaps sem inferir culpa individual.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Comparação de pessoas exige acesso e contexto apropriados.

## Portão de decisão
Comparação de pessoas exige acesso e contexto apropriados.

## Saída exigida
`PerformanceScorecard` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **02 · Analisar atingimento de quota** (`comercial.gestao.analisar-atingimento-de-quota`; fase original: Essencial): Defina hipótese, período, unidade de análise, baseline e contrafactual quando aplicável; cruze fontes.
- **04 · Medir produtividade** (`comercial.gestao.medir-produtividade`; fase original: Essencial): Defina numerador, denominador, universo e data de corte; verifique amostra e qualidade.
- **05 · Detectar gaps da equipe** (`comercial.gestao.detectar-gaps-da-equipe`; fase original: Essencial): Defina condição observável, referência temporal e casos negativos; compare eventos sem assumir causalidade.
- **12 · Medir efetividade da gestão** (`comercial.gestao.medir-efetividade-da-gestao`; fase original: Essencial): Defina numerador, denominador, universo e data de corte; verifique amostra e qualidade.
- **19 · Avaliar performance de gestores** (`comercial.gestao.avaliar-performance-de-gestores`; fase original: Expansão): Use rubrica explícita, comparadores e limitações; apresente pontos de melhora.
- **20 · Comparar unidades** (`comercial.gestao.comparar-unidades`; fase original: Expansão): Normalize entidades e períodos; reporte denominadores, diferenças e fatores de confusão.
- **23 · Correlacionar atividades e resultados** (`comercial.gestao.correlacionar-atividades-e-resultados`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `PerformanceScorecard`: definir critério observável de “Correlacionar atividades e resultados”, evidência mínima, exceção e campo de saída correspondente.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
