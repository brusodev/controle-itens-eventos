#!/bin/bash
#
# Script de Migração de Banco de Dados Entre VPS
#
# Uso:
#   ./migrar_vps.sh export   (na VPS antiga)
#   ./migrar_vps.sh import   (na VPS nova)
#

set -e

# ========================================
# CONFIGURAÇÕES
# ========================================

PROJECT_DIR="/var/www/controle-itens-eventos"
BACKEND_DIR="$PROJECT_DIR/backend"
DB_FILE="$BACKEND_DIR/instance/controle_itens.db"
BACKUP_FILE="/tmp/controle_itens_migration_$(date +%Y%m%d_%H%M%S).db"

# ========================================
# CORES
# ========================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ========================================
# FUNÇÕES
# ========================================

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                                ║${NC}"
    echo -e "${CYAN}║         🚀 MIGRAÇÃO DE BANCO DE DADOS ENTRE VPS 🚀            ║${NC}"
    echo -e "${CYAN}║                                                                ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

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
# EXPORTAR BANCO (VPS ANTIGA)
# ========================================

export_db() {
    print_header
    log_info "MODO: EXPORTAÇÃO (VPS Antiga → Backup)"
    echo ""
    
    # Verificar se banco existe
    if [ ! -f "$DB_FILE" ]; then
        log_error "Banco de dados não encontrado: $DB_FILE"
        exit 1
    fi
    
    # Mostrar info do banco
    DB_SIZE=$(du -h "$DB_FILE" | cut -f1)
    log_info "Banco encontrado: $DB_FILE ($DB_SIZE)"
    
    # Contar registros
    log_info "Analisando dados..."
    TOTAL_OS=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM ordens_servico;" 2>/dev/null || echo "0")
    TOTAL_ITENS=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM itens;" 2>/dev/null || echo "0")
    TOTAL_USUARIOS=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM usuario;" 2>/dev/null || echo "0")
    
    echo ""
    echo "📊 Estatísticas do banco:"
    echo "   - Ordens de Serviço: $TOTAL_OS"
    echo "   - Itens de Estoque: $TOTAL_ITENS"
    echo "   - Usuários: $TOTAL_USUARIOS"
    echo ""
    
    # Criar backup com sqlite3
    log_info "Criando backup consistente..."
    if command -v sqlite3 &> /dev/null; then
        sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"
        log_success "Backup criado: $BACKUP_FILE"
    else
        log_error "sqlite3 não instalado!"
        exit 1
    fi
    
    # Verificar integridade
    log_info "Verificando integridade do backup..."
    if sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" | grep -q "ok"; then
        log_success "Integridade verificada: OK"
    else
        log_error "Backup corrompido! Abortando."
        rm -f "$BACKUP_FILE"
        exit 1
    fi
    
    # Comprimir
    log_info "Comprimindo backup..."
    gzip -f "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_success "Backup comprimido: $BACKUP_SIZE"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "EXPORTAÇÃO CONCLUÍDA!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📦 Arquivo: $BACKUP_FILE"
    echo "📏 Tamanho: $BACKUP_SIZE"
    echo ""
    echo "🔹 PRÓXIMOS PASSOS:"
    echo ""
    echo "1️⃣  Copiar para VPS nova:"
    echo "    scp $BACKUP_FILE usuario@IP-VPS-NOVA:/tmp/"
    echo ""
    echo "2️⃣  Na VPS nova, executar:"
    echo "    cd $PROJECT_DIR && ./migrar_vps.sh import /tmp/$(basename $BACKUP_FILE)"
    echo ""
    echo "Ou usar Google Drive:"
    echo "    rclone copy $BACKUP_FILE gdrive:migration/"
    echo ""
}

# ========================================
# IMPORTAR BANCO (VPS NOVA)
# ========================================

import_db() {
    print_header
    log_info "MODO: IMPORTAÇÃO (Backup → VPS Nova)"
    echo ""
    
    # Verificar se arquivo de backup foi fornecido
    if [ -z "$1" ]; then
        log_error "Forneça o caminho do arquivo de backup!"
        echo ""
        echo "Uso: $0 import /tmp/controle_itens_migration_XXXXXX.db.gz"
        exit 1
    fi
    
    IMPORT_FILE="$1"
    
    if [ ! -f "$IMPORT_FILE" ]; then
        log_error "Arquivo não encontrado: $IMPORT_FILE"
        exit 1
    fi
    
    IMPORT_SIZE=$(du -h "$IMPORT_FILE" | cut -f1)
    log_info "Arquivo encontrado: $IMPORT_FILE ($IMPORT_SIZE)"
    
    # Descompactar se necessário
    if [[ "$IMPORT_FILE" == *.gz ]]; then
        log_info "Descompactando arquivo..."
        gunzip -k "$IMPORT_FILE"
        IMPORT_FILE="${IMPORT_FILE%.gz}"
        log_success "Arquivo descompactado"
    fi
    
    # Verificar integridade
    log_info "Verificando integridade..."
    if sqlite3 "$IMPORT_FILE" "PRAGMA integrity_check;" | grep -q "ok"; then
        log_success "Integridade verificada: OK"
    else
        log_error "Arquivo corrompido!"
        exit 1
    fi
    
    # Contar registros
    log_info "Analisando dados do backup..."
    TOTAL_OS=$(sqlite3 "$IMPORT_FILE" "SELECT COUNT(*) FROM ordens_servico;" 2>/dev/null || echo "0")
    TOTAL_ITENS=$(sqlite3 "$IMPORT_FILE" "SELECT COUNT(*) FROM itens;" 2>/dev/null || echo "0")
    TOTAL_USUARIOS=$(sqlite3 "$IMPORT_FILE" "SELECT COUNT(*) FROM usuario;" 2>/dev/null || echo "0")
    
    echo ""
    echo "📊 Dados a serem importados:"
    echo "   - Ordens de Serviço: $TOTAL_OS"
    echo "   - Itens de Estoque: $TOTAL_ITENS"
    echo "   - Usuários: $TOTAL_USUARIOS"
    echo ""
    
    # Confirmar importação
    log_warning "Esta operação vai SUBSTITUIR o banco de dados atual!"
    echo ""
    read -p "Deseja continuar? (digite 'sim' para confirmar): " confirmacao
    
    if [ "$confirmacao" != "sim" ]; then
        log_error "Importação cancelada pelo usuário"
        exit 1
    fi
    
    echo ""
    
    # Parar serviço
    log_info "Parando serviço Flask..."
    sudo systemctl stop controle-itens 2>/dev/null || log_warning "Serviço não estava rodando"
    
    # Backup do banco atual (se existir)
    if [ -f "$DB_FILE" ]; then
        BACKUP_CURRENT="${DB_FILE}.backup_$(date +%Y%m%d_%H%M%S)"
        log_info "Fazendo backup do banco atual..."
        cp "$DB_FILE" "$BACKUP_CURRENT"
        log_success "Backup salvo: $BACKUP_CURRENT"
    fi
    
    # Criar diretório instance se não existir
    mkdir -p "$BACKEND_DIR/instance"
    
    # Copiar novo banco
    log_info "Importando banco de dados..."
    cp "$IMPORT_FILE" "$DB_FILE"
    
    # Ajustar permissões
    log_info "Ajustando permissões..."
    chown ubuntu:ubuntu "$DB_FILE" 2>/dev/null || chown $USER:$USER "$DB_FILE"
    chmod 644 "$DB_FILE"
    
    # Verificar integridade final
    log_info "Verificação final de integridade..."
    if sqlite3 "$DB_FILE" "PRAGMA integrity_check;" | grep -q "ok"; then
        log_success "Banco importado com sucesso!"
    else
        log_error "Erro na importação! Restaurando backup..."
        if [ -f "$BACKUP_CURRENT" ]; then
            cp "$BACKUP_CURRENT" "$DB_FILE"
        fi
        exit 1
    fi
    
    # Reiniciar serviço
    log_info "Reiniciando serviço..."
    sudo systemctl start controle-itens
    sleep 2
    
    if sudo systemctl is-active --quiet controle-itens; then
        log_success "Serviço reiniciado com sucesso"
    else
        log_error "Falha ao reiniciar serviço. Verifique os logs:"
        echo "    sudo journalctl -u controle-itens -n 50"
        exit 1
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "IMPORTAÇÃO CONCLUÍDA COM SUCESSO!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✅ Banco de dados importado e serviço reiniciado"
    echo "✅ Ordens de Serviço: $TOTAL_OS"
    echo "✅ Itens de Estoque: $TOTAL_ITENS"
    echo "✅ Usuários: $TOTAL_USUARIOS"
    echo ""
    echo "🔹 Teste acessando o sistema no navegador"
    echo "🔹 Verifique se os dados estão corretos"
    echo ""
}

# ========================================
# AJUDA
# ========================================

show_help() {
    echo "Uso: $0 [COMANDO] [OPÇÕES]"
    echo ""
    echo "Comandos:"
    echo "  export          Exportar banco da VPS atual (criar backup)"
    echo "  import ARQUIVO  Importar banco de backup para VPS atual"
    echo "  help            Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  # Na VPS ANTIGA:"
    echo "  $0 export"
    echo ""
    echo "  # Copiar backup para VPS NOVA:"
    echo "  scp /tmp/controle_itens_migration_*.db.gz usuario@ip-vps-nova:/tmp/"
    echo ""
    echo "  # Na VPS NOVA:"
    echo "  $0 import /tmp/controle_itens_migration_20251111_120000.db.gz"
    echo ""
}

# ========================================
# MAIN
# ========================================

case "$1" in
    export)
        export_db
        ;;
    import)
        import_db "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Comando inválido: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
