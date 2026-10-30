# Supervisor núcleo — Birthub 360 Regeneration

O núcleo genérico convive com o supervisor comercial já existente. Nenhum dos dois substitui o outro.

## O que já existia

- `POST /api/supervisor/orchestrate` roteia o pedido para um agente do catálogo dos 394, aplica RBAC e, só se o agente está `EXECUTABLE`, grava atividade ou calcula RevOps no PostgreSQL.
- Agente `REGISTERED` ou `AVAILABLE` não executa ferramenta. O teste `agents-394` trava essa regra.
- Catálogo, importador idempotente, execuções e painel continuam iguais.

## O que este núcleo acrescenta

Estado de missão, plano versionado, separação entre habilidade e capability, aprovação humana que não pode ser forjada no payload, bloqueio de instrução externa, isolamento de organização e consolidação com tipo de evidência.

Rotas novas, todas autenticadas e filtradas pela organização do token:

| Método | Caminho | Efeito |
| --- | --- | --- |
| POST | `/api/supervisor/missions` | Abre missão. `correlationId` repetido devolve a mesma missão. |
| GET | `/api/supervisor/missions` | Lista só a organização do token. |
| GET | `/api/supervisor/missions/:id` | Detalhe. Outra organização recebe 404. |
| POST | `/api/supervisor/missions/:id/approve` | `decision`: `aprovada` ou `rejeitada`. Exige perfil ADMIN ou MANAGER. |
| POST | `/api/supervisor/missions/:id/resume` | Continua sem repetir tarefa já concluída. |
| POST | `/api/supervisor/missions/:id/data` | Entrega dado que faltou. |
| POST | `/api/supervisor/missions/:id/cancel` | Cancela o restante. |

A gravação de estágio no CRM só ocorre depois da aprovação e só se o negócio ainda está no estágio lido. Conflito não é reportado como sucesso.

## Como acrescentar habilidade

1. Declarar a habilidade com entradas, risco, critério de sucesso e status.
2. Declarar a ferramenta e o binding para um executor existente.
3. Conceder capability ao agente, na organização. Catálogo sem capability não executa.
4. Incluir a habilidade num fluxo. Sem fluxo, o pedido termina em lacuna.
5. Status `proposta`, `mapeada` ou `indisponivel` não ganha execução.

Registrar habilidade nova não cria agente e não cria permissão.

## Limitações

- `/orchestrate` não passou a usar a máquina de estados. Os testes da Fase 01 e da Fase 02 dependem do contrato antigo.
- O vocabulário de estágio do núcleo é `qualificacao`, `proposta`, `negociacao`, `ganho`, `perdido`. Prospect entra com peso zero na estimativa.
- Não há conector novo. Pedido de integração devolve parecer e não liga sistema externo.
- A estimativa de receita pondera valor e estágio já gravados. Não completa dado ausente.
- ADMIN e MANAGER aprovam. CLOSER, SDR, BDR e VIEWER não aprovam no núcleo, mesmo que o legado deixe o CLOSER criar atividade por `/orchestrate`.
- É preciso aplicar a migration `20261030123000_supervisor_missions` antes de usar as rotas novas.

## Prova automática

`backend/tests/supervisor-kernel.test.ts` cobre planejamento, roteamento, aprovação real, rejeição, parecer sem implementação, ferramenta indisponível, isolamento, retomada idempotente, habilidade sem permissão, paralelismo e instrução externa.
