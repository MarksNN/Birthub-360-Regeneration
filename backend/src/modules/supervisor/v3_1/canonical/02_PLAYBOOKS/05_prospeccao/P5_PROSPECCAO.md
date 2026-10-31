# P5 — Controle e descarte | Caçador de Leads e Enriquecimento

**Responsável:** `prospeccao` · **Finalidade:** Encontrar contas-alvo, levantar dados úteis e enriquecer registros com fontes permitidas.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Separar itens que precisam de revisão, limitar orçamento por API e aplicar política de retenção/descarte aprovada.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Exclusão e escrita em massa só por executor autorizado.

## Portão de decisão
Exclusão e escrita em massa só por executor autorizado.

## Saída exigida
`ReviewQueue + RetentionProposal` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **13 · Criar fila de revisão** (`comercial.prospeccao.criar-fila-de-revisao`; fase original: Essencial): Aplicar esta operação de forma explícita ao artefato `ReviewQueue + RetentionProposal`: definir critério observável de “Criar fila de revisão”, evidência mínima, exceção e campo de saída correspondente.
- **21 · Limitar custo de API** (`comercial.prospeccao.limitar-custo-de-api`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `ReviewQueue + RetentionProposal`: definir critério observável de “Limitar custo de API”, evidência mínima, exceção e campo de saída correspondente.
- **24 · Configurar regras de descarte** (`comercial.prospeccao.configurar-regras-de-descarte`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `ReviewQueue + RetentionProposal`: definir critério observável de “Configurar regras de descarte”, evidência mínima, exceção e campo de saída correspondente.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
