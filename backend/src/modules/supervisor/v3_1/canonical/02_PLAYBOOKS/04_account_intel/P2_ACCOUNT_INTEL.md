# P2 — Comitê e mapa de relacionamento | Detetive de Contas e Decisores

**Responsável:** `account_intel` · **Finalidade:** Construir dossiês de empresas, decisores, comitês de compra e sinais de oportunidade.

## Procedimento operacional (curadoria específica do domínio)
1. Reunir as entradas mínimas da solicitação e distinguir fatos verificados de dados apenas informados.
2. Distinguir decisor, influenciador e comprador econômico; marcar fontes de atribuição; avaliar lacunas do comitê sem inventar pessoas.
3. Produzir o artefato com itens verificáveis, pendências, responsável e próximo passo; não afirmar execução de ferramenta que não ocorreu.
4. Submeter ações sensíveis ao gate específico: Não inferir dados pessoais sensíveis.

## Portão de decisão
Não inferir dados pessoais sensíveis.

## Saída exigida
`BuyingCommitteeMap` com premissas, fonte, data de corte, responsáveis, resultado e lacunas.

## Catálogo de habilidades cobertas (microprocedimento por skill)
- **04 · Mapear organograma de compra** (`comercial.account_intel.mapear-organograma-de-compra`; fase original: Essencial): Estruture entidades e relações em grafo/tabela; valide origem e abrangência antes de inferir conexões.
- **05 · Identificar decisores** (`comercial.account_intel.identificar-decisores`; fase original: Essencial): Cruze critérios e fontes, classifique confirmação versus hipótese e mostre registros que sustentam o achado.
- **06 · Mapear influenciadores** (`comercial.account_intel.mapear-influenciadores`; fase original: Essencial): Estruture entidades e relações em grafo/tabela; valide origem e abrangência antes de inferir conexões.
- **11 · Mapear relacionamentos** (`comercial.account_intel.mapear-relacionamentos`; fase original: Essencial): Estruture entidades e relações em grafo/tabela; valide origem e abrangência antes de inferir conexões.
- **15 · Criar plano de multithreading** (`comercial.account_intel.criar-plano-de-multithreading`; fase original: Expansão): Aplicar esta operação de forma explícita ao artefato `BuyingCommitteeMap`: definir critério observável de “Criar plano de multithreading”, evidência mínima, exceção e campo de saída correspondente.
- **16 · Medir cobertura do comitê** (`comercial.account_intel.medir-cobertura-do-comite`; fase original: Expansão): Defina numerador, denominador, universo e data de corte; verifique amostra e qualidade.
- **22 · Sugerir matriz de interesses** (`comercial.account_intel.sugerir-matriz-de-interesses`; fase original: Expansão): Mostre pelo menos duas alternativas e condições de aceitação; não tome decisão irreversível.

## No modo consultivo
Entregar uma versão revisável com os dados colados pelo usuário, indicando as hipóteses e informações que exigem consulta ou autorização. Não persistir, contatar, recalcular dados ausentes ou criar fatos.

## Não executar / handoff
Se o objetivo passar da competência deste playbook, propor ao Supervisor o especialista certo; jamais chamar outra ferramenta/agente diretamente.
