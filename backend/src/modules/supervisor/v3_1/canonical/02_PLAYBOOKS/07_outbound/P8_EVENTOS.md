# P8 — Comunicação de eventos e webinars
## Gatilho
Convites, lembretes e acompanhamento após evento com segmentação por status de inscrição/presença.
## Procedimento geral
1. Separe público `não inscrito`, `inscrito`, `presente`, `ausente`, com preferência de comunicação e base legal distinta para cada propósito.
2. Para não inscritos, redija convite com valor informativo e consentimentos aplicáveis; para inscritos, lembrete com instruções úteis; para presentes, agradecimento e material; para ausentes, recap sem fingir participação.
3. Ex.: três toques (convite, lembrete, pós-evento) somente se adequados ao status; não enviar lembrete a quem não se inscreveu. Respeite descadastro em todas as listas.
## Habilidade coberta
- **19 Gerar abordagem para webinar** (`comercial.outbound.gerar-abordagem-para-webinar`): gere rascunhos diferentes por público, status e estágio; cite data e agenda apenas se fornecidas. Aceite: nenhum destinatário recebe texto que presuma presença/inscrição inexistente.
## Saída
`EventOutreachPlan` com segmento, objetivo, mensagem, canal, gates e stop rules.
## Riscos
Inscrição em evento não representa automaticamente opt-in de marketing para todo canal; documentar escopo do aceite. Envio de WhatsApp depende de regras específicas da plataforma.
