# Deploy em Produção — Guia Completo

## Visão Geral

O sistema usa **SQLite local** na VPS. O `db.create_all()` roda automaticamente
ao iniciar a aplicação e **cria tabelas novas** que não existem — mas **não altera
colunas existentes**. Por isso, este guia cobre os dois casos:

- **Tabelas novas**: criadas automaticamente pelo `create_all()`
- **Colunas novas em tabelas existentes**: precisam de `ALTER TABLE` manual

---

## 1. Variáveis de Ambiente (.env na VPS)

Crie ou atualize o arquivo `backend/.env` na VPS com as seguintes variáveis:

```env
# ─── OBRIGATÓRIAS ──────────────────────────────────────────────
FLASK_ENV=production
SECRET_KEY=<gere com: python -c "import secrets; print(secrets.token_hex(32))">

# ─── PORTAL DA DETENTORA ───────────────────────────────────────
PORTAL_DETENTORA_ATIVO=true

# ─── CORS (origem do seu domínio/IP de produção) ───────────────
CORS_ORIGIN=https://seu-dominio.com
# Se acessar por IP: CORS_ORIGIN=http://SEU_IP:5100
```

> **Importante**: `SECRET_KEY` deve ser uma string aleatória de 64 chars.
> Nunca reutilize a chave do desenvolvimento. Se mudar a chave em produção,
> todas as sessões ativas serão invalidadas (usuários precisarão logar novamente).

---

## 2. Novas Tabelas (criadas automaticamente)

O `create_all()` já cria automaticamente ao subir o app:

| Tabela | Quando foi adicionada |
|--------|-----------------------|
| `aceites_empresa` | Portal Detentora |
| `revisoes_empresa` | Portal Detentora |
| `comentarios_empresa` | Portal Detentora |
| `assinaturas_internas` | Sprint 2 — Assinatura de operadores |

**Nenhuma ação necessária** — o `create_all()` ao iniciar a app cria essas
tabelas se ainda não existirem.

---

## 3. Colunas Novas em Tabelas Existentes

Estas colunas foram adicionadas em tabelas já existentes no banco de produção.
O `create_all()` **não as cria** se a tabela já existe — é preciso rodar manualmente.

### Verificar quais colunas já existem (rode na VPS antes de migrar):

```bash
cd backend
python3 - <<'EOF'
import sqlite3, os
db_path = os.path.join('instance', 'controle_itens.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()
for tabela in ['ordens_servico', 'usuarios']:
    cur.execute(f"PRAGMA table_info({tabela})")
    colunas = [row[1] for row in cur.fetchall()]
    print(f"\n{tabela}: {colunas}")
conn.close()
EOF
```

### Colunas a verificar e adicionar se necessário:

| Tabela | Coluna | Tipo | Adicionada em |
|--------|--------|------|---------------|
| `ordens_servico` | `status` | `VARCHAR(30) DEFAULT 'emitida'` | Portal |
| `ordens_servico` | `detentora_id` | `INTEGER` (FK) | Portal |
| `ordens_servico` | `horario` | `VARCHAR(50)` | Sprint 2 |
| `ordens_servico` | `local` | `TEXT` | Sprint 2 |
| `ordens_servico` | `responsavel` | `VARCHAR(200)` | Sprint 2 |
| `ordens_servico` | `justificativa` | `TEXT` | Sprint 2 |
| `ordens_servico` | `observacoes` | `TEXT` | Sprint 2 |
| `ordens_servico` | `motivo_exclusao` | `TEXT` | Sprint 2 |
| `ordens_servico` | `data_exclusao` | `DATETIME` | Sprint 2 |
| `ordens_servico` | `signatarios_json` | `TEXT` | Sprint 2 |
| `ordens_servico` | `fiscal_tipo` | `VARCHAR(50)` | Sprint 2 |
| `usuarios` | `detentora_id` | `INTEGER` (FK) | Portal |
| `usuarios` | `ultimo_acesso` | `DATETIME` | Auth |

---

## 4. Script de Migração (rode uma vez na VPS)

Salve como `backend/migrate_producao.py` e execute **uma única vez** antes de subir:

```python
"""
migrate_producao.py — Migração segura para produção.
Adiciona apenas colunas que ainda não existem. Idempotente (pode rodar várias vezes).
"""
import sqlite3
import os
import shutil
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'controle_itens.db')

def coluna_existe(cur, tabela, coluna):
    cur.execute(f"PRAGMA table_info({tabela})")
    return any(row[1] == coluna for row in cur.fetchall())

def add_column(cur, tabela, coluna, definicao):
    if not coluna_existe(cur, tabela, coluna):
        cur.execute(f"ALTER TABLE {tabela} ADD COLUMN {coluna} {definicao}")
        print(f"  ✅ Adicionada: {tabela}.{coluna}")
    else:
        print(f"  ⏭  Já existe:  {tabela}.{coluna}")

def main():
    if not os.path.exists(DB_PATH):
        print(f"❌ Banco não encontrado em: {DB_PATH}")
        return

    # ── Backup automático antes de qualquer alteração ──────────────────────
    backup = DB_PATH + f'.bak_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    shutil.copy2(DB_PATH, backup)
    print(f"📦 Backup criado: {backup}\n")

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    try:
        print("── ordens_servico ──────────────────────────")
        add_column(cur, 'ordens_servico', 'status',          "VARCHAR(30) NOT NULL DEFAULT 'emitida'")
        add_column(cur, 'ordens_servico', 'detentora_id',    "INTEGER REFERENCES detentoras(id)")
        add_column(cur, 'ordens_servico', 'horario',         "VARCHAR(50)")
        add_column(cur, 'ordens_servico', 'local',           "TEXT")
        add_column(cur, 'ordens_servico', 'responsavel',     "VARCHAR(200)")
        add_column(cur, 'ordens_servico', 'justificativa',   "TEXT")
        add_column(cur, 'ordens_servico', 'observacoes',     "TEXT")
        add_column(cur, 'ordens_servico', 'motivo_exclusao', "TEXT")
        add_column(cur, 'ordens_servico', 'data_exclusao',   "DATETIME")
        add_column(cur, 'ordens_servico', 'signatarios_json',"TEXT")
        add_column(cur, 'ordens_servico', 'fiscal_tipo',     "VARCHAR(50) DEFAULT 'Fiscal do Contrato'")

        print("\n── usuarios ────────────────────────────────")
        add_column(cur, 'usuarios', 'detentora_id',  "INTEGER REFERENCES detentoras(id)")
        add_column(cur, 'usuarios', 'ultimo_acesso', "DATETIME")

        conn.commit()
        print("\n✅ Migração concluída com sucesso!")
        print(f"   Backup disponível em: {backup}")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ Erro durante a migração: {e}")
        print(f"   Banco não foi alterado. Restaure o backup se necessário: {backup}")
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    main()
```

---

## 5. Passo a Passo de Deploy

### Na sua máquina local:

```bash
# 1. Garantir que está na branch main e tudo commitado
git status
git push origin main
```

### Na VPS:

```bash
# 2. Entrar na pasta do projeto
cd /caminho/para/controle-itens-eventos

# 3. Parar o servidor (ajuste conforme seu processo manager)
sudo systemctl stop controle-itens   # se usar systemd
# ou: pm2 stop controle-itens        # se usar pm2
# ou: pkill -f "python.*app.py"      # força bruta

# 4. Fazer backup manual do banco (segurança extra)
cp backend/instance/controle_itens.db backend/instance/controle_itens.db.manual_bak

# 5. Atualizar o código
git pull origin main

# 6. Atualizar dependências (Flask-Limiter foi adicionado)
cd backend
pip install -r requirements.txt

# 7. Rodar a migração (adiciona colunas novas, não destrói dados)
python migrate_producao.py

# 8. Criar pasta de assinaturas se não existir
mkdir -p static/assinaturas

# 9. Verificar o .env (variáveis listadas na seção 1)
cat .env

# 10. Subir o servidor
sudo systemctl start controle-itens
# ou: pm2 start controle-itens

# 11. Verificar logs
sudo journalctl -u controle-itens -f --since "1 min ago"
# ou: pm2 logs controle-itens
```

---

## 6. Verificação Pós-Deploy

```bash
# Checar se o app subiu sem erros
python3 -c "from app import create_app; app = create_app(); print('OK')"

# Checar se as novas tabelas foram criadas
python3 - <<'EOF'
import sqlite3, os
db = sqlite3.connect('instance/controle_itens.db')
cur = db.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
print([r[0] for r in cur.fetchall()])
db.close()
EOF
```

Você deve ver na lista: `aceites_empresa`, `assinaturas_internas`,
`comentarios_empresa`, `revisoes_empresa`.

---

## 7. Rollback de Emergência

Se algo der errado, restaure o backup criado pelo script:

```bash
# Parar o servidor
sudo systemctl stop controle-itens

# Restaurar o backup (substitua o timestamp pelo correto)
cp backend/instance/controle_itens.db.bak_20260420_120000 \
   backend/instance/controle_itens.db

# Reverter o código para o commit anterior
git checkout HEAD~1

# Subir o servidor na versão anterior
sudo systemctl start controle-itens
```

---

## 8. Notas Importantes

- **SQLite em produção**: funciona bem para uso interno/moderado.
  Para escala maior, considere migrar para PostgreSQL.

- **Rate Limiter**: está configurado com `storage_uri='memory://'` —
  os contadores resetam ao reiniciar o servidor. Aceitável para uso interno.
  Para persistência dos limites, configure Redis:
  ```python
  # extensions.py
  storage_uri='redis://localhost:6379'
  ```

- **Assinaturas PNG**: ficam em `backend/static/assinaturas/`.
  **Inclua essa pasta no seu backup regular** — não está no git (`.gitignore`).

- **SECRET_KEY**: nunca commite no git. Sempre via `.env` na VPS.
