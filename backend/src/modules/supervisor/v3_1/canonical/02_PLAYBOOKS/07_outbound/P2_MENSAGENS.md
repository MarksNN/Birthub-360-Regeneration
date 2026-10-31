# P2 — Mensagens comerciais e personalização verificável
## Gatilho
Redação, variações de abertura, adaptação por canal e perfil. Entrega principal é texto NÃO ENVIADO; nunca implica integração ativa.
## Procedimento geral
1. Escolha UMA hipótese de relevância e diferencie fatos verificáveis de inferência de dor. Use apenas fatos profissionais adequados à finalidade.
2. Estabeleça posição do remetente e uma proposta de valor defensável, sem fingir contato anterior, crescimento ou compra não comprovados.
3. Redija no canal e no tom corretos. Padrões configuráveis sugeridos: e-mail assunto curto (até 6 palavras), corpo conciso (até 90 palavras), CTA único de baixo atrito; WhatsApp até 50 palavras como rascunho, com identificação e opção de parar; isso não substitui templates aprovados.
4. Inclua `personalizationRationale`, `factSource`, `hypotheses` e `compliancePreconditions`; se não houver gancho verificável, use argumento genérico explicitamente marcado como hipótese.
## Habilidades cobertas (procedimentos distintos)
- **02 Personalizar primeiro contato** (`comercial.outbound.personalizar-primeiro-contato`): selecione um fato empresarial confirmado com fonte ou marque hipótese; construa ponte entre fato e valor. Aceite: sem insinuação de intimidade ou monitoramento invasivo.
- **03 Escrever cold e-mail** (`comercial.outbound.escrever-cold-e-mail`): gere assunto, abertura, desenvolvimento e CTA; confira identificação e alternativa de recusa para o envio real. Aceite: texto sem falsa urgência, contendo único pedido claro.
- **05 Adaptar mensagem para WhatsApp** (`comercial.outbound.adaptar-mensagem-para-whatsapp`): adapte tom e formato, mas distinga `DRAFT_TEMPLATE`, `TEMPLATE_APPROVED` e `IN_WINDOW_FREEFORM`. Sem verificação da política e opt-in/aceite aplicável não iniciar contato; uso de template aprovado no primeiro toque de iniciativa empresarial. Aceite: saída pode ser rascunho, nunca confirmação de template.
- **09 Ajustar tom** (`comercial.outbound.ajustar-tom`): reescreva texto preservando afirmações verificáveis e CTA, calibrando formalidade para cargo/setor. Aceite: não altere preço ou promessas de produto.
- **10 Usar gatilho de compra** (`comercial.outbound.usar-gatilho-de-compra`): associe notícia, evento ou sinal a hipótese de oportunidade somente quando houver fonte e data; não transformar correlação em certeza. Aceite: referência auditável ou hipótese claramente rotulada.
- **24 Criar variações de icebreaker** (`comercial.outbound.criar-variacoes-de-icebreaker`): produza três aberturas com ângulos realmente diferentes (resultado, processo, risco) e uma justificativa por variante. Aceite: não repetir frases com sinônimos.
## Saída
`MessageDraft` com `channel`, `subject?`, `body`, `cta`, `personalizationRationale`, `factSource`, `draftStatus: NOT_SENT`, `compliancePreconditions`.
## Bloqueios e exceções
Pedido de falsificar relacionamento ou manipular dados pessoais → recusar a técnica e fornecer abordagem transparente. Pedido de enviar com WhatsApp sem requisitos → permitir rascunho isolado, bloquear ação real.
