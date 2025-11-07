# 🔒 PROTEÇÃO DO BANCO DE DADOS EM PRODUÇÃO

**Situação**: Aplicação já está em produção na VPS  
**Risco**: Git pull pode sobrescrever banco de dados  
**Solução**: Múltiplas camadas de proteção

---

## ⚠️ O PROBLEMA

Quando você faz `git pull` no servidor, o Git pode:
- ❌ Sobrescrever `instance/controle_itens.db` (DADOS PERDIDOS!)
- ❌ Apagar arquivos de backup
- ❌ Resetar configurações locais

---

## ✅ SOLUÇÃO COMPLETA (4 Camadas)

### Camada 1: .gitignore (URGENTE!)
### Camada 2: Separação de Ambientes
### Camada 3: Backup Automático
### Camada 4: Checklist de Deployment

---

## 🛡️ CAMADA 1: .gitignore (FAÇA AGORA!)

### Passo 1: Criar/Atualizar .gitignore

No seu PC, edite `.gitignore` na raiz do projeto:

```bash
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/

# Flask
instance/
*.db
*.sqlite
*.sqlite3

# Backups (IMPORTANTE!)
instance/backups/
*.db.backup
*.db.old
backup_*.db

# Logs
*.log
logs/

# Environment
.env
.env.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Uploads (se houver)
uploads/
static/uploads/

# Secrets
secrets.py
config_local.py
```

### Passo 2: Remover banco do Git (SE JÁ ESTIVER COMMITADO)

```powershell
# No seu PC:
cd c:\Users\bruno.vargas\Desktop\PROJETOS\controle-itens-eventos

# Remover do Git (mas manter arquivo local)
git rm --cached backend/instance/controle_itens.db
git rm --cached -r backend/instance/

# Commitar
git add .gitignore
git commit -m "chore: protect database from git overwrites

- Add instance/ to .gitignore
- Remove database from version control
- Prevent accidental data loss on git pull"

# Push
git push origin main
```

### Passo 3: No Servidor (IMPORTANTE!)

```bash
# 1. ANTES de fazer git pull, faça backup
cd /seu/projeto/backend
cp -r instance/ instance_backup_$(date +%Y%m%d_%H%M%S)

# 2. Agora pode fazer git pull com segurança
cd ..
git pull origin main

# 3. Se instance/ foi apagado, restaure
if [ ! -d "backend/instance" ]; then
    cp -r backend/instance_backup_* backend/instance/
fi
```

---

## 🗂️ CAMADA 2: SEPARAÇÃO DE AMBIENTES

### Estrutura Recomendada

```
backend/
├── instance/                    ← NUNCA no Git
│   ├── controle_itens.db       ← Banco de produção
│   └── backups/                ← Backups automáticos
│
├── instance_dev/                ← Para desenvolvimento (pode estar no Git)
│   └── controle_itens_dev.db   ← Banco de teste
│
├── config.py                    ← Configuração
└── app.py
```

### Arquivo de Configuração (config.py)

Crie `backend/config.py`:

```python
import os
from pathlib import Path

# Detecta ambiente
ENV = os.getenv('FLASK_ENV', 'development')
IS_PRODUCTION = ENV == 'production'

# Base directory
BASE_DIR = Path(__file__).parent

# Database
if IS_PRODUCTION:
    # Produção: usa instance/ (fora do Git)
    INSTANCE_PATH = BASE_DIR / 'instance'
    DATABASE_PATH = INSTANCE_PATH / 'controle_itens.db'
else:
    # Desenvolvimento: usa instance_dev/ (pode estar no Git)
    INSTANCE_PATH = BASE_DIR / 'instance_dev'
    DATABASE_PATH = INSTANCE_PATH / 'controle_itens_dev.db'

# Criar diretório se não existir
INSTANCE_PATH.mkdir(exist_ok=True)

# Database URI
SQLALCHEMY_DATABASE_URI = f'sqlite:///{DATABASE_PATH}'
SQLALCHEMY_TRACK_MODIFICATIONS = False

# Backup
BACKUP_DIR = INSTANCE_PATH / 'backups'
BACKUP_DIR.mkdir(exist_ok=True)

print(f"[CONFIG] Ambiente: {ENV}")
print(f"[CONFIG] Banco: {DATABASE_PATH}")
print(f"[CONFIG] Backups: {BACKUP_DIR}")
```

### Atualizar app.py

```python
from config import SQLALCHEMY_DATABASE_URI, IS_PRODUCTION

app = Flask(__name__)

# Configuração do banco
app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

if IS_PRODUCTION:
    print("⚠️  MODO PRODUÇÃO - Usando banco real")
else:
    print("🔧 MODO DESENVOLVIMENTO - Usando banco de teste")
```

### Variável de Ambiente no Servidor

```bash
# Na VPS, adicione ao systemd service ou .bashrc:
export FLASK_ENV=production

# Ou no arquivo .env na VPS:
echo "FLASK_ENV=production" > /seu/projeto/.env
```

---

## 💾 CAMADA 3: BACKUP AUTOMÁTICO

### Script de Backup Diário

Crie `backend/scripts/utilitarios/backup_automatico.py`:

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Backup Automático do Banco de Dados
====================================

Cria backup diário do banco de dados com rotação de 30 dias.

USO:
    python backup_automatico.py
    
CRON (diário às 2h):
    0 2 * * * cd /seu/projeto/backend && python scripts/utilitarios/backup_automatico.py
"""

import os
import sys
import shutil
from datetime import datetime, timedelta
from pathlib import Path

# Configuração
BACKEND_DIR = Path(__file__).parent.parent.parent
DB_PATH = BACKEND_DIR / 'instance' / 'controle_itens.db'
BACKUP_DIR = BACKEND_DIR / 'instance' / 'backups'
RETENTION_DAYS = 30  # Manter últimos 30 dias

def criar_backup():
    """Cria backup do banco"""
    if not DB_PATH.exists():
        print(f"❌ Banco não encontrado: {DB_PATH}")
        return False
    
    # Criar diretório de backups
    BACKUP_DIR.mkdir(exist_ok=True)
    
    # Nome do backup
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = BACKUP_DIR / f"controle_itens_{timestamp}.db"
    
    try:
        # Copiar banco
        shutil.copy2(DB_PATH, backup_file)
        
        # Tamanho
        size_mb = backup_file.stat().st_size / (1024 * 1024)
        
        print(f"✅ Backup criado: {backup_file.name}")
        print(f"   Tamanho: {size_mb:.2f} MB")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar backup: {e}")
        return False

def limpar_backups_antigos():
    """Remove backups mais antigos que RETENTION_DAYS"""
    if not BACKUP_DIR.exists():
        return
    
    cutoff_date = datetime.now() - timedelta(days=RETENTION_DAYS)
    removidos = 0
    
    for backup_file in BACKUP_DIR.glob("controle_itens_*.db"):
        # Extrair data do nome do arquivo
        try:
            date_str = backup_file.stem.split('_')[2]  # controle_itens_YYYYMMDD
            file_date = datetime.strptime(date_str, "%Y%m%d")
            
            if file_date < cutoff_date:
                backup_file.unlink()
                removidos += 1
                print(f"🗑️  Removido backup antigo: {backup_file.name}")
                
        except (ValueError, IndexError):
            # Nome de arquivo não segue padrão, ignorar
            pass
    
    if removidos > 0:
        print(f"✅ {removidos} backup(s) antigo(s) removido(s)")
    else:
        print(f"✅ Nenhum backup antigo para remover")

def main():
    print("="*60)
    print("BACKUP AUTOMÁTICO DO BANCO DE DADOS")
    print("="*60)
    
    # Criar backup
    if criar_backup():
        # Limpar backups antigos
        limpar_backups_antigos()
        
        # Contar backups
        total = len(list(BACKUP_DIR.glob("controle_itens_*.db")))
        print(f"\n📊 Total de backups: {total}")
        
        return 0
    else:
        return 1

if __name__ == '__main__':
    sys.exit(main())
```

### Configurar Cron (Linux/VPS)

```bash
# Abrir crontab
crontab -e

# Adicionar linha (backup diário às 2h da manhã)
0 2 * * * cd /seu/projeto/backend && /seu/projeto/venv/bin/python scripts/utilitarios/backup_automatico.py >> /var/log/backup_db.log 2>&1

# Salvar e sair
```

### Configurar Task Scheduler (Windows - Seu PC)

```powershell
# Criar task para backup diário
$action = New-ScheduledTaskAction -Execute "python" -Argument "backend\scripts\utilitarios\backup_automatico.py" -WorkingDirectory "c:\Users\bruno.vargas\Desktop\PROJETOS\controle-itens-eventos"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "Backup DB Controle Itens" -Description "Backup diário do banco de dados"
```

---

## 📋 CAMADA 4: CHECKLIST DE DEPLOYMENT

### Antes de Fazer git pull (SEMPRE!)

```bash
#!/bin/bash
# safe_deploy.sh - Script seguro de deployment

echo "🔒 DEPLOYMENT SEGURO - Checklist"
echo "================================"

# 1. Backup do banco
echo "1/5 Criando backup..."
cd /seu/projeto/backend
python scripts/utilitarios/backup_automatico.py

# 2. Verificar Git
echo "2/5 Verificando mudanças..."
cd /seu/projeto
git fetch origin main

# 3. Mostrar diferenças
echo "3/5 Diferenças:"
git diff main origin/main --stat

# 4. Confirmar
echo ""
read -p "Continuar com git pull? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Deployment cancelado"
    exit 1
fi

# 5. Git pull (banco protegido por .gitignore)
echo "4/5 Atualizando código..."
git pull origin main

# 6. Verificar banco ainda existe
echo "5/5 Verificando banco..."
if [ -f "backend/instance/controle_itens.db" ]; then
    echo "✅ Banco de dados OK"
else
    echo "❌ ERRO: Banco sumiu! Restaurando backup..."
    # Restaurar último backup
    LATEST_BACKUP=$(ls -t backend/instance/backups/*.db | head -1)
    cp "$LATEST_BACKUP" backend/instance/controle_itens.db
    echo "✅ Banco restaurado de: $LATEST_BACKUP"
fi

echo ""
echo "✅ Deployment concluído com sucurança!"
echo "Reinicie o servidor agora: sudo systemctl restart controle-itens"
```

Tornar executável:
```bash
chmod +x safe_deploy.sh
```

Usar sempre:
```bash
./safe_deploy.sh
```

---

## 🚨 PROCEDIMENTO DE EMERGÊNCIA

### Se o Banco Foi Sobrescrito (Recuperar)

```bash
# 1. PARE O SERVIDOR IMEDIATAMENTE
sudo systemctl stop controle-itens

# 2. Veja os backups disponíveis
ls -lh backend/instance/backups/

# 3. Restaure o backup mais recente
LATEST_BACKUP=$(ls -t backend/instance/backups/*.db | head -1)
cp "$LATEST_BACKUP" backend/instance/controle_itens.db

# 4. Verifique integridade
sqlite3 backend/instance/controle_itens.db "PRAGMA integrity_check;"

# 5. Reinicie servidor
sudo systemctl start controle-itens

# 6. Teste
curl -s http://localhost:5100 | head -5
```

---

## 📝 RESUMO DAS PROTEÇÕES

### ✅ O Que Fazer AGORA (Urgente!)

```bash
# 1. No seu PC - Atualizar .gitignore
git add .gitignore
git commit -m "chore: protect database from overwrites"
git push origin main

# 2. Na VPS - Backup antes de git pull
cd /seu/projeto/backend
python scripts/utilitarios/backup_automatico.py
cd ..
git pull origin main

# 3. Na VPS - Configurar backup automático
crontab -e
# Adicionar: 0 2 * * * cd /seu/projeto/backend && python scripts/utilitarios/backup_automatico.py
```

### ✅ Rotina de Deployment (Sempre)

```bash
# Nunca mais faça apenas "git pull"
# Use sempre o script seguro:
./safe_deploy.sh
```

### ✅ Proteções Ativas

| Camada | Proteção | Status |
|--------|----------|--------|
| 1 | .gitignore | ⏳ Pendente (fazer agora!) |
| 2 | Separação de ambientes | ⏳ Opcional |
| 3 | Backup automático | ⏳ Configurar cron |
| 4 | Script seguro | ⏳ Criar safe_deploy.sh |

---

## 🎯 PRÓXIMOS PASSOS

### AGORA (Urgente!)
1. ✅ Atualizar .gitignore
2. ✅ Remover banco do Git
3. ✅ Push para GitHub
4. ✅ Fazer backup na VPS
5. ✅ Git pull na VPS

### HOJE
1. ⏳ Criar backup_automatico.py
2. ⏳ Configurar cron
3. ⏳ Criar safe_deploy.sh
4. ⏳ Testar procedimento

### OPCIONAL
1. ⏳ Separar ambientes (dev/prod)
2. ⏳ Configurar config.py
3. ⏳ Documentar procedimentos

---

## 📞 PERGUNTAS FREQUENTES

**P: E se eu já commitei o banco no Git?**  
R: Use `git rm --cached` para remover (sem deletar arquivo local)

**P: Preciso fazer backup manual antes de cada git pull?**  
R: Sim, até configurar o cron. Depois, será automático.

**P: O .gitignore protege 100%?**  
R: Sim, se instance/ estiver no .gitignore, git pull nunca tocará.

**P: E se eu esquecer de fazer backup?**  
R: Por isso o backup automático diário é crucial!

**P: Posso usar o mesmo banco em dev e prod?**  
R: NÃO! Sempre use bancos separados.

---

## ✅ VERIFICAÇÃO FINAL

Execute na VPS para verificar proteções:

```bash
# 1. Verificar .gitignore
cat .gitignore | grep instance

# 2. Verificar se banco está fora do Git
git ls-files | grep controle_itens.db
# Não deve retornar nada!

# 3. Verificar backups
ls -lh backend/instance/backups/

# 4. Verificar cron
crontab -l | grep backup
```

---

**Status**: 🚨 **AÇÃO IMEDIATA NECESSÁRIA**  
**Próximo**: Atualizar .gitignore e fazer backup antes do próximo git pull!
