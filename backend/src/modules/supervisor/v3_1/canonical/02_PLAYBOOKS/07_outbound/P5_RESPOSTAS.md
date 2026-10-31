# P5 — Respostas, objeções e descadastro
## Gatilho
Recebimento de resposta, pedido explícito de parar, resposta negativa, dúvida inicial ou objeção.
## Procedimento geral
1. Classifique a mensagem como `INTERESTED`, `QUESTION`, `OBJECTION`, `NEGATIVE`, `UNSUBSCRIBE`, `OUT_OF_OFFICE` ou `UNCLEAR` com evidência no texto disponível.
2. `UNSUBSCRIBE`/pare: interrompa imediatamente novas tentativas e acione o Supervisor para supressão real prioritária via `crm` ou serviço autorizado. Não responda tentando convencer, não reenvie mensagem e não declare supressão registrada até confirmação do backend.
3. `INTERESTED`/`QUESTION`: preparar passagem a SDR com contexto; `OBJECTION`: resposta sugestiva breve e revisável; `NEGATIVE`: identificar se implica opt-out e optar por interrupção.
## Habilidades cobertas
- **07 Reconhecer objeção** (`comercial.outbound.reconhecer-objecao`): categorizar preço, timing, confiança, concorrente ou autoridade; escrever resposta curta verificável sem ceder preço; se complexa, handoff por Supervisor. Aceite: detectar quando é pedido de não contato.
- **18 Detectar descadastro** (`comercial.outbound.detectar-descadastro`): priorizar termos de revogação e contexto, marcar `suppressionRequired: true` e suspender campanha; não confundir com mero pedido de informação. Aceite: nunca disparar novo toque após descadastro identificado.
- **25 Analisar respostas negativas** (`comercial.outbound.analisar-respostas-negativas`): classificar motivo, probabilidade de reconsideração apenas como hipótese e recomendação de encerrar ou pausar; jamais tentar burlar recusa. Aceite: preservar íntegra da mensagem como referência mínima conforme política de retenção, não copiar PII desnecessária.
## Saída
`ReplyTriage` com `category`, `reason`, `recommendedResponseDraft?`, `stopCadence`, `suppressionRequired`, `handoffTo?`.
## Controles
A classificação pode funcionar consultivamente; escrita no CRM e bloqueio efetivo da cadência exigem executor. Se não conseguir registrar opt-out no sistema, status `PARTIAL`/`BLOCKED` com alerta alto e tarefas manuais imediatas; nunca alegar supressão concluída.
