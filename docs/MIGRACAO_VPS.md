# 📋 Guia de Migração para VPS

## 🔍 Alterações no Banco de Dados

### Nova Tabela: `categorias`

Foi adicionada uma nova tabela para gerenciar categorias de itens dinamicamente.

**Campos:**
- `id` (INTEGER PRIMARY KEY)
- `nome` (VARCHAR(100), UNIQUE)
- `tipo` (VARCHAR(50))
- `natureza` (VARCHAR(10))
- `criado_em` (DATETIME)
- `atualizado_em` (DATETIME)

**Índices:**
- `idx_categorias_tipo` em `tipo`

---

## 🚀 Como Fazer Deploy na VPS

### Opção 1: Script Automático (Recomendado)

#### No Windows (Local):

```powershell
# 1. Faça o push para GitHub
cd "c:\Users\SEDUC.SEE-902951-N\Desktop\meus projetos\controle-itens-eventos"
git push origin main

# 2. Na VPS, puxe as alterações
ssh usuario@seu-vps.com
cd /home/usuario/controle-itens-eventos
git pull origin main
```

#### Na VPS (Linux):

```bash
# 1. Dar permissão ao script
chmod +x deploy_vps.sh

# 2. Executar o script de deploy
./deploy_vps.sh

# 3. Acompanhar logs
tail -f /tmp/controle_itens.log
```

---

### Opção 2: Script Python (Alternativo)

#### Na VPS:

```bash
# 1. Ativar ambiente virtual
source /home/usuario/controle-itens-eventos/backend/.venv/bin/activate

# 2. Ir para pasta raiz do projeto
cd /home/usuario/controle-itens-eventos

# 3. Executar migrations
python run_migrations.py

# 4. Reiniciar Flask
pkill -f "python app.py"
cd backend
nohup python app.py > /tmp/controle_itens.log 2>&1 &
```

---

### Opção 3: Manual (Se não quiser scripts)

#### Na VPS:

```bash
# 1. Parar aplicação
pkill -f "python app.py"

# 2. Fazer backup
cp backend/controle_itens.db backend/backups/controle_itens_backup_$(date +%Y%m%d_%H%M%S).db

# 3. Ativar venv
source backend/.venv/bin/activate
cd backend

# 4. Instalar dependências
pip install -r requirements.txt

# 5. Executar cada migration
python migrations/migrate_data.py
python migrations/migrate_add_observacoes.py
python migrations/migrate_add_responsavel.py
python migrations/migrate_add_campos_os.py
python migrations/migrate_add_fiscal_tipo.py
python migrations/migrate_add_controle_estoque.py
python migrations/migrate_add_diarias.py
python migrations/migrate_add_qtd_solicitada.py
python migrations/migrate_add_item_bec.py
python migrations/migrate_categorias.py  # ← NOVA

# 6. Inicializar banco (se primeira vez)
python init_db.py

# 7. Reiniciar aplicação
nohup python app.py > /tmp/controle_itens.log 2>&1 &

# 8. Verificar se está rodando
sleep 2
ps aux | grep "python app.py"
```

---

## ✅ Verificações Pós-Migração

### 1. Verificar Banco de Dados

```bash
cd backend
python
```

```python
from app import create_app, db
from models import Categoria

app = create_app()
with app.app_context():
    # Contar categorias
    count = Categoria.query.count()
    print(f"Total de categorias: {count}")
    
    # Listar categorias
    cats = Categoria.query.all()
    for cat in cats:
        print(f"  ID: {cat.id}, Nome: {cat.nome}, Tipo: {cat.tipo}")
```

### 2. Testar API

```bash
# Listar categorias
curl http://localhost:5000/api/categorias

# Criar categoria (requer autenticação)
curl -X POST http://localhost:5000/api/categorias \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","tipo":"teste"}'
```

### 3. Acessar Aplicação

- Abra no navegador: `http://seu-vps.com:5000`
- Faça login
- Verifique a aba "🏷️ Categorias"

---

## 🆘 Solução de Problemas

### Erro: "Tabela já existe"
- **Solução**: Normal! A migration detecta e pula. Sem problemas.

### Erro: "Permission denied"
- **Solução**: Execute com `bash` ou `chmod +x deploy_vps.sh`

### Erro: "python: command not found"
- **Solução**: Use `python3` ou caminho completo do venv

### Erro: "database is locked"
- **Solução**: 
  ```bash
  pkill -f "python app.py"
  sleep 2
  python migrations/migrate_categorias.py
  ```

### Aplicação não inicia
- **Solução**: Verificar logs
  ```bash
  tail -f /tmp/controle_itens.log
  ```

---

## 📝 Checklist de Deploy

- [ ] Git push realizado
- [ ] Conectado na VPS via SSH
- [ ] Git pull executado
- [ ] Backup do banco feito
- [ ] Script de deploy executado OU migrations rodadas manualmente
- [ ] Logs verificados (sem erros)
- [ ] API testada: GET /api/categorias
- [ ] Navegador abre a página (login funciona)
- [ ] Aba "Categorias" está visível

---

## 📞 Dúvidas?

Se algo deu errado:

1. **Verificar logs**: `tail -f /tmp/controle_itens.log`
2. **Fazer rollback**: `cp backups/controle_itens_backup_*.db controle_itens.db`
3. **Reiniciar**: `pkill -f "python app.py" && sleep 2 && cd backend && nohup python app.py > /tmp/controle_itens.log 2>&1 &`

