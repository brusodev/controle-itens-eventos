# 🗑️ Sistema de Motivo de Exclusão de O.S.

## Implementação Concluída ✅

Foi implementado um novo sistema para registrar o **motivo da exclusão** de Ordens de Serviço quando um administrador as deleta.

---

## 📋 O que foi Implementado

### 1. **Novas Colunas no Banco de Dados**
- `motivo_exclusao` (TEXT) - Armazena o motivo da exclusão
- `data_exclusao` (DATETIME) - Armazena a data/hora da exclusão em São Paulo

### 2. **Fluxo de Exclusão Atualizado**

**ANTES:**
```
Admin clica em deletar → Dupla confirmação → O.S. deletada
```

**AGORA:**
```
Admin clica em deletar 
  ↓
Dupla confirmação de segurança
  ↓
Pergunta obrigatória: "Digite o motivo da exclusão"
  ↓
Backend registra:
  - Motivo na coluna motivo_exclusao
  - Data/hora da exclusão
  - Auditoria com detalhes completos
  ↓
O.S. deletada com estoque revertido
```

### 3. **Auditoria Completa**

Quando uma O.S. é deletada, a auditoria registra:
```
{
  "acao": "DELETE",
  "modulo": "OS",
  "descricao": "Deletou Ordem de Serviço #123 - Evento X\nMotivo: Cancelamento por solicitação do cliente",
  "dados_antes": {...dados completos da O.S.},
  "usuario": "admin@email.com",
  "data_hora": "11/11/2025, 16:30:45"
}
```

---

## 🔧 Como Usar

### Passo 1: Adicionar as Colunas ao Banco (LOCAL)

```bash
cd c:\Users\bruno.vargas\Desktop\PROJETOS\controle-itens-eventos\backend

# Rodar o script de migração
python scripts/migracao/add_motivo_exclusao.py
```

**Saída esperada:**
```
======================================================================
MIGRAÇÃO: Adicionar colunas de motivo e data de exclusão
======================================================================

📊 Colunas existentes na tabela: [...]

➕ Adicionando coluna 'motivo_exclusao'...
   ✅ Coluna 'motivo_exclusao' adicionada!

➕ Adicionando coluna 'data_exclusao'...
   ✅ Coluna 'data_exclusao' adicionada!

✅ Verificação final:
   Coluna 'motivo_exclusao': ✅ PRESENTE
   Coluna 'data_exclusao': ✅ PRESENTE

======================================================================
✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!
======================================================================
```

### Passo 2: Testar Localmente

1. **Inicie o servidor local:**
   ```bash
   python app.py
   ```

2. **Acesse o sistema:**
   ```
   http://localhost:5000
   ```

3. **Crie uma O.S. de teste**

4. **Tente deletar a O.S.:**
   - Clique no botão de delete
   - Confirme as 2 vezes
   - **Nova funcionalidade:** Uma caixa vai aparecer pedindo o MOTIVO
   - Digite algo como: "Cancelamento por solicitação do cliente"
   - A O.S. será deletada

5. **Verifique na Auditoria:**
   - Acesse "Auditoria" no menu
   - Procure pela ação de DELETE da O.S.
   - Você verá o motivo registrado na descrição

---

## 📝 Exemplos de Motivos

- "Cancelamento por solicitação do cliente"
- "Evento cancelado pela detentora"
- "Data do evento não confirmada"
- "Erro ao criar - dados inconsistentes"
- "Solicitação do administrativo"
- "Duplicação acidental"

---

## 🔒 Segurança

- ✅ **Apenas administradores** podem deletar O.S.
- ✅ **Motivo é obrigatório** - não pode deixar em branco
- ✅ **Dupla confirmação** antes de pedir o motivo
- ✅ **Auditoria completa** - quem, quando e por quê
- ✅ **Horário correto** - registrado em São Paulo (UTC-3)
- ✅ **Dados preservados** - motivo e data guardados no banco

---

## 📊 Consultando Deletadas no Banco

```sql
-- Ver todas as O.S. deletadas
SELECT 
    numero_os,
    evento,
    motivo_exclusao,
    data_exclusao
FROM ordens_servico_deletadas
WHERE motivo_exclusao IS NOT NULL
ORDER BY data_exclusao DESC;
```

---

## 🚀 Deploy em Produção (após testes)

**Quando estiver confiante após testar localmente:**

1. Fazer commit no GitHub (quando estiver pronto)
2. No VPS, fazer `git pull`
3. Rodar a migração no VPS:
   ```bash
   cd /var/www/controle-itens-eventos/backend
   python scripts/migracao/add_motivo_exclusao.py
   ```
4. Reiniciar o serviço:
   ```bash
   sudo systemctl restart controle-itens
   ```

---

## ✅ Checklist de Testes

- [ ] Script de migração roda sem erros
- [ ] Colunas adicionadas ao banco
- [ ] Admin consegue deletar O.S.
- [ ] Motivo é obrigatório (não deixa deixar em branco)
- [ ] Motivo é registrado no banco
- [ ] Data/hora é registrada corretamente
- [ ] Auditoria mostra o motivo
- [ ] Estoque é revertido normalmente
- [ ] Horário está em São Paulo (UTC-3)

---

## 📞 Suporte

Se tiver dúvidas durante os testes, me avise!
