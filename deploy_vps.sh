#!/bin/bash
# ========================================
# SCRIPT DE DEPLOY E MIGRAÇÃO PARA VPS
# ========================================
# Este script automatiza o deploy da aplicação
# na VPS com backup e migrations

set -e  # Parar na primeira erro

echo "========================================"
echo "🚀 DEPLOY E MIGRAÇÃO - CONTROLE ITENS"
echo "========================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
PROJETO_DIR="/home/usuario/controle-itens-eventos"  # Ajustar conforme necessário
BACKEND_DIR="$PROJETO_DIR/backend"
VENV_DIR="$BACKEND_DIR/.venv"
DB_FILE="$BACKEND_DIR/controle_itens.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$BACKEND_DIR/backups"

# ========================================
# FUNÇÕES
# ========================================

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# ========================================
# 1. VERIFICAR PRÉ-REQUISITOS
# ========================================

echo "1️⃣  Verificando pré-requisitos..."

if [ ! -d "$PROJETO_DIR" ]; then
    log_error "Projeto não encontrado em $PROJETO_DIR"
    exit 1
fi

if [ ! -d "$VENV_DIR" ]; then
    log_error "Ambiente virtual não encontrado em $VENV_DIR"
    exit 1
fi

log_info "Pré-requisitos OK"
echo ""

# ========================================
# 2. FAZER BACKUP DO BANCO DE DADOS
# ========================================

echo "2️⃣  Fazendo backup do banco de dados..."

mkdir -p "$BACKUP_DIR"

if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_DIR/controle_itens_backup_$TIMESTAMP.db"
    log_info "Backup criado: controle_itens_backup_$TIMESTAMP.db"
else
    log_warn "Banco de dados não existe (primeira execução?)"
fi

echo ""

# ========================================
# 3. ATIVAR AMBIENTE VIRTUAL
# ========================================

echo "3️⃣  Ativando ambiente virtual..."

source "$VENV_DIR/bin/activate"
log_info "Ambiente virtual ativado"
echo ""

# ========================================
# 4. ATUALIZAR DEPENDÊNCIAS
# ========================================

echo "4️⃣  Atualizando dependências..."

cd "$BACKEND_DIR"
pip install -q -r requirements.txt
log_info "Dependências atualizadas"
echo ""

# ========================================
# 5. EXECUTAR MIGRATIONS
# ========================================

echo "5️⃣  Executando migrations..."
echo ""

MIGRATIONS=(
    "migrate_data.py"
    "migrate_add_observacoes.py"
    "migrate_add_responsavel.py"
    "migrate_add_campos_os.py"
    "migrate_add_fiscal_tipo.py"
    "migrate_add_controle_estoque.py"
    "migrate_add_diarias.py"
    "migrate_add_qtd_solicitada.py"
    "migrate_add_item_bec.py"
    "migrate_categorias.py"
)

for migration in "${MIGRATIONS[@]}"; do
    migration_path="migrations/$migration"
    
    if [ -f "$migration_path" ]; then
        echo "  Executando: $migration"
        python "$migration_path" 2>/dev/null || log_warn "  Migration $migration retornou erro (pode ser normal)"
    else
        log_warn "  Migration $migration não encontrada"
    fi
done

echo ""
log_info "Todas as migrations executadas"
echo ""

# ========================================
# 6. INICIALIZAR BANCO (se novo)
# ========================================

echo "6️⃣  Inicializando banco de dados..."

if [ ! -f "$DB_FILE" ]; then
    python init_db.py
    log_info "Banco de dados inicializado"
else
    log_info "Banco de dados já existe"
fi

echo ""

# ========================================
# 7. REINICIAR APLICAÇÃO
# ========================================

echo "7️⃣  Reiniciando aplicação..."

# Parar processo Flask anterior (se estiver rodando)
pkill -f "python app.py" || true
sleep 2

# Iniciar nova instância em background
nohup python app.py > /tmp/controle_itens.log 2>&1 &
sleep 2

if pgrep -f "python app.py" > /dev/null; then
    log_info "Aplicação reiniciada com sucesso"
else
    log_error "Falha ao iniciar aplicação"
    exit 1
fi

echo ""

# ========================================
# 8. RESUMO FINAL
# ========================================

echo "========================================"
echo -e "${GREEN}✅ DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo "========================================"
echo ""
echo "📊 Resumo:"
echo "  • Projeto: $PROJETO_DIR"
echo "  • Backup: $BACKUP_DIR/controle_itens_backup_$TIMESTAMP.db"
echo "  • Banco de dados: $DB_FILE"
echo "  • Aplicação: Rodando em background"
echo "  • Logs: /tmp/controle_itens.log"
echo ""
echo "📝 Próximos passos:"
echo "  1. Verificar logs: tail -f /tmp/controle_itens.log"
echo "  2. Testar acesso: http://localhost:5000"
echo "  3. Se tudo OK, fazer push para produção"
echo ""
