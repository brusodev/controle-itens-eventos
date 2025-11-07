# 🚀 DEPLOYMENT - PASSO A PASSO RÁPIDO

**Objetivo**: Enviar código com sistema de auditoria para servidor com banco existente  
**Tempo**: ~15 minutos (total)  
**Risco**: Muito baixo (backup automático, rollback disponível)

---

## ✅ CHECKLIST PRÉ-DEPLOYMENT

Verifique antes de começar:

```
☐ Servidor tem banco de dados (sem tabela auditoria)
☐ Você tem acesso SSH
☐ Servidor pode ficar 3-5 minutos indisponível
☐ Python 3.8+ instalado no servidor
☐ Você leu docs/DEPLOYMENT.md
```

---

## 🎯 5 PASSOS SIMPLES

### PASSO 1: Git Commit (Seu PC - 2 min)

```powershell
# Abra PowerShell e vá para pasta do projeto
cd c:\Users\bruno.vargas\Desktop\PROJETOS\controle-itens-eventos

# Veja o que mudou
git status

# Adicione tudo
git add .

# Committe com mensagem
git commit -m "feat: add complete audit system with production migration

- Add Auditoria model with complete tracking
- Add auditoria REST API with filtering and statistics
- Add web interface for audit viewing
- Add migration script with automatic rollback
- Reorganize 51 scripts into 6 logical categories
- Add comprehensive documentation (DEPLOYMENT.md, AUDITORIA.md)"

# Envie para repositório
git push origin main
```

**Esperado**: Mensagens de sucesso do git

---

### PASSO 2: Atualizar Código no Servidor (2 min)

```bash
# Entre no servidor via SSH
ssh seu_usuario@seu_servidor.com

# Vá para pasta do projeto
cd /caminho/para/controle-itens-eventos

# Atualize o código
git pull origin main

# Verifique se atualizou
git log -1 --oneline
```

**Esperado**: Última commit mostra "feat: add complete audit system..."

---

### PASSO 3: Parar o Servidor (1 min)

```bash
# Se usar systemd (mais comum em produção)
sudo systemctl stop controle-itens

# Se rodando em terminal
# Pressione Ctrl+C no terminal onde o servidor está

# Verifique se parou
ps aux | grep app.py
# Não deve aparecer nada
```

**Esperado**: Processo parado com sucesso

---

### PASSO 4: Executar Migração (3 min)

#### 4A: Teste Primeiro (Seguro!)

```bash
# Entre na pasta backend
cd backend

# Ative ambiente Python
source venv/bin/activate  # Linux/Mac
# OU
call venv\Scripts\activate.bat  # Windows cmd
# OU
. venv\Scripts\Activate.ps1  # PowerShell

# Teste a migração
python scripts/migracao/migrar_adicionar_auditoria.py --check

# Deve retornar:
# ✓ Banco OK, sem tabela de auditoria
# ✓ Verificação concluída. Banco está pronto para migração!
```

#### 4B: Criar Backup (Segurança)

```bash
# Crie backup manual (dupla segurança)
cp instance/controle_itens.db instance/controle_itens_backup_$(date +%Y%m%d_%H%M%S).db

# Verifique
ls -lah instance/*.db
```

#### 4C: Executar Migração de Verdade

```bash
# Execute a migração
python scripts/migracao/migrar_adicionar_auditoria.py

# Deve retornar:
# ✓ Backup criado
# ✓ Tabela 'auditoria' criada
# ✓ Índices criados
# ✓ MIGRAÇÃO CONCLUÍDA COM SUCESSO!
```

**Esperado**: Todas as mensagens com ✓

---

### PASSO 5: Reiniciar Servidor (2 min)

```bash
# Se usar systemd
sudo systemctl start controle-itens

# Se rodando em terminal
python app.py

# Aguarde mensagem: "Running on http://..."
```

**Esperado**: Servidor iniciado e respondendo

---

## ✨ VERIFICAR SE FUNCIONOU

```bash
# Teste 1: Servidor está respondendo?
curl -s http://localhost:5100 | head -5

# Teste 2: API de auditoria existe?
curl -s http://localhost:5100/api/auditoria/stats \
  -H "Authorization: Bearer SEU_TOKEN"

# Teste 3: Check no navegador
# Acesse: http://seu_servidor.com:5100
# Login como admin
# Menu > Auditoria (nova opção)
```

---

## 🆘 SE ALGO DER ERRADO

### Erro 1: "Tabela 'auditoria' já existe"

```bash
# Significa que foi migrado antes
# Apenas inicie o servidor
python app.py
```

### Erro 2: Servidor não inicia

```bash
# 1. Verifique logs
tail -100 logs/app.log

# 2. Restaure do backup
cp instance/controle_itens_backup_*.db instance/controle_itens.db

# 3. Tente iniciar novamente
python app.py
```

### Erro 3: "FOREIGN KEY constraint failed"

```bash
# Isso significa que há usuários deletados
# Restaure com rollback

python scripts/migracao/migrar_adicionar_auditoria.py \
  --rollback instance/backups/controle_itens_backup_*.db
```

### Erro 4: Auditoria não está gravando

```bash
# Reinicie o servidor
sudo systemctl restart controle-itens

# OU

# Ctrl+C e execute novamente
python app.py
```

---

## 🎓 TESTE A AUDITORIA

Após deployment bem-sucedido:

1. **Login como admin**
   - Usuário: seu_admin
   - Senha: sua_senha

2. **Crie um novo item**
   - Menu > Itens > Novo
   - Preencha dados
   - Clique Salvar

3. **Edite o item**
   - Clique em Editar
   - Mude um campo
   - Clique Salvar

4. **Visualize na auditoria**
   - Menu > Auditoria (nova opção!)
   - Você deve ver 2 entradas:
     - CREATE (item criado)
     - UPDATE (item modificado)

5. **Veja antes/depois**
   - Clique no icon "Before/After"
   - Deve aparecer JSON com mudanças

**Esperado**: Tudo funciona, auditoria registra mudanças ✓

---

## 📊 RESUMO RÁPIDO

| Passo | Ação | Local | Tempo |
|-------|------|-------|-------|
| 1 | Git commit | Seu PC | 2 min |
| 2 | Git pull | Servidor | 2 min |
| 3 | Stop servidor | Servidor | 1 min |
| 4 | Migração | Servidor | 3 min |
| 5 | Start servidor | Servidor | 2 min |
| **TOTAL** | | | **~10 min** |

---

## 🔄 SE PRECISAR DESFAZER

```bash
# Se perceber problema depois
python backend/scripts/migracao/migrar_adicionar_auditoria.py \
  --rollback instance/backups/controle_itens_backup_*.db

# Escolha o backup mais recente
```

---

## 📞 PERGUNTAS RÁPIDAS

**P: Dados antigas serão perdidos?**  
R: NÃO! Tudo mantém-se intacto. Só adiciona tabela nova.

**P: Posso fazer durante o horário comercial?**  
R: NÃO recomendado. Faça madrugada ou fim de semana.

**P: Quanto tempo leva mesmo?**  
R: 3 minutos a 2 horas (máximo) dependendo tamanho banco.

**P: Se der erro, consigo recuperar?**  
R: SIM! Backup automático + opção de rollback.

**P: Quem pode ver auditoria?**  
R: Apenas admins. Usuários normais não veem.

**P: Preciso instalar algo novo?**  
R: NÃO! Python, Flask, banco já existem.

---

## ✅ CHECKLIST FINAL

### Antes
```
☐ Leu este documento todo
☐ Fez git commit
☐ Fez git push
☐ Tem acesso SSH
```

### Depois
```
☐ Parou servidor
☐ Testou migração --check
☐ Executou migração
☐ Iniciou servidor
☐ Testou criar item
☐ Testou visualizar auditoria
☐ Compartilhou com equipe
```

---

## 🎉 PRONTO!

Você está **100% preparado** para fazer deployment!

**Comece agora:**
```
1. PASSO 1: git add . && git commit
2. PASSO 2: git pull no servidor
3. PASSO 3: systemctl stop
4. PASSO 4: python migrate
5. PASSO 5: systemctl start
```

**Qualquer dúvida, consulte:**
- `docs/DEPLOYMENT.md` - Instruções completas
- `docs/AUDITORIA.md` - Como usar auditoria
- `backend/scripts/migracao/migrar_adicionar_auditoria.py` - Help

**Boa sorte! 🚀**

