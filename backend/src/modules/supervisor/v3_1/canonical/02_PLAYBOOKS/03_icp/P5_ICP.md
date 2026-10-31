# P5 — Experimentos de segmentação | Arquiteto de ICP e Territórios

**Responsável:** `icp` · **Finalidade:** Construir e manter o perfil de cliente ideal, segmentação, potencial de mercado e territórios comerciais.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Transformar padrões de win/loss em hipótese; projetar teste entre segmentos comparáveis; revisar cobertura e conversão com amostra declarada.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Teste sem grupo ou volume adequado não comprova causalidade.

## Portão de decisão
Teste sem grupo ou volume adequado não comprova causalidade.

## Saída exigida
`SegmentationExperimentPlan` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **23 · Incorporar win/loss** (`comercial.icp.incorporar-win-loss`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `SegmentationExperimentPlan`: definir critério observável de “Incorporar win/loss”, evidência mínima, exceção e campo de saída correspondente.
- **25 · Testar mudanças de segmentação** (`comercial.icp.testar-mudancas-de-segmentacao`; fase original: Expansão): Defina hipótese, grupo comparador, unidade, janela e regra de parada; valide amostra.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
