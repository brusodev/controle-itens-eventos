# 🛡️ Plano de Backup Off-site do Banco de Dados

> **Criado em:** 15/08/2026
> **Objetivo:** Implementar backup automático, seguro e fora da VPS para o banco SQLite de produção.
> **Estimativa:** ~1h30 num sábado. Não precisa parar o sistema.

---

## 📌 Contexto (situação atual)

| Item | Estado hoje |
|---|---|
| Banco | SQLite: `/var/www/controle-itens-eventos/backend/instance/controle_itens.db` (~2,7 MB) |
| Script de backup | Existe (`backend/scripts/utilitarios/backup_automatico.py`) mas **nunca foi agendado** |
| Agendamento (cron) | ❌ Não há para este projeto |
| Backups existentes | Apenas 3 cópias **manuais** de jun/2026, no **mesmo disco** da VPS |
| Off-site | ❌ Inexistente |

**Riscos:** perda total se a VPS/disco falhar; backup por cópia "a quente" pode corromper; nunca foi testada uma restauração.

**Meta deste plano:** backup diário → validado → enviado para a nuvem (grátis) → com rotação → e restauração testada.

---

## 🎯 Decisões a tomar antes de começar

1. **Destino na nuvem (grátis):** recomendo **Backblaze B2** (10 GB grátis, padrão de mercado) ou **Google Drive** (15 GB, você já tem conta Google). Ambos via `rclone`.
2. **Criptografia:** **recomendada** — o `.db` contém usuários e hashes de senha. O `rclone` faz isso nativamente com `crypt`.

> Com 2,7 MB por backup, guardando 1 por dia por 1 ano = ~1 GB. Cabe folgado em qualquer tier grátis.

---

## Etapa 1 — Melhorar o script de backup (evitar corrupção)

O script atual usa `shutil.copy2`, que copia o arquivo enquanto a aplicação escreve — pode gerar backup **corrompido**. Trocar pela **API de backup online do SQLite** (`.backup` / `VACUUM INTO`), que é consistente mesmo com o sistema rodando.

**Ação:** editar `backend/scripts/utilitarios/backup_automatico.py`, na função `criar_backup()`, substituir:

```python
# ANTES
shutil.copy2(DB_PATH, backup_file)
```

por:

```python
# DEPOIS — backup online consistente do SQLite
import sqlite3
src = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
dst = sqlite3.connect(str(backup_file))
with dst:
    src.backup(dst)
dst.close()
src.close()
```

**Teste manual (não quebra nada):**

```bash
cd /var/www/controle-itens-eventos/backend
venv/bin/python scripts/utilitarios/backup_automatico.py
# Verifica integridade do arquivo gerado:
ls -lh instance/backups/
sqlite3 "$(ls -t instance/backups/*.db | head -1)" "PRAGMA integrity_check;"
# esperado: ok
```

---

## Etapa 2 — Instalar e configurar o `rclone`

```bash
# Instalar
sudo -v ; curl https://rclone.org/install.sh | sudo bash
rclone version
```

### Opção A — Backblaze B2 (recomendada)

1. Crie conta grátis em https://www.backblaze.com/ → **B2 Cloud Storage**.
2. Crie um **Bucket** privado, ex.: `controle-itens-backup`.
3. Em **Application Keys**, gere uma chave (guarde `keyID` e `applicationKey`).
4. Configure o remote:

```bash
rclone config
# n) New remote
# name> b2
# Storage> b2   (Backblaze B2)
# account> <keyID>
# key> <applicationKey>
# aceite o restante com Enter
```

### Opção B — Google Drive (alternativa)

```bash
rclone config
# n) New remote
# name> gdrive
# Storage> drive
# client_id/secret> (Enter para usar o padrão)
# scope> 1 (full) ou 3 (drive.file)
# Use auto config? Como é VPS sem navegador: responda "N"
#   -> rode "rclone authorize drive" numa máquina COM navegador
#      e cole o token gerado de volta na VPS
```

**Teste de conexão:**

```bash
rclone lsd b2:            # ou: rclone lsd gdrive:
```

---

## Etapa 3 — Criptografia (recomendado)

Cria um remote `crypt` que criptografa nomes e conteúdo automaticamente antes de subir.

```bash
rclone config
# n) New remote
# name> b2crypt
# Storage> crypt
# remote> b2:controle-itens-backup/db   (aponta para o bucket/pasta destino)
# filename_encryption> standard
# directory_name_encryption> true
# password> (gere e GUARDE numa senha forte — sem ela não há restauração!)
# password2 (salt)> (gere e guarde também)
```

> ⚠️ **Guarde as senhas do `crypt` num gerenciador de senhas.** Sem elas o backup é irrecuperável.
> A config do rclone fica em `~/.config/rclone/rclone.conf` — faça uma cópia segura desse arquivo também.

---

## Etapa 4 — Script de envio para a nuvem

Criar `backend/scripts/utilitarios/backup_offsite.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

PROJ=/var/www/controle-itens-eventos/backend
VENV=$PROJ/venv/bin/python
REMOTE="b2crypt:"          # use "gdrive:controle-itens-backup" se for Drive sem crypt
LOCAL_BACKUPS=$PROJ/instance/backups
RETENCAO_NUVEM=60          # dias mantidos na nuvem

# 1. Gera o backup local (já com integridade)
$VENV $PROJ/scripts/utilitarios/backup_automatico.py

# 2. Envia só o backup mais recente para a nuvem
ULTIMO=$(ls -t "$LOCAL_BACKUPS"/controle_itens_*.db | head -1)
rclone copy "$ULTIMO" "$REMOTE" --progress

# 3. Rotação na nuvem (remove mais antigos que RETENCAO_NUVEM dias)
rclone delete "$REMOTE" --min-age "${RETENCAO_NUVEM}d"

echo "[$(date '+%F %T')] Backup off-site OK: $(basename "$ULTIMO")"
```

```bash
chmod +x /var/www/controle-itens-eventos/backend/scripts/utilitarios/backup_offsite.sh
# Teste completo:
/var/www/controle-itens-eventos/backend/scripts/utilitarios/backup_offsite.sh
rclone ls b2crypt:     # confirmar que o arquivo subiu
```

---

## Etapa 5 — Agendar no cron (diário às 2h)

```bash
crontab -e
```

Adicionar a linha:

```
0 2 * * * /var/www/controle-itens-eventos/backend/scripts/utilitarios/backup_offsite.sh >> /var/log/backup_db.log 2>&1
```

Criar o log com permissão do usuário `ubuntu`:

```bash
sudo touch /var/log/backup_db.log
sudo chown ubuntu:ubuntu /var/log/backup_db.log
```

> O serviço roda como `ubuntu`, então use o **crontab do usuário `ubuntu`** (o comando acima, sem `sudo`).

---

## Etapa 6 — TESTE DE RESTAURAÇÃO (o passo mais importante)

Backup que nunca foi restaurado não é backup. Testar num arquivo separado, **sem tocar no banco de produção**:

```bash
cd /tmp
# Baixa o backup mais recente da nuvem
rclone copy "b2crypt:" /tmp/teste-restore/ --include "*.db"
cd /tmp/teste-restore
# Abre e valida
sqlite3 controle_itens_*.db "PRAGMA integrity_check;"
sqlite3 controle_itens_*.db "SELECT count(*) FROM os;"   # confere se há dados
```

Se `integrity_check` retornar `ok` e as contagens fizerem sentido → **backup confiável**. ✅

---

## ✅ Checklist do dia

- [ ] Etapa 1 — Script usa `sqlite3.backup` (backup consistente) e passa no `integrity_check`
- [ ] Etapa 2 — `rclone` instalado e remote da nuvem conectado (`rclone lsd`)
- [ ] Etapa 3 — Remote `crypt` criado e senhas guardadas no gerenciador
- [ ] Etapa 4 — `backup_offsite.sh` criado, executado e arquivo apareceu na nuvem
- [ ] Etapa 5 — Cron diário às 2h + log em `/var/log/backup_db.log`
- [ ] Etapa 6 — Restauração testada com sucesso (`integrity_check = ok`)
- [ ] Copiar `~/.config/rclone/rclone.conf` para um local seguro

---

## 🔮 Melhorias futuras (opcional)

- **Notificação de falha:** enviar e-mail/Telegram se o backup falhar (o cron já loga; dá pra adicionar um `|| curl ...`).
- **Segundo destino:** replicar para um 2º provedor (Drive + B2) para redundância.
- **Migrar para PostgreSQL/Neon:** se o sistema crescer, um banco gerenciado com backup nativo (padrão do outro projeto `sistema_miraluh`) elimina a dependência do arquivo único SQLite.

---

## 📎 Referências rápidas (ambiente atual)

```
Banco:      /var/www/controle-itens-eventos/backend/instance/controle_itens.db
Backups:    /var/www/controle-itens-eventos/backend/instance/backups/
venv:       /var/www/controle-itens-eventos/backend/venv/bin/python
Script py:  backend/scripts/utilitarios/backup_automatico.py
Serviço:    systemctl restart controle-itens   (roda como user 'ubuntu')
```
