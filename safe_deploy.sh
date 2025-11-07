#!/bin/bash
#
# SCRIPT SEGURO DE DEPLOYMENT
# ===========================
#
# Este script garante deployment seguro sem perder o banco de dados.
#
# USO:
#   chmod +x safe_deploy.sh
#   ./safe_deploy.sh
#

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Banner
echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║                    🔒 DEPLOYMENT SEGURO - VPS                             ║"
echo "║                                                                            ║"
echo "║              Proteção contra perda de dados do banco                      ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Verificar se está no diretório correto
if [ ! -d "backend" ]; then
    print_error "Erro: Execute este script na raiz do projeto!"
    print_info "Exemplo: cd /seu/projeto && ./safe_deploy.sh"
    exit 1
fi

# 1. Backup do banco
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASSO 1/7: Backup do banco de dados"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "backend/instance/controle_itens.db" ]; then
    print_info "Criando backup automático..."
    cd backend
    python scripts/utilitarios/backup_automatico.py
    if [ $? -eq 0 ]; then
        print_success "Backup criado com sucesso"
    else
        print_error "Falha no backup automático"
        print_warning "Criando backup manual..."
        
        # Backup manual
        BACKUP_DIR="instance/backups"
        mkdir -p "$BACKUP_DIR"
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        cp instance/controle_itens.db "$BACKUP_DIR/controle_itens_manual_$TIMESTAMP.db"
        
        if [ $? -eq 0 ]; then
            print_success "Backup manual criado"
        else
            print_error "ERRO CRÍTICO: Não foi possível criar backup!"
            read -p "Deseja continuar mesmo assim? (s/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Ss]$ ]]; then
                print_error "Deployment cancelado por segurança"
                exit 1
            fi
        fi
    fi
    cd ..
else
    print_warning "Banco de dados não encontrado em backend/instance/"
    print_info "Se é primeira instalação, tudo bem. Caso contrário, PARE AGORA!"
    read -p "É primeira instalação? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_error "Deployment cancelado"
        exit 1
    fi
fi

echo ""

# 2. Verificar Git
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASSO 2/7: Verificar atualizações"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_info "Buscando atualizações do GitHub..."
git fetch origin main

if [ $? -ne 0 ]; then
    print_error "Falha ao buscar atualizações"
    exit 1
fi

print_success "Atualizações obtidas"
echo ""

# 3. Mostrar diferenças
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASSO 3/7: Mudanças detectadas"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CHANGES=$(git diff main origin/main --stat)

if [ -z "$CHANGES" ]; then
    print_info "Nenhuma mudança detectada. Código já está atualizado!"
    
    # Verificar mesmo assim se banco está OK
    if [ -f "backend/instance/controle_itens.db" ]; then
        print_success "Banco de dados: OK"
    else
        print_warning "Banco de dados: NÃO ENCONTRADO"
    fi
    
    echo ""
    print_success "Sistema já está na versão mais recente"
    exit 0
fi

echo "$CHANGES"
echo ""

# 4. Confirmar deployment
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASSO 4/7: Confirmar deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_warning "ATENÇÃO: Você está prestes a atualizar o código em PRODUÇÃO!"
print_info "Backup do banco foi criado e está seguro"
print_info "O .gitignore protege o banco de ser sobrescrito"
echo ""

read -p "Continuar com git pull? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    print_error "Deployment cancelado pelo usuário"
    exit 1
fi

echo ""

# 5. Git pull (banco protegido por .gitignore)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASSO 5/7: Atualizando código"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_info "Executando git pull..."
git pull origin main

if [ $? -ne 0 ]; then
    print_error "Erro no git pull!"
    print_warning "Resolva os conflitos manualmente"
    exit 1
fi

print_success "Código atualizado"
echo ""

# 6. Verificar banco ainda existe
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASSO 6/7: Verificar integridade"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "backend/instance/controle_itens.db" ]; then
    # Verificar tamanho do banco
    DB_SIZE=$(du -h backend/instance/controle_itens.db | cut -f1)
    print_success "Banco de dados: OK ($DB_SIZE)"
    
    # Verificar integridade SQLite
    print_info "Verificando integridade do banco..."
    INTEGRITY=$(sqlite3 backend/instance/controle_itens.db "PRAGMA integrity_check;" 2>&1)
    
    if [ "$INTEGRITY" = "ok" ]; then
        print_success "Integridade do banco: OK"
    else
        print_warning "Integridade do banco: $INTEGRITY"
    fi
else
    print_error "ERRO CRÍTICO: Banco de dados SUMIU!"
    print_warning "Restaurando do backup automaticamente..."
    
    # Encontrar último backup
    LATEST_BACKUP=$(ls -t backend/instance/backups/*.db 2>/dev/null | head -1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        cp "$LATEST_BACKUP" backend/instance/controle_itens.db
        
        if [ $? -eq 0 ]; then
            print_success "Banco restaurado de: $(basename $LATEST_BACKUP)"
        else
            print_error "Falha ao restaurar backup!"
            print_error "Restaure manualmente: cp $LATEST_BACKUP backend/instance/controle_itens.db"
            exit 1
        fi
    else
        print_error "Nenhum backup encontrado!"
        print_error "Você precisará restaurar o banco manualmente"
        exit 1
    fi
fi

echo ""

# 7. Instruções finais
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASSO 7/7: Finalizar deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_success "Deployment concluído com segurança!"
echo ""

print_info "PRÓXIMOS PASSOS:"
echo ""
echo "  1. Reinicie o servidor:"
echo "     sudo systemctl restart controle-itens"
echo ""
echo "  2. Verifique se está funcionando:"
echo "     curl -s http://localhost:5100 | head -5"
echo ""
echo "  3. Teste no navegador:"
echo "     http://seu_servidor.com:5100"
echo ""

print_warning "IMPORTANTE: Não esqueça de reiniciar o servidor!"
echo ""

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║                    ✅ DEPLOYMENT SEGURO CONCLUÍDO! ✅                     ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""
