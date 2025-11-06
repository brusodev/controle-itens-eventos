#!/bin/bash
#
# Script de Backup Automático do Banco de Dados
# Configure no crontab para executar diariamente
# Exemplo: 0 2 * * * /var/www/controle-itens-eventos/backup.sh
#

# Configurações
BACKUP_DIR="/var/backups/controle-itens"
DB_PATH="/var/www/controle-itens-eventos/backend/instance/controle_itens.db"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.db"

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Fazer backup
if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "$BACKUP_FILE"
    
    # Comprimir backup
    gzip "$BACKUP_FILE"
    
    echo "[$(date)] Backup criado: ${BACKUP_FILE}.gz"
    
    # Remover backups antigos
    find "$BACKUP_DIR" -name "backup_*.db.gz" -mtime +$RETENTION_DAYS -delete
    echo "[$(date)] Backups antigos removidos (>$RETENTION_DAYS dias)"
else
    echo "[$(date)] ERRO: Banco de dados não encontrado em $DB_PATH"
    exit 1
fi

# Verificar tamanho do backup
BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
echo "[$(date)] Tamanho do backup: $BACKUP_SIZE"

# Listar backups existentes
echo "[$(date)] Backups disponíveis:"
ls -lh "$BACKUP_DIR"
