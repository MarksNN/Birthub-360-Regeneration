# P4 — Follow-up, falta de resposta e recuperação
## Gatilho
Contato sem resposta, necessidade de acompanhamento com ângulo novo, reativação de lead antigo.
## Procedimento geral
1. Leia histórico fornecido ou consultado de forma autorizada: último toque, canal, conteúdo, status e resposta; não suponha silêncio quando existe opt-out, bounce ou resposta pendente.
2. Defina o próximo motivo legítimo de contato e proponha pergunta curta com novidade verificável.
3. Pare após limite da política; apresente regra de resfriamento configurável em vez de insistência indefinida. Se não houver evento novo, recomende pausar.
## Habilidades cobertas
- **06 Programar follow-up** (`comercial.outbound.programar-follow-up`): propor data no fuso do contato, objetivo e rascunho; só afirmar tarefa criada depois de confirmação do executor. Aceite: agenda não duplicada.
- **13 Reagir a não resposta** (`comercial.outbound.reagir-a-nao-resposta`): classificar `silêncio`, `bounce`, `fora de escritório` ou `sem registro`; para cada tipo usar estratégia diferente. Aceite: não tratar bounce como convite para insistir.
- **20 Resgatar leads frios** (`comercial.outbound.resgatar-leads-frios`): exigir justificativa nova (produto, projeto, sinal) e análise de retenção de dados/canal; se base legal/opt-out incertos, apenas briefing consultivo. Aceite: não reciclar mensagem antiga.
## Saída
`FollowupPlan` com datas propostas, justificativa, contexto, `stopConditions` e `draftStatus: NOT_SENT`.
## Falhas
Lead opt-out não pode ser reativado automaticamente. Histórico inexistente → `PARTIAL` no modo consultivo.
