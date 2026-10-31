# Birthub 360 Regeneration — Workflows (2026-10-31)

## Escopo e política

Os workflows foram construídos **para o código presente neste repositório**: `backend/` (Express, Prisma, PostgreSQL, Supervisor), `frontend/` (React/Vite) e `docker-compose.yml`.

**Local-first:** nesta fase, os arquivos são declarativos e têm apenas `workflow_dispatch` (execução manual), ou `workflow_call` (invocação por outro workflow). Não existe gatilho `push`, `pull_request`, `schedule`, deploy, release publicado ou escrita em ambiente de produção. O workflow 00 deve ser executado manualmente somente após os ajustes locais e a aprovação da equipe. Ter workflows no repositório **não significa que já passaram nos testes**.

## Catálogo

| Arquivo | Finalidade |
| --- | --- |
| `00-verificacao-integral.yml` | Coordenar as verificações com gate final estrito e opções para E2E/Sonar |
| `01-quality.yml` | Biome, typecheck e build de backend e frontend |
| `02-database.yml` | Prisma, PostgreSQL 16 temporário, seed idempotente e contagem 394 |
| `03-integration.yml` | Integração CRM, dados, tenant e RevOps |
| `04-supervisor-agents.yml` | Catálogo canônico, Supervisor, RBAC e status reais dos agentes |
| `05-playwright-e2e.yml` | Testes E2E com Edge no Linux, API e frontend temporários |
| `06-dependencies.yml` | Bloqueio de .env privado versionado e npm audit |
| `07-codeql.yml` | Análise estática JavaScript/TypeScript |
| `08-sonarqube.yml` | SonarQube/Cloud condicionado às variáveis e ao token reais |
| `09-docker-compose.yml` | Validação e subida/remoção do PostgreSQL Docker isolado |
| `10-release-package.yml` | Compilação e artefato .tar.gz; **não faz deploy** |
| `11-trivy.yml` | Varredura de vulnerabilidades, segredos, configuração e SARIF |

A ação local `.github/actions/setup-regeneration/action.yml` prepara Node 22, executa `npm ci` com lockfiles e gera o Prisma Client.

## Prérequisitos

1. **Sincronizar o código:** os workflows pressupõem que a branch contém os arquivos `backend/`, `frontend/`, `biome.json`, dois lockfiles e a aplicação existente.
2. **SonarQube:** cadastrar `SONAR_TOKEN` em Actions Secrets e `SONAR_ORGANIZATION` (slug da organização real, não o nome da variável), `SONAR_PROJECT_KEY` e opcionalmente `SONAR_HOST_URL` em Actions Variables. Executar Sonar só após configurar o projeto no serviço; o valor da organização deve ser seu **slug efetivo**. Não confundir `SONAR_ORGANIZATION` (nome fixo da variável) com seu conteúdo.
3. **Dados:** todas as suítes com PostgreSQL usam um serviço efêmero no runner e `DATABASE_URL` exclusivo de CI. Nunca apontar para seu Docker de rede local ou banco de produção.
4. **Antes de produção:** substituir e rotacionar as credenciais demo e senhas estáticas atualmente documentadas no repositório, endurecer a configuração de CORS e revisar seeds. Não promover o artefato diretamente para produção.
5. **Proteção de branch:** não definir checks obrigatórios na main enquanto os workflows forem exclusivamente manuais; caso contrário, novos PRs podem ficar bloqueados. Implementar CI de PR **somente após** homologação da reconstrução local.

## Como operar

Depois que estes arquivos entrarem em `main`, abrir **GitHub → Actions → Birthub Regen / 00 - Verificação Integral → Run workflow**, marcar as opções desejadas e acompanhar todos os resultados. Um resultado `skipped` não é tratado como sucesso para gates obrigatórios. Falhas existentes no código, credenciais ausentes ou scanners são problemas reais a corrigir antes de liberar a automação.

## Não implementados ainda

Android/iOS, publicações Docker/GHCR, AWS/ArgoCD, homologação externa, backup de banco real, regressão visual por snapshots e testes de acessibilidade específicos: **não há comprovação de código, configuração ou recursos completos no Regeneration atual** para executá-los responsavelmente. Esses workflows serão criados na fase correspondente, após o respectivo módulo existir e passar nos gates locais.

## Riscos identificados antes da primeira execução

- `backend/package.json` declarava Biome 1.9, enquanto o `package-lock.json` trazia Biome 2.6.4. O PR sincroniza o manifesto sem modificar o lockfile.
- Configuração de desenvolvimento com credenciais e JWT de exemplo versionadas; não reutilizar em produção.
- Os testes atuais do Supervisor pressupõem a presença de registros criados pelo seed e não devem ser executados sem a etapa de banco.
- Playwright está configurado para **Microsoft Edge** (channel msedge); o job instala explicitamente esse navegador.

**Status de aprovação:** CRIADO EM BRANCH / AGUARDANDO REVISÃO E EXECUÇÃO. Não há promessa de CI verde sem execução dos testes.
