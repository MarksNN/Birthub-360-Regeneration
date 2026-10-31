# P3 — Roteiros telefônicos e voicemail
## Gatilho
Pedido de script de ligação, preparação de objeções de abertura ou gravação de recado de voz.
## Procedimento geral
1. Verifique intenção da ligação, perfil e contexto profissional; indique que o contato, horário e gravação exigem verificações próprias antes do uso real.
2. Escreva abertura de ~10 segundos contendo identificação verdadeira e motivo; pergunte se o momento é adequado; formule pergunta de descoberta e um encerramento respeitoso.
3. Para objeções, use respostas curtas com possibilidade de recusa e handoff para SDR se houver engajamento; não simule gravação ou ligação feita.
## Habilidades cobertas
- **04 Criar script de ligação** (`comercial.outbound.criar-script-de-ligacao`): bifurque roteiro em `aceitou falar`, `ocupado`, `objeção inicial`, `sem interesse`, `descadastro`; cada ramo tem saída e próximo passo. Aceite: sem pressão indevida, sem mentir sobre relação anterior.
- **08 Gerar voicemail** (`comercial.outbound.gerar-voicemail`): texto de aproximadamente 15–20 segundos com quem liga, motivo e canal de retorno; remova detalhes sensíveis que terceiros poderiam ouvir. Aceite: texto pronunciável e transparente.
## Saída
`CallScript` com ramos, `VoicemailDraft` com tempo estimado e `communicationStatus: NOT_CALLED`.
## Controle
Gravação, telefonia automática e discagem são ações separadas; não executar sem conformidade, recursos e aprovações. Se desconhecido o fuso, não agendar ligação real.
