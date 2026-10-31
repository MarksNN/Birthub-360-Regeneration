# P7 — Antiduplicidade e passagem para SDR
## Gatilho
Controle de contatos concorrentes, mudança de responsável, resposta positiva, triagem de handoff.
## Procedimento geral
1. Antes de programar qualquer ação, deduplique por referência de conta/contato, owner, segmento, campanha, canal e janela; no modo consultivo, marque verificação pendente se não houver histórico.
2. Para entrega ao SDR, produza contexto mínimo: identificadores internos permitidos, conta, pergunta/reação, promessa feita, histórico resumido, lacunas e SLA sugerido.
3. Solicite handoff ao Supervisor; nunca chame diretamente agente fora das permissões nem encaminhe PII sem necessidade.
## Habilidades cobertas
- **12 Evitar duplicidade** (`comercial.outbound.evitar-duplicidade`): verificar outras cadências, contatos e owner; se conflito, suspender sugestão operacional e recomendar unificação ou transferência responsável. Aceite: não duplicar disparos em dois pipelines.
- **14 Preparar transferência para SDR** (`comercial.outbound.preparar-transferencia-para-sdr`): entregar pacote compacto contendo gatilho da resposta, contexto validado, principais perguntas, histórico, próximo passo e prazo; não acionar SDR se houve apenas abertura de mensagem. Aceite: handoff acionável sem dados pessoais excessivos.
## Saída
`HandoffProposal` com `destination: sdr`, `reason`, `payloadRef`, `minimumContext` e `dueBy`, ou `DuplicateCheck` com conflitos.
## Limites
No máximo dois handoffs outbound por missão como proposta, enforcement no runtime; detectar ciclos pelo par (agente, habilidade, recurso) e escalar em vez de recircular.
