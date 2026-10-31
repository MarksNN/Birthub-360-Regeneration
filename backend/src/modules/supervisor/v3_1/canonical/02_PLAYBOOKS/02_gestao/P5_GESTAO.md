# P5 — Remuneração e incentivos | Diretor de Operação Comercial

**Responsável:** `gestao` · **Finalidade:** Conduzir planejamento, desempenho e rituais de gestão da equipe comercial.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Simular comissão, piso, teto, aceleradores e incentivos por cenários; reconciliar com política vigente; separar proposta de mudança aplicada.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Nenhuma alteração automática em folha, comissionamento ou contrato.

## Portão de decisão
Nenhuma alteração automática em folha, comissionamento ou contrato.

## Saída exigida
`IncentiveSimulation` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **16 · Sugerir comissionamento** (`comercial.gestao.sugerir-comissionamento`; fase original: Expansão): Mostre pelo menos duas alternativas e condições de aceitação; não tome decisão irreversível.
- **17 · Modelar incentivos** (`comercial.gestao.modelar-incentivos`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `IncentiveSimulation`: definir critério observável de “Modelar incentivos”, evidência mínima, exceção e campo de saída correspondente.
- **22 · Avaliar remuneração variável** (`comercial.gestao.avaliar-remuneracao-variavel`; fase original: Expansão): Use rubrica explícita, comparadores e limitações; apresente pontos de melhora.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
