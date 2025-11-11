#!/bin/bash
#
# Script de Backup Automático do Banco de Dados
# 
# Este script cria backups do banco SQLite e envia para a nuvem
# Suporta: Google Drive (rclone), Backblaze B2, AWS S3, Dropbox
#
# Uso:
#   ./backup_db.sh
#
# Instalação do cron (executar diariamente às 3h da manhã):
#   crontab -e
#   0 3 * * * /var/www/controle-itens-eventos/backup_db.sh >> /var/log/backup_db.log 2>&1
#

set -e  # Parar em caso de erro

# ========================================
# CONFIGURAÇÕES
# ========================================

# Diretório do projeto
PROJECT_DIR="/var/www/controle-itens-eventos"
BACKEND_DIR="$PROJECT_DIR/backend"
DB_FILE="$BACKEND_DIR/instance/controle_itens.db"

# Diretório local de backups
BACKUP_DIR="$PROJECT_DIR/backups"
mkdir -p "$BACKUP_DIR"

# Data e hora atual
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE=$(date +"%Y-%m-%d")

# Nome do arquivo de backup
BACKUP_FILE="controle_itens_backup_${TIMESTAMP}.db"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

# Retenção de backups locais (dias)
KEEP_DAYS=7

# ========================================
# MÉTODO DE BACKUP NA NUVEM
# ========================================
# Escolha UMA das opções abaixo descomentando:

# Opção 1: Google Drive (rclone)
CLOUD_ENABLED=true
CLOUD_METHOD="rclone"
RCLONE_REMOTE="gdrive:backups/controle-itens"  # Configure com: rclone config

# Opção 2: Backblaze B2 (rclone)
# CLOUD_ENABLED=true
# CLOUD_METHOD="rclone"
# RCLONE_REMOTE="b2:meu-bucket/controle-itens"

# Opção 3: AWS S3 (rclone ou aws-cli)
# CLOUD_ENABLED=true
# CLOUD_METHOD="rclone"
# RCLONE_REMOTE="s3:meu-bucket/controle-itens"

# Opção 4: Dropbox (rclone)
# CLOUD_ENABLED=true
# CLOUD_METHOD="rclone"
# RCLONE_REMOTE="dropbox:backups/controle-itens"

# Opção 5: Desabilitar backup na nuvem (apenas local)
# CLOUD_ENABLED=false

# ========================================
# CORES PARA OUTPUT
# ========================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========================================
# FUNÇÕES
# ========================================

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ========================================
# VERIFICAÇÕES INICIAIS
# ========================================

log_info "Iniciando backup do banco de dados..."
echo "Data/Hora: $(date)"
echo "Banco: $DB_FILE"
echo ""

# Verificar se o banco existe
if [ ! -f "$DB_FILE" ]; then
    log_error "Banco de dados não encontrado: $DB_FILE"
    exit 1
fi

# Verificar tamanho do banco
DB_SIZE=$(du -h "$DB_FILE" | cut -f1)
log_info "Tamanho do banco: $DB_SIZE"

# ========================================
# CRIAR BACKUP LOCAL
# ========================================

log_info "Criando backup local..."

# Usar sqlite3 para criar backup consistente (evita corrupção)
if command -v sqlite3 &> /dev/null; then
    sqlite3 "$DB_FILE" ".backup '$BACKUP_PATH'"
    log_success "Backup criado via sqlite3: $BACKUP_FILE"
else
    # Fallback: cópia simples
    cp "$DB_FILE" "$BACKUP_PATH"
    log_warning "sqlite3 não encontrado, usando cp (pode ter inconsistências)"
fi

# Verificar integridade do backup
if command -v sqlite3 &> /dev/null; then
    if sqlite3 "$BACKUP_PATH" "PRAGMA integrity_check;" | grep -q "ok"; then
        log_success "Integridade do backup verificada: OK"
    else
        log_error "Backup corrompido! Abortando."
        rm -f "$BACKUP_PATH"
        exit 1
    fi
fi

# Comprimir backup (opcional, economiza espaço)
log_info "Comprimindo backup..."
gzip -f "$BACKUP_PATH"
BACKUP_PATH="${BACKUP_PATH}.gz"
BACKUP_FILE="${BACKUP_FILE}.gz"

BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
log_success "Backup comprimido: $BACKUP_SIZE"

# ========================================
# ENVIAR PARA NUVEM
# ========================================

if [ "$CLOUD_ENABLED" = true ]; then
    log_info "Enviando backup para a nuvem..."
    
    if [ "$CLOUD_METHOD" = "rclone" ]; then
        if command -v rclone &> /dev/null; then
            # Copiar para nuvem
            if rclone copy "$BACKUP_PATH" "$RCLONE_REMOTE/$DATE/" --progress; then
                log_success "Backup enviado para: $RCLONE_REMOTE/$DATE/$BACKUP_FILE"
            else
                log_error "Falha ao enviar backup para a nuvem"
            fi
            
            # Listar backups remotos
            log_info "Backups na nuvem:"
            rclone ls "$RCLONE_REMOTE" | tail -n 5
        else
            log_error "rclone não instalado! Execute: curl https://rclone.org/install.sh | sudo bash"
        fi
    fi
else
    log_warning "Backup na nuvem desabilitado (CLOUD_ENABLED=false)"
fi

# ========================================
# LIMPEZA DE BACKUPS ANTIGOS
# ========================================

log_info "Limpando backups locais antigos (>${KEEP_DAYS} dias)..."

# Deletar backups locais mais antigos que KEEP_DAYS
find "$BACKUP_DIR" -name "controle_itens_backup_*.db.gz" -type f -mtime +$KEEP_DAYS -delete

BACKUPS_LOCAL=$(find "$BACKUP_DIR" -name "controle_itens_backup_*.db.gz" | wc -l)
log_success "Backups locais mantidos: $BACKUPS_LOCAL"

# Limpeza de backups remotos (manter últimos 30 dias)
if [ "$CLOUD_ENABLED" = true ] && [ "$CLOUD_METHOD" = "rclone" ]; then
    log_info "Limpando backups remotos antigos (>30 dias)..."
    
    # Calcular data de 30 dias atrás
    CUTOFF_DATE=$(date -d "30 days ago" +"%Y%m%d" 2>/dev/null || date -v-30d +"%Y%m%d")
    
    # Listar e deletar backups antigos
    rclone lsf "$RCLONE_REMOTE" --recursive | while read -r file; do
        # Extrair data do nome do arquivo (formato: YYYYMMDD)
        FILE_DATE=$(echo "$file" | grep -oP '\d{8}' | head -1)
        
        if [ ! -z "$FILE_DATE" ] && [ "$FILE_DATE" -lt "$CUTOFF_DATE" ]; then
            log_info "Deletando backup remoto antigo: $file"
            rclone delete "$RCLONE_REMOTE/$file"
        fi
    done 2>/dev/null || log_warning "Não foi possível limpar backups remotos"
fi

# ========================================
# RELATÓRIO FINAL
# ========================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "BACKUP CONCLUÍDO COM SUCESSO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 Arquivo local:  $BACKUP_PATH"
echo "📏 Tamanho:        $BACKUP_SIZE"
echo "📅 Data:           $(date)"
if [ "$CLOUD_ENABLED" = true ]; then
    echo "☁️  Nuvem:          $RCLONE_REMOTE/$DATE/$BACKUP_FILE"
fi
echo "🗂️  Backups locais: $BACKUPS_LOCAL arquivo(s)"
echo ""

# Enviar notificação (opcional)
# Descomente para receber email ou notificação
# echo "Backup concluído: $BACKUP_FILE" | mail -s "Backup DB Controle Itens" seu-email@example.com

exit 0
