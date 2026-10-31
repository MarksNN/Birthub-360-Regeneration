# Data Map - Birthub 360° Regeneration
**Data de criação:** 31/10/2026
**Versão:** 1.0
**Status:** MINUTA PENDENTE DE VALIDAÇÃO JURÍDICA

---

## 1. Visão Geral

Este Data Map mapeia todas as operações de tratamento de dados pessoais realizadas pelo Birthub 360° Regeneration, identificando:
- Entidades e campos pessoais
- Finalidades de tratamento
- Bases legais aplicáveis
- Prazos de retenção
- Destinatários e suboperadores

---

## 2. Classificação de Dados

### 2.1 Dados Pessoais
Informações que identificam ou podem identificar uma pessoa física.

### 2.2 Dados Sensíveis
Dados que podem resultar em discriminação (não atualmente coletados).

### 2.3 Dados Empresariais
Dados relativos a pessoas jurídicas (CNPJ, razão social, etc.).

---

## 3. Entidades e Operações de Tratamento

### 3.1 User (Usuário)

| Campo | Tipo | Finalidade | Base Legal | Retenção | Destinatários |
|-------|------|------------|-----------|----------|--------------|
| email | Dado pessoal | Autenticação, comunicação | Execução de contrato | 5 anos após encerramento | Sistema interno |
| name | Dado pessoal | Identificação, comunicação | Execução de contrato | 5 anos após encerramento | Sistema interno |
| passwordHash | Dado pessoal sensível | Autenticação | Execução de contrato | Até exclusão de conta | Sistema interno |
| role | Dado pessoal | RBAC, autorização | Execução de contrato | 5 anos após encerramento | Sistema interno |

**Operações:**
- Coleta: Formulário de cadastro
- Processamento: Autenticação JWT, autorização
- Compartilhamento: Interno (multi-tenant isolado por organizationId)
- Retenção: Anonimização após período de retenção
- Descarte: Exclusão ou anonimização após período legal

---

### 3.2 Company (Empresa)

| Campo | Tipo | Finalidade | Base Legal | Retenção | Destinatários |
|-------|------|------------|-----------|----------|--------------|
| name | Dado empresarial | Identificação do cliente | Execução de contrato | Enquanto relação ativa + 5 anos | Sistema interno |
| tradeName | Dado empresarial | Identificação comercial | Execução de contrato | Enquanto relação ativa + 5 anos | Sistema interno |
| cnpj | Dado empresarial | Identificação fiscal | Execução de contrato, obrigação legal | Enquanto relação ativa + 5 anos | Sistema interno |
| phone | Dado pessoal | Contato comercial | Execução de contrato | Enquanto relação ativa + 5 anos | Sistema interno |
| website | Dado empresarial | Enriquecimento de perfil | Legítimo interesse | Enquanto relação ativa + 5 anos | Sistema interno |

**Operações:**
- Coleta: Formulário CRM
- Processamento: Gestão de clientes
- Compartilhamento: Interno (isolado por organizationId)
- Retenção: Preservado enquanto relação comercial ativa
- Descarte: Após período de retenção legal

---

### 3.3 Contact (Contato)

| Campo | Tipo | Finalidade | Base Legal | Retenção | Destinatários |
|-------|------|------------|-----------|----------|--------------|
| name | Dado pessoal | Identificação do contato | Execução de contrato | Enquanto necessário para CRM | Sistema interno |
| email | Dado pessoal | Comunicação | Execução de contrato, consentimento (marketing) | Enquanto necessário para CRM | Sistema interno |
| phone | Dado pessoal | Comunicação | Execução de contrato, consentimento (marketing) | Enquanto necessário para CRM | Sistema interno |
| roleTitle | Dado pessoal | Contexto profissional | Execução de contrato | Enquanto necessário para CRM | Sistema interno |

**Operações:**
- Coleta: Formulário CRM
- Processamento: Gestão de contatos
- Compartilhamento: Interno (isolado por organizationId)
- Retenção: Enquanto necessário para CRM
- Descarte: Após período de retenção

---

### 3.4 Lead (Lead/Prospecção)

| Campo | Tipo | Finalidade | Base Legal | Retenção | Destinatários |
|-------|------|------------|-----------|----------|--------------|
| title | Dado pessoal | Identificação da oportunidade | Legítimo interesse | 2 anos sem conversão | Sistema interno |
| notes | Dado pessoal (potencial) | Contexto da prospecção | Legítimo interesse | 2 anos sem conversão | Sistema interno |
| score | Dado pessoal (derivado) | Priorização | Legítimo interesse | 2 anos sem conversão | Sistema interno |

**Operações:**
- Coleta: Formulário de prospecção, importação
- Processamento: Qualificação, scoring
- Compartilhamento: Interno (isolado por organizationId)
- Retenção: 2 anos sem conversão, anonimização ou exclusão
- Descarte: Após período de retenção

---

### 3.5 Activity (Atividade)

| Campo | Tipo | Finalidade | Base Legal | Retenção | Destinatários |
|-------|------|------------|-----------|----------|--------------|
| description | Dado pessoal (potencial) | Registro de tarefa | Execução de contrato | 1 ano | Sistema interno |
| title | Dado pessoal (potencial) | Identificação da tarefa | Execução de contrato | 1 ano | Sistema interno |

**Operações:**
- Coleta: Formulário de atividades
- Processamento: Gestão de tarefas
- Compartilhamento: Interno (isolado por organizationId)
- Retenção: 1 ano (exceção: legal hold)
- Descarte: Após período de retenção

---

### 3.6 AuditLog (Log de Auditoria)

| Campo | Tipo | Finalidade | Base Legal | Retenção | Destinatários |
|-------|------|------------|-----------|----------|--------------|
| userId | Dado pessoal | Rastreabilidade | Obrigação legal, legítimo interesse | 7 anos | Sistema interno |
| entityType | Dado pessoal (contexto) | Contexto da ação | Obrigação legal, legítimo interesse | 7 anos | Sistema interno |
| diff | Dado pessoal (potencial) | Detalhes da alteração | Obrigação legal, legítimo interesse | 7 anos (sanitizado) | Sistema interno |

**Operações:**
- Coleta: Automático (middleware)
- Processamento: Auditoria, compliance
- Compartilhamento: Interno (isolado por organizationId)
- Retenção: 7 anos (obrigação legal típica)
- Descarte: Após período de retenção legal
- **Nota:** Campo `diff` deve ser sanitizado para remover PII sensível

---

### 3.7 SupervisorExecution (Execução do Supervisor)

| Campo | Tipo | Finalidade | Base Legal | Retenção | Destinatários |
|-------|------|------------|-----------|----------|--------------|
| userPrompt | Dado pessoal (potencial) | Orquestração de IA | Execução de contrato | 30 dias ou anonimização | Sistema interno |
| resultSummary | Dado pessoal (potencial) | Resumo da execução | Execução de contrato | 30 dias ou anonimização | Sistema interno |

**Operações:**
- Coleta: Input do usuário
- Processamento: Orquestração de agentes de IA
- Compartilhamento: Interno (isolado por organizationId) + provedores de IA (quando aplicável)
- Retenção: 30 dias ou anonimização imediata após uso
- Descarte: Após período de retenção
- **Nota:** Campo `userPrompt` deve ser mascarado para remover PII sensível (tokens, credenciais)

---

### 3.8 IntegrationConnection (Conexão de Integração)

| Campo | Tipo | Finalidade | Base Legal | Retenção | Destinatários |
|-------|------|------------|-----------|----------|--------------|
| config | Dado pessoal sensível | Configuração de integração | Execução de contrato | Enquanto ativa + backup | Sistema interno |
| credentialRef | Dado pessoal sensível | Referência a credencial | Execução de contrato | Enquanto ativa + backup | Sistema interno + cofre de segredos |

**Operações:**
- Coleta: Formulário de configuração
- Processamento: Sincronização com sistemas externos
- Compartilhamento: Interno (isolado por organizationId) + provedores externos (quando autorizado)
- Retenção: Enquanto conexão ativa + backup
- Descarte: Após desconexão + período de backup
- **Nota:** Credenciais nunca devem ser armazenadas em texto plano, apenas referência

---

### 3.9 WebhookInboxEvent / IntegrationOutboxEvent (Eventos de Webhook)

| Campo | Tipo | Finalidade | Base Legal | Retenção | Destinatários |
|-------|------|------------|-----------|----------|--------------|
| payload | Dado pessoal (potencial) | Sincronização de dados | Execução de contrato | 7-30 dias | Sistema interno |

**Operações:**
- Coleta: Webhook de provedores externos
- Processamento: Sincronização
- Compartilhamento: Interno (isolado por organizationId)
- Retenção: 7-30 dias (dependendo do tipo de evento)
- Descarte: Após período de retenção

---

## 4. Bases Legais

### 4.1 Execução de Contrato
Necessário para cumprir obrigações contratuais com clientes.

### 4.2 Legítimo Interesse
Interesses legítimos da empresa (prospecção, segurança, operação).

### 4.3 Consentimento
Tratamento que requer consentimento explícito (marketing, comunicação não essencial).

### 4.4 Obrigação Legal
Exigências legais (auditoria, retenção fiscal, compliance).

---

## 5. Suboperadores e Terceiros

### 5.1 Internos
- Todos os dados são processados internamente, isolados por organizationId.

### 5.2 Provedores de IA (quando aplicável)
- OpenAI, Anthropic, ou outros provedores de LLM
- Finalidade: Processamento de prompts do Supervisor
- Transferência internacional: Sim (quando aplicável)
- Cláusulas: DPA (Data Processing Agreement) necessário

### 5.3 Provedores de Integração (quando aplicável)
- Bitrix24, Apollo, Hunter, Google, etc.
- Finalidade: Sincronização de dados
- Transferência internacional: Sim (quando aplicável)
- Cláusulas: Termos de uso do provedor + DPA se necessário

---

## 6. Transferências Internacionais

Atualmente, o sistema não realiza transferências internacionais automatizadas de dados pessoais, exceto:
- Provedores de IA (quando configurado)
- Provedores de integração (quando configurado)

**Nota:** Qualquer transferência internacional deve ser:
- Informada ao titular
- Baseada em cláusulas contratuais adequadas (SCCs) ou consentimento
- Conforme Resolução CD/ANPD sobre transferências internacionais

---

## 7. Medidas de Segurança

- Isolamento multi-tenant por organizationId
- Criptografia em repouso (PostgreSQL)
- Criptografia em trânsito (HTTPS/TLS)
- Hash de senhas (bcryptjs)
- Cofre de segredos para credenciais
- Auditoria de ações sensíveis
- Rate limiting e prevenção de abuso

---

## 8. Direitos dos Titulares

Os titulares têm direito a:
- Acesso aos dados
- Correção de dados incompletos/ incorretos
- Portabilidade (quando aplicável)
- Oposição a tratamento (quando base legal for legítimo interesse)
- Exclusão (quando aplicável, sem violar obrigação legal)

**Nota:** Canais de solicitação de direitos devem ser implementados (Item 16).

---

## 9. Lacunas Identificadas

- [ ] Política de retenção não formalizada juridicamente
- [ ] Prazos de retenção sujeitos a validação jurídica
- [ ] Canais de direitos dos titulares não implementados
- [ ] DPA com provedores de IA não formalizado
- [ ] Cláusulas de transferência internacional não formalizadas

---

## 10. Revisão e Atualização

Este Data Map deve ser revisado:
- A cada 12 meses
- Quando houver mudança significativa na arquitetura
- Quando houver nova operação de tratamento
- Quando houver mudança na legislação

---

**Status:** MINUTA PENDENTE DE VALIDAÇÃO JURÍDICA
**Próxima revisão:** 31/10/2027
