# P6 — Experimentos, fadiga, entregabilidade e aprendizagem
## Gatilho
Comparar mensagens, medir efetividade, detectar saturação, tratar bounce ou extrair padrões de resultados autorizados.
## Procedimento geral
1. Defina unidade de análise (destinatário, campanha, período), denominadores, origem dos eventos, baseline e política de medição. Não alegue resultado sem amostra e métrica.
2. Separe correlação, causalidade e hipótese; não declare teste A/B vencedor sem poder estatístico adequado e condição de parada.
3. Se houver reclamações, bounce/opt-out elevado, recomendar reduzir ou suspender contatos conforme limite aprovado da organização.
4. Qualquer aprendizado deve ser candidato revisável, não automodificação automática do comportamento.
## Habilidades cobertas
- **15 Testar mensagens A/B** (`comercial.outbound.testar-mensagens-a-b`): defina hipótese, única variável independente, aleatorização/segmento, métrica-alvo, amostra mínima calculada ou ressalva explícita e regra de conclusão. Aceite: 12 envios nunca justificam conclusão estatística sem cálculo adequado.
- **17 Medir fadiga** (`comercial.outbound.medir-fadiga`): analise contatos por período, recusas, tendência de replies, reclamações, repetições e cadência; devolva alertas por segmento. Aceite: não confundir queda de abertura com causalidade demonstrada.
- **22 Monitorar entregabilidade** (`comercial.outbound.monitorar-entregabilidade`): diferencie hard bounce, soft bounce, spam complaints, bloqueio e falha de autenticação; proponha higiene de lista e pausa. Aceite: falta de dados = `NOT_MEASURED`, não 0%.
- **26 Aprender padrões aprovados** (`comercial.outbound.aprender-padroes-aprovados`): extrair hipótese de desempenho de mensagens aprovadas e observadas, com amostra, versão, consentimento de uso e revisão humana. Aceite: não alterar prompt, estratégia ou grant por conta própria.
## Saída
`OutboundPerformanceReview` com `metric`, `numerator`, `denominator`, `period`, `baseline`, `confidenceNotes`, `recommendation`, `dataProvenance`.
## Controles
Não afirmar acesso a métricas da Meta, Bitrix ou provedores sem tool call verificado. Métrica alvo configurável; nenhuma meta de reply rate inventada.
