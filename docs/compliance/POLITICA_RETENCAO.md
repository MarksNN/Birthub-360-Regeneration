# Política de Retenção de Dados - Birthub 360° Regeneration
**Data de criação:** 31/10/2026
**Versão:** 1.0
**Status:** MINUTA PENDENTE DE VALIDAÇÃO JURÍDICA

---

## 1. Objetivo

Esta política estabelece os prazos de retenção e descarte de dados pessoais e empresariais processados pelo Birthub 360° Regeneration, em conformidade com a LGPD e outras obrigações legais aplicáveis.

---

## 2. Escopo

Esta política aplica-se a:
- Todos os dados pessoais processados pelo sistema
- Todos os tenants (organizations)
- Todas as operações de tratamento
- Backup e logs

---

## 3. Princípios

### 3.1 Minimização
Dados são retidos apenas pelo tempo necessário para a finalidade declarada.

### 3.2 Finalidade
Dados são descartados quando a finalidade do tratamento é alcançada.

### 3.3 Legalidade
Prazos de retenção respeitam obrigações legais (fiscais, trabalhistas, civis).

### 3.4 Reversibilidade
Processos de descarte são documentados e, quando possível, reversíveis.

---

## 4. Tabela de Retenção por Categoria

### 4.1 Dados de Autenticação e Usuário

| Categoria | Entidade | Prazo de Retenção | Disparo de Descarte | Exceções |
|-----------|----------|-------------------|---------------------|----------|
| Usuário ativo | User | Enquanto ativo | Exclusão da conta | Legal hold |
| Usuário inativo | User | 5 anos após inatividade | Data de último login + 5 anos | Legal hold |
| Credenciais | User.passwordHash | Até exclusão | Exclusão da conta | Nenhuma |
| Tokens de sessão | N/A (JWT) | 24 horas | Expiração do token | Nenhuma |

### 4.2 Dados de CRM (Clientes, Contatos, Leads)

| Categoria | Entidade | Prazo de Retenção | Disparo de Descarte | Exceções |
|-----------|----------|-------------------|---------------------|----------|
| Empresa ativa | Company | Enquanto relação ativa + 5 anos | Encerramento da relação + 5 anos | Legal hold |
| Contato ativo | Contact | Enquanto necessário para CRM | Última interação + 2 anos | Legal hold |
| Lead convertido | Lead | Permanente (vira Deal) | Conversão em oportunidade | Legal hold |
| Lead não convertido | Lead | 2 anos sem conversão | Criação + 2 anos sem atividade | Legal hold |
| Deal ativo | Deal | Enquanto relação ativa + 5 anos | Encerramento + 5 anos | Legal hold |
| Atividade | Activity | 1 ano | Data de conclusão + 1 ano | Legal hold |

### 4.3 Dados de Auditoria e Logs

| Categoria | Entidade | Prazo de Retenção | Disparo de Descarte | Exceções |
|-----------|----------|-------------------|---------------------|----------|
| Logs de auditoria | AuditLog | 7 anos | Data de criação + 7 anos | Nenhuma (obrigação legal) |
| Logs de aplicação | N/A (arquivos) | 90 dias | Data de criação + 90 dias | Nenhuma |
| Logs de acesso | N/A (arquivos) | 180 dias | Data de criação + 180 dias | Nenhuma |
| Execuções do Supervisor | SupervisorExecution | 30 dias | Data de criação + 30 dias | Legal hold |

### 4.4 Dados de Integração

| Categoria | Entidade | Prazo de Retenção | Disparo de Descarte | Exceções |
|-----------|----------|-------------------|---------------------|----------|
| Conexão ativa | IntegrationConnection | Enquanto ativa + 90 dias backup | Desconexão + 90 dias | Legal hold |
| Eventos de webhook | WebhookInboxEvent | 7 dias | Data de criação + 7 dias | Nenhuma |
| Eventos de outbox | IntegrationOutboxEvent | 30 dias | Data de criação + 30 dias | Nenhuma |
| Configurações | IntegrationConnection.config | Enquanto ativa + 90 dias backup | Desconexão + 90 dias | Legal hold |

### 4.5 Dados de Backup

| Categoria | Tipo | Prazo de Retenção | Disparo de Descarte | Exceções |
|-----------|------|-------------------|---------------------|----------|
| Backup diário | PostgreSQL | 30 dias | Data de criação + 30 dias | Nenhuma |
| Backup semanal | PostgreSQL | 90 dias | Data de criação + 90 dias | Nenhuma |
| Backup mensal | PostgreSQL | 12 meses | Data de criação + 12 meses | Legal hold |

---

## 5. Legal Hold

### 5.1 Definição
Legal hold é a suspensão do descarte de dados quando há:
- Processo judicial ou administrativo em andamento
- Investigação regulatória
- Requisição de autoridade competente
- Obrigação legal específica que exija retenção além do padrão

### 5.2 Processo
1. Identificação da necessidade de legal hold (jurídico/compliance)
2. Marcação de registros afetados (flag `legalHold: true`)
3. Suspensão automática de expurgo para registros marcados
4. Revisão periódica (a cada 6 meses)
5. Liberação após encerramento do processo

### 5.3 Implementação Técnica
- Adicionar campo `legalHold` (Boolean) em tabelas principais
- Funções de expurgo verificam flag antes de deletar
- Log de ativação/desativação de legal hold

---

## 6. Anonimização vs. Exclusão

### 6.1 Anonimização
Remove elementos identificadores mantendo estrutura:
- Email → hash ou placeholder
- Nome → "Anonimizado"
- Telefone → mascarado
- Preserva integridade referencial

**Uso:** Quando dados ainda são necessários para estatísticas ou auditoria, mas identificação não é mais necessária.

### 6.2 Exclusão
Remove permanentemente o registro:
- DELETE FROM tabela WHERE id = ?
- Cascata conforme schema
- Não reversível sem backup

**Uso:** Quando não há mais necessidade legal ou contratual dos dados.

---

## 7. Processo de Expurgo

### 7.1 Disparo Automático
Job agendado (cron) executa diariamente:
1. Busca registros expirados (data de retenção < hoje)
2. Verifica legal hold
3. Aplica anonimização ou exclusão
4. Registra ação em AuditLog

### 7.2 Disparo Manual
Administrador pode solicitar expurgo manual:
1. Solicitação documentada
2. Aprovação jurídica (quando aplicável)
3. Execução com backup prévio
4. Confirmação e log

### 7.3 Tenant-Specific
Expurgo pode ser solicitado por tenant:
1. Solicitação via canais de direitos do titular
2. Validação de identidade
3. Verificação de base legal para exclusão
4. Execução com preservação de obrigações legais

---

## 8. Backup e Restauração

### 8.1 Backup
- Backup diário automático (manutenção de 30 dias)
- Backup semanal (manutenção de 90 dias)
- Backup mensal (manutenção de 12 meses)
- Armazenamento seguro (criptografado)

### 8.2 Restauração
- Restauração requer autorização administrativa
- Backup de backup é mantido por 7 dias após restauração
- Log de restauração em AuditLog

### 8.3 Exclusão de Backup
- Backups expiram conforme tabela de retenção
- Exclusão automática de backups expirados
- Exceção: legal hold

---

## 9. Transferências Internacionais

Dados transferidos internacionalmente (ex: provedores de IA) devem:
- Ter finalidade documentada
- Ter base legal adequada
- Ter cláusulas contratuais (SCCs ou equivalente)
- Seguir prazos de retenção desta política

---

## 10. Revisão e Atualização

Esta política deve ser revisada:
- A cada 12 meses
- Quando houver mudança na legislação
- Quando houver nova operação de tratamento
- Quando houver incidente de segurança que impacte retenção

---

## 11. Responsabilidades

| Papel | Responsabilidade |
|-------|------------------|
| DPO/Encarregado | Definir prazos, revisar política, responder autoridades |
| Engenharia | Implementar controles técnicos, executar expurgo |
| Jurídico | Validar prazos, aprovar legal hold |
| Compliance | Monitorar conformidade, auditorias |

---

## 12. Lacunas e Pendências

- [ ] Prazos sujeitos a validação jurídica específica
- [ ] Legal hold não implementado tecnicamente
- [ ] Job de expurgo automático não implementado
- [ ] Canais de direitos do titular não implementados

---

**Status:** MINUTA PENDENTE DE VALIDAÇÃO JURÍDICA
**Próxima revisão:** 31/10/2027
