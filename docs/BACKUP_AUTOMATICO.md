# 📦 Guia de Configuração de Backup Automático

Este documento explica como configurar backups automáticos do banco de dados para a nuvem.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Opções de Nuvem](#opções-de-nuvem)
3. [Instalação Rápida (Google Drive)](#instalação-rápida-google-drive)
4. [Outras Opções de Nuvem](#outras-opções-de-nuvem)
5. [Automação com Cron](#automação-com-cron)
6. [Restauração de Backup](#restauração-de-backup)
7. [Monitoramento](#monitoramento)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O sistema de backup automático:

- ✅ **Cria backups consistentes** usando `sqlite3 .backup`
- ✅ **Verifica integridade** com `PRAGMA integrity_check`
- ✅ **Comprime** com gzip (economiza espaço)
- ✅ **Envia para nuvem** (Google Drive, Backblaze, S3, Dropbox)
- ✅ **Limpa backups antigos** (local: 7 dias, nuvem: 30 dias)
- ✅ **Executa automaticamente** via cron

**Custo**: 100% gratuito (até 15GB no Google Drive, 10GB no Backblaze B2)

---

## ☁️ Opções de Nuvem

| Serviço | Gratuito | Espaço | Melhor para |
|---------|----------|--------|-------------|
| **Google Drive** | ✅ 15GB | Até 15GB | Uso pessoal, fácil configuração |
| **Backblaze B2** | ✅ 10GB | Até 10GB | Produção, alta disponibilidade |
| **Dropbox** | ✅ 2GB | Até 2GB | Pequenos projetos |
| **AWS S3** | 💰 Pago* | Ilimitado | Empresas (12 meses grátis*) |

**Recomendação**: Google Drive (mais fácil) ou Backblaze B2 (mais profissional)

---

## 🚀 Instalação Rápida (Google Drive)

### 1️⃣ Instalar rclone na VPS

```bash
# Conectar na VPS via SSH
ssh seu-usuario@ip-vps

# Instalar rclone
curl https://rclone.org/install.sh | sudo bash

# Verificar instalação
rclone version
```

### 2️⃣ Configurar Google Drive

```bash
# Iniciar configuração interativa
rclone config

# Responder:
# n) New remote
# name> gdrive
# Storage> drive  (ou digite o número correspondente)
# client_id> [Enter] (deixar vazio)
# client_secret> [Enter] (deixar vazio)
# scope> 1  (Full access)
# root_folder_id> [Enter] (deixar vazio)
# service_account_file> [Enter] (deixar vazio)
# Edit advanced config? n
# Use auto config? n  (IMPORTANTE: servidor sem GUI)
```

**ATENÇÃO**: Como está em servidor SSH, ele vai mostrar um link:

```
Please go to the following link: https://accounts.google.com/o/oauth2/auth?...
Enter verification code>
```

**Copie o link** e abra no seu navegador local (Windows). Faça login com sua conta Google e autorize. Copie o código gerado e cole no terminal SSH.

```bash
# Após autorizar, testar:
rclone lsd gdrive:

# Deve listar suas pastas do Google Drive
```

### 3️⃣ Copiar e configurar script de backup

```bash
# Na VPS, copiar script
cd /var/www/controle-itens-eventos
chmod +x backup_db.sh

# Editar configurações (se necessário)
nano backup_db.sh

# Procurar a linha:
# RCLONE_REMOTE="gdrive:backups/controle-itens"
# (Pode deixar assim ou mudar o caminho)
```

### 4️⃣ Testar backup manual

```bash
# Executar backup uma vez manualmente
./backup_db.sh

# Deve mostrar:
# ✅ Backup criado via sqlite3: controle_itens_backup_XXXXXX.db
# ✅ Integridade do backup verificada: OK
# ✅ Backup comprimido: XXX KB
# ✅ Backup enviado para: gdrive:backups/controle-itens/...
# ✅ BACKUP CONCLUÍDO COM SUCESSO!
```

**Verificar no Google Drive**: Abra seu navegador → Google Drive → pasta `backups/controle-itens/`

### 5️⃣ Automatizar com cron (executar diariamente)

```bash
# Editar crontab
crontab -e

# Adicionar linha (executar às 3h da manhã todo dia):
0 3 * * * /var/www/controle-itens-eventos/backup_db.sh >> /var/log/backup_db.log 2>&1

# Salvar e sair (Ctrl+O, Enter, Ctrl+X)

# Verificar cron instalado
crontab -l
```

**Pronto!** Agora você tem backups automáticos diários no Google Drive! 🎉

---

## 🔧 Outras Opções de Nuvem

<details>
<summary><b>Backblaze B2</b> (mais profissional, 10GB grátis)</summary>

### Configurar Backblaze B2

1. **Criar conta**: https://www.backblaze.com/b2/sign-up.html
2. **Criar bucket**: Painel B2 → Criar Bucket → Nome: `controle-itens-backup`
3. **Criar Application Key**:
   - Painel B2 → App Keys → Add New Application Key
   - Copiar: **keyID** e **applicationKey** (só aparece uma vez!)

4. **Configurar rclone**:

```bash
rclone config

# n) New remote
# name> b2
# Storage> b2
# account> [COLAR keyID]
# key> [COLAR applicationKey]
# Edit advanced config? n
# Keep this remote? y

# Testar
rclone lsd b2:controle-itens-backup
```

5. **Editar backup_db.sh**:

```bash
nano backup_db.sh

# Descomentar linha:
CLOUD_METHOD="rclone"
RCLONE_REMOTE="b2:controle-itens-backup"
```

</details>

<details>
<summary><b>AWS S3</b> (12 meses grátis para novos usuários)</summary>

### Configurar AWS S3

1. Criar conta AWS (cartão de crédito necessário)
2. Criar bucket S3
3. Criar IAM user com permissão S3
4. Configurar rclone:

```bash
rclone config

# n) New remote
# name> s3
# Storage> s3
# provider> AWS
# access_key_id> [SEU_ACCESS_KEY]
# secret_access_key> [SEU_SECRET_KEY]
# region> us-east-1
```

5. Editar `backup_db.sh`:

```bash
RCLONE_REMOTE="s3:meu-bucket/controle-itens"
```

</details>

<details>
<summary><b>Dropbox</b> (2GB grátis)</summary>

### Configurar Dropbox

```bash
rclone config

# n) New remote
# name> dropbox
# Storage> dropbox
# client_id> [Enter]
# client_secret> [Enter]
# Edit advanced config? n
# Use auto config? n  (servidor SSH)
# [Seguir mesmo processo do Google Drive - autorizar no navegador]
```

Editar `backup_db.sh`:

```bash
RCLONE_REMOTE="dropbox:backups/controle-itens"
```

</details>

---

## ⏰ Automação com Cron

### Exemplos de agendamento

```bash
# Editar crontab
crontab -e

# Diariamente às 3h da manhã (recomendado)
0 3 * * * /var/www/controle-itens-eventos/backup_db.sh >> /var/log/backup_db.log 2>&1

# A cada 6 horas
0 */6 * * * /var/www/controle-itens-eventos/backup_db.sh >> /var/log/backup_db.log 2>&1

# Diariamente às 2h e 14h
0 2,14 * * * /var/www/controle-itens-eventos/backup_db.sh >> /var/log/backup_db.log 2>&1

# Toda segunda-feira às 3h
0 3 * * 1 /var/www/controle-itens-eventos/backup_db.sh >> /var/log/backup_db.log 2>&1
```

### Ver logs dos backups

```bash
# Ver últimas 50 linhas
tail -n 50 /var/log/backup_db.log

# Ver em tempo real
tail -f /var/log/backup_db.log

# Ver apenas erros
grep "❌" /var/log/backup_db.log
```

---

## 🔄 Restauração de Backup

### Restaurar da nuvem

```bash
# 1. Listar backups disponíveis
rclone ls gdrive:backups/controle-itens/

# 2. Baixar backup específico
rclone copy gdrive:backups/controle-itens/2025-11-11/controle_itens_backup_20251111_030000.db.gz /tmp/

# 3. Descompactar
gunzip /tmp/controle_itens_backup_20251111_030000.db.gz

# 4. Parar serviço
sudo systemctl stop controle-itens

# 5. Fazer backup do banco atual
cp /var/www/controle-itens-eventos/backend/instance/controle_itens.db \
   /var/www/controle-itens-eventos/backend/instance/controle_itens_OLD.db

# 6. Restaurar backup
cp /tmp/controle_itens_backup_20251111_030000.db \
   /var/www/controle-itens-eventos/backend/instance/controle_itens.db

# 7. Verificar integridade
sqlite3 /var/www/controle-itens-eventos/backend/instance/controle_itens.db "PRAGMA integrity_check;"

# 8. Reiniciar serviço
sudo systemctl start controle-itens
```

### Restaurar backup local

```bash
# 1. Listar backups locais
ls -lh /var/www/controle-itens-eventos/backups/

# 2. Seguir passos 3-8 acima
```

---

## 📊 Monitoramento

### Script de verificação de backups

Criar `/var/www/controle-itens-eventos/check_backups.sh`:

```bash
#!/bin/bash

echo "📊 Status dos Backups"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Backups locais
LOCAL_COUNT=$(find /var/www/controle-itens-eventos/backups -name "*.db.gz" | wc -l)
LAST_LOCAL=$(ls -t /var/www/controle-itens-eventos/backups/*.db.gz 2>/dev/null | head -1)
LAST_LOCAL_DATE=$(stat -c %y "$LAST_LOCAL" 2>/dev/null | cut -d' ' -f1)

echo "🗂️  Backups locais: $LOCAL_COUNT"
echo "📅 Último backup local: $LAST_LOCAL_DATE"

# Backups na nuvem
echo ""
echo "☁️  Backups na nuvem:"
rclone ls gdrive:backups/controle-itens/ | tail -n 10

# Tamanho do banco atual
DB_SIZE=$(du -h /var/www/controle-itens-eventos/backend/instance/controle_itens.db | cut -f1)
echo ""
echo "💾 Tamanho do banco atual: $DB_SIZE"
```

### Email de notificação (opcional)

Instalar mailutils:

```bash
sudo apt install mailutils
```

Editar `backup_db.sh`, descomentar linha final:

```bash
echo "Backup concluído: $BACKUP_FILE ($BACKUP_SIZE)" | \
    mail -s "✅ Backup DB Controle Itens - $(date +%d/%m/%Y)" seu-email@example.com
```

---

## 🐛 Troubleshooting

### Erro: "rclone: command not found"

```bash
curl https://rclone.org/install.sh | sudo bash
```

### Erro: "Failed to create file system for gdrive:"

```bash
# Reconfigurar remote
rclone config delete gdrive
rclone config  # Criar novamente
```

### Erro: "PRAGMA integrity_check" falha

```bash
# Banco pode estar corrompido
# Tentar recuperar com .recover:
sqlite3 controle_itens.db ".recover" | sqlite3 controle_itens_recuperado.db
```

### Backup não está sendo executado pelo cron

```bash
# Ver logs do cron
grep CRON /var/log/syslog | tail -20

# Verificar permissões
chmod +x /var/www/controle-itens-eventos/backup_db.sh

# Testar cron manualmente
/var/www/controle-itens-eventos/backup_db.sh
```

### Espaço em disco cheio

```bash
# Limpar backups locais antigos manualmente
find /var/www/controle-itens-eventos/backups -name "*.db.gz" -mtime +3 -delete

# Reduzir KEEP_DAYS no backup_db.sh
nano backup_db.sh
# KEEP_DAYS=3  (ao invés de 7)
```

---

## 📚 Referências

- **rclone**: https://rclone.org/
- **Google Drive API**: https://developers.google.com/drive
- **Backblaze B2**: https://www.backblaze.com/b2/docs/
- **Crontab Guru**: https://crontab.guru/ (testar expressões cron)

---

**Autor**: Sistema Controle de Itens e Eventos  
**Versão**: 1.0  
**Data**: Novembro 2025
