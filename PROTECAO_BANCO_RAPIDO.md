# 🔒 PROTEÇÃO DO BANCO - AÇÃO IMEDIATA

**Situação**: Aplicação em produção na VPS  
**Risco**: Git pull pode sobrescrever banco de dados  
**Solução**: 4 passos URGENTES!

---

## ⚡ FAÇA AGORA (5 minutos)

### PASSO 1: Remover Banco do Git (Seu PC)

```powershell
# 1. Vá para pasta do projeto
cd c:\Users\bruno.vargas\Desktop\PROJETOS\controle-itens-eventos

# 2. Remover banco do controle do Git (sem deletar arquivo local)
git rm --cached -r backend/instance/

# 3. Commitar
git add .gitignore
git commit -m "chore: protect database from git overwrites

- Add instance/ to .gitignore
- Remove database from version control
- Add backup_automatico.py script
- Add safe_deploy.sh script
- Prevent accidental data loss on git pull"

# 4. Push
git push origin main
```

---

### PASSO 2: Backup ANTES de Git Pull (Na VPS)

```bash
# SSH para VPS
ssh seu_usuario@seu_servidor

# Ir para projeto
cd /seu/projeto

# CRIAR BACKUP AGORA!
cd backend
mkdir -p instance/backups
cp instance/controle_itens.db instance/backups/controle_itens_backup_$(date +%Y%m%d_%H%M%S).db

# Verificar backup foi criado
ls -lh instance/backups/
```

---

### PASSO 3: Git Pull Seguro (Na VPS)

```bash
# Voltar para raiz
cd /seu/projeto

# Git pull (banco está protegido por .gitignore)
git pull origin main

# VERIFICAR se banco ainda existe
if [ -f "backend/instance/controle_itens.db" ]; then
    echo "✅ Banco OK!"
else
    echo "❌ ERRO: Banco sumiu! Restaure do backup!"
fi
```

---

### PASSO 4: Usar Script Seguro (Próximas vezes)

```bash
# Tornar executável (primeira vez)
chmod +x safe_deploy.sh

# Usar sempre que for fazer deployment
./safe_deploy.sh
```

---

## 📋 CHECKLIST RÁPIDO

### No Seu PC
- [ ] Atualizar .gitignore
- [ ] Remover banco do Git (`git rm --cached`)
- [ ] Commit e push

### Na VPS (ANTES do próximo git pull)
- [ ] Fazer backup manual
- [ ] Verificar backup existe
- [ ] Git pull
- [ ] Verificar banco ainda existe
- [ ] Tornar safe_deploy.sh executável

### Próximas Vezes
- [ ] Sempre usar `./safe_deploy.sh`
- [ ] Nunca fazer `git pull` direto

---

## 🆘 SE O BANCO FOR SOBRESCRITO

```bash
# 1. PARE O SERVIDOR
sudo systemctl stop controle-itens

# 2. Restaure último backup
LATEST=$(ls -t backend/instance/backups/*.db | head -1)
cp "$LATEST" backend/instance/controle_itens.db

# 3. Verifique integridade
sqlite3 backend/instance/controle_itens.db "PRAGMA integrity_check;"

# 4. Reinicie servidor
sudo systemctl start controle-itens
```

---

## ✅ PROTEÇÕES IMPLEMENTADAS

| Arquivo | Proteção |
|---------|----------|
| `.gitignore` | Ignora `instance/` e `*.db` |
| `backup_automatico.py` | Backup diário automático |
| `safe_deploy.sh` | Deployment seguro com verificações |
| `docs/PROTECAO_BANCO_DADOS.md` | Documentação completa |

---

## 📞 COMANDOS ÚTEIS

```bash
# Verificar se banco está no Git (NÃO DEVE APARECER NADA!)
git ls-files | grep controle_itens.db

# Listar backups
ls -lh backend/instance/backups/

# Criar backup manual
cd backend
python scripts/utilitarios/backup_automatico.py

# Deployment seguro
./safe_deploy.sh
```

---

## ⏰ CONFIGURAR BACKUP AUTOMÁTICO (Depois)

### Linux/VPS
```bash
crontab -e

# Adicionar (backup diário às 2h):
0 2 * * * cd /seu/projeto/backend && /seu/projeto/venv/bin/python scripts/utilitarios/backup_automatico.py
```

### Windows (Seu PC)
```powershell
# PowerShell como Admin
$action = New-ScheduledTaskAction -Execute "python" -Argument "backend\scripts\utilitarios\backup_automatico.py" -WorkingDirectory "c:\Users\bruno.vargas\Desktop\PROJETOS\controle-itens-eventos"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "Backup DB Controle Itens"
```

---

## 🎯 RESUMO

**AGORA (Urgente)**:
1. ✅ Atualizar .gitignore
2. ✅ `git rm --cached backend/instance/`
3. ✅ Commit + push
4. ✅ Backup na VPS ANTES de git pull

**PRÓXIMAS VEZES**:
- ✅ Sempre usar `./safe_deploy.sh`
- ✅ Nunca fazer `git pull` direto

**DEPOIS**:
- ⏳ Configurar cron para backup automático

---

**Leia documentação completa**: `docs/PROTECAO_BANCO_DADOS.md`
