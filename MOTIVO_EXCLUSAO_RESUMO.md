# 📋 Resumo das Mudanças - Motivo de Exclusão de O.S.

## 🎯 Objetivo
Registrar obrigatoriamente o motivo quando um administrador deleta uma Ordem de Serviço, com auditoria completa.

---

## 📁 Arquivos Modificados

### 1. **backend/models.py**
```python
# Adicionado:
- Função get_datetime_br() para horário em São Paulo (UTC-3)
- Colunas na classe OrdemServico:
  * motivo_exclusao: TextField
  * data_exclusao: DateTime
- Campos no método to_dict()
```

**Linha de impacto:** ~390 linhas

### 2. **backend/routes/os_routes.py**
```python
# Modificada função deletar_ordem():
- Importação: get_datetime_br (do models)
- Recebe JSON com 'motivo' obrigatório
- Valida se motivo está preenchido
- Registra motivo e data antes de deletar
- Auditoria inclui o motivo
```

**Linhas modificadas:** 365-420

### 3. **backend/static/js/app.js**
```javascript
// Modificada função excluirOS():
- Adicionado prompt() para pedir o motivo
- Motivo é obrigatório (valida se vazio)
- Passa motivo para APIClient
- Mensagem de sucesso mostra o motivo registrado
```

**Linhas modificadas:** 1495-1530

### 4. **backend/static/js/api-client.js**
```javascript
// Modificada função deletarOrdemServico():
- Parâmetro mudou de reverterEstoque para motivo
- Envia motivo no corpo da requisição (JSON)
```

**Linhas modificadas:** 150-156

### 5. **backend/scripts/migracao/add_motivo_exclusao.py** ✨ NOVO
```python
# Script de migração que:
- Adiciona coluna motivo_exclusao (TEXT)
- Adiciona coluna data_exclusao (DATETIME)
- Verifica se colunas já existem
- Trata erros gracefully
- Mostra relatório final
```

**Novo arquivo:** Criar e executar antes de usar

### 6. **docs/MOTIVO_EXCLUSAO_OS.md** ✨ NOVO
```markdown
# Documentação completa da funcionalidade
- Como usar
- Exemplos de motivos
- Checklist de testes
- Como deployar
```

---

## 🔄 Fluxo Técnico

```
1. Admin clica "Deletar O.S."
   ↓
2. Frontend (app.js) pede confirmação dupla
   ↓
3. Frontend mostra prompt: "Digite o motivo"
   ↓
4. Frontend valida se motivo não está vazio
   ↓
5. Frontend envia DELETE para /ordens-servico/{id}
   com JSON: { "motivo": "..." }
   ↓
6. Backend (os_routes.py):
   - Extrai motivo do JSON
   - Valida motivo obrigatório
   - Registra motivo_exclusao na O.S.
   - Registra data_exclusao
   - Reverte estoque automaticamente
   - Deleta O.S.
   - Registra auditoria com motivo
   ↓
7. Frontend mostra sucesso com motivo
   ↓
8. Usuário acessa Auditoria e vê tudo registrado
```

---

## 📊 Estrutura de Dados

### Tabela: ordens_servico

```sql
ALTER TABLE ordens_servico ADD COLUMN motivo_exclusao TEXT;
ALTER TABLE ordens_servico ADD COLUMN data_exclusao DATETIME;
```

### Tabela: auditoria (registro de exclusão)

```json
{
  "id": 12345,
  "usuario_id": 1,
  "usuario_email": "admin@email.com",
  "acao": "DELETE",
  "modulo": "OS",
  "entidade_tipo": "ordens_servico",
  "entidade_id": 123,
  "descricao": "Deletou Ordem de Serviço #123 - Evento X\nMotivo: Cancelamento por solicitação do cliente",
  "dados_antes": { "...": "..." },
  "dados_depois": null,
  "ip_address": "192.168.1.1",
  "data_hora": "2025-11-11 16:30:45"
}
```

---

## 🧪 Testes Necessários (LOCAL)

1. ✅ Rodar migração: `python scripts/migracao/add_motivo_exclusao.py`
2. ✅ Iniciar app: `python app.py`
3. ✅ Criar O.S. de teste
4. ✅ Tentar deletar sem motivo (deve pedir motivo)
5. ✅ Deletar com motivo (deve funcionar)
6. ✅ Verificar auditoria (motivo deve estar lá)
7. ✅ Verificar horário (deve estar em São Paulo)

---

## ✅ Checklist de Implementação

- [x] Adicionar colunas ao modelo
- [x] Atualizar método to_dict()
- [x] Modificar rota de exclusão
- [x] Validar motivo obrigatório
- [x] Registrar motivo na auditoria
- [x] Registrar data/hora correta (UTC-3)
- [x] Atualizar frontend (prompt)
- [x] Atualizar APIClient
- [x] Criar script de migração
- [x] Criar documentação

---

## 🚀 Como Usar (Passo a Passo)

### Local:
```bash
# 1. Executar migração
cd backend
python scripts/migracao/add_motivo_exclusao.py

# 2. Iniciar app
python app.py

# 3. Ir para http://localhost:5000
# 4. Criar e deletar O.S. de teste
# 5. Verificar auditoria
```

### Produção (depois):
```bash
# 1. No VPS
cd /var/www/controle-itens-eventos/backend
python scripts/migracao/add_motivo_exclusao.py

# 2. Reiniciar serviço
sudo systemctl restart controle-itens

# 3. Testar deletar O.S.
```

---

## 📝 Notas Importantes

- ⚠️ **NÃO** fazer commit no GitHub ainda (conforme solicitado)
- 📌 Motivo é **obrigatório** (não pode deixar vazio)
- 🔒 Apenas **administradores** podem deletar
- ⏰ Horário registrado em **São Paulo (UTC-3)**
- 📊 Auditoria preserva **dados completos** da O.S. antes de deletar
- 🔄 Estoque continua sendo **revertido automaticamente**

---

## 🎯 Resultado Final

Quando admin deleta uma O.S. agora:

1. ✅ Deve informar o **motivo obrigatório**
2. ✅ Motivo é **registrado no banco** (coluna motivo_exclusao)
3. ✅ Data/hora é **registrada** (coluna data_exclusao)
4. ✅ Auditoria mostra **tudo** (quem, quando, por quê)
5. ✅ Estoque é **revertido** como antes
6. ✅ O.S. é **deletada permanentemente**

**Resultado:** Rastreabilidade completa de exclusões! 🎉
