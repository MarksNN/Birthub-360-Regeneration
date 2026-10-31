# P1 — Estratégia de cadência, canal e tempo
## Gatilho
Pedido para desenhar sequência de prospecção, definir canal/intervalo, adaptar por vertical ou janela de contato. Não usar para mandar mensagem real sem verificar P2 e política de envio.
## Entradas e checagens
ICP/segmento; motivo e valor; lista de canais autorizáveis; preferências; últimos toques; supressões; fuso e calendário; urgência e objetivo da campanha. Diferencie `UNKNOWN` de `PASS` para cada controle, especialmente quando não houve consulta a CRM.
## Procedimento geral
1. Escolha o público e defina hipótese de relevância baseada em dados confirmados ou em premissas declaradas.
2. Classifique canais como `permitido`, `pendente de verificação` ou `vedado`. Se canal WhatsApp não tiver elegibilidade demonstrada, **não aloque toque WhatsApp para envio**; no modo consultivo, pode fornecer apenas rascunho de template condicionado às regras.
3. Monte 3–6 pontos de contato como ponto de partida, com finalidade distinta por toque, sequência e stop rules. Ex.: D1, D3, D6, D10, D15, mas configure de acordo com histórico e política; não use a sequência como lei universal.
4. Cheque duplicidade, owner do contato, horários e condição de parada em resposta, descadastro, bounce, reclamação ou saturação.
5. Para cada toque, devolva `dia`, `canal`, `intenção`, `ângulo`, `pré-requisitos`, `saída` e `status de elegibilidade`.
## Habilidades cobertas (procedimentos distintos)
- **01 Criar cadência** (`comercial.outbound.criar-cadencia`): entregue tabela de toques com objetivo próprio, canais condicionados, ordem e stop rules. Aceite: nenhum toque sem condição de saída.
- **11 Definir intervalo de contatos** (`comercial.outbound.definir-intervalo-de-contatos`): compare frequência da organização ao histórico e ao fuso; proponha intervalos e justificativa de pressão/fadiga, sem repetir toque diário arbitrariamente. Aceite: espaçamento revisável e regra contra duplicidade.
- **16 Escolher canal por contexto** (`comercial.outbound.escolher-canal-por-contexto`): priorize canal aceito, relação existente, perfil do destinatário e capacidade do time; classifique email/telefone/WhatsApp/LinkedIn individualmente com status do gate. Aceite: opção proibida não entra em fila real.
- **21 Recomendar sequência por vertical** (`comercial.outbound.recomendar-sequencia-por-vertical`): adapte dor, calendário e linguagem a vertical e persona sem pressupor estatísticas não medidas. Aceite: hipótese de setor explicitada e sequência diferenciada.
- **23 Aplicar horário comercial** (`comercial.outbound.aplicar-horario-comercial`): converta datas para fuso do destinatário e calendário da organização; proponha remarcação quando fora da janela. Aceite: sem disparos fora da janela verificada.
## Saída
`CadenceDraft` em `artifacts`, com `touches[]`, `stopRules[]`, `prerequisites[]` e `channelEligibility[]`; nunca afirmar que os toques estão agendados se nenhum executor criou agendamento.
## Falhas e handoff
Sem histórico: rascunho `PARTIAL` com deduplicação pendente → `crm` se for necessário obter dados. ICP indefinido → `icp` pelo Supervisor. Canal proibido → retirar e sugerir canal viável.
