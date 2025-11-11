#!/bin/bash
# Script para testar a funcionalidade de motivo de exclusão

echo "======================================================================="
echo "🧪 TESTE DE FUNCIONALIDADE - MOTIVO DE EXCLUSÃO DE O.S."
echo "======================================================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está no diretório certo
if [ ! -f "backend/models.py" ]; then
    echo -e "${RED}❌ Erro: Execute este script da raiz do projeto!${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Passo 1: Verificando arquivos modificados...${NC}"
echo ""

# Lista de arquivos que devem ser modificados
files_to_check=(
    "backend/models.py"
    "backend/routes/os_routes.py"
    "backend/static/js/app.js"
    "backend/static/js/api-client.js"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file (NÃO ENCONTRADO)"
    fi
done

echo ""
echo -e "${YELLOW}📋 Passo 2: Verificando script de migração...${NC}"
echo ""

if [ -f "backend/scripts/migracao/add_motivo_exclusao.py" ]; then
    echo -e "${GREEN}✅${NC} backend/scripts/migracao/add_motivo_exclusao.py"
else
    echo -e "${RED}❌${NC} Script de migração não encontrado"
fi

echo ""
echo -e "${YELLOW}📋 Passo 3: Instruções de teste...${NC}"
echo ""
echo "1️⃣  Execute a migração:"
echo "    cd backend"
echo "    python scripts/migracao/add_motivo_exclusao.py"
echo ""
echo "2️⃣  Inicie o servidor:"
echo "    python app.py"
echo ""
echo "3️⃣  Abra o navegador:"
echo "    http://localhost:5000"
echo ""
echo "4️⃣  Crie uma O.S. de teste"
echo ""
echo "5️⃣  Tente deletar a O.S. e veja o prompt de motivo"
echo ""
echo "6️⃣  Verifique na Auditoria se o motivo foi registrado"
echo ""
echo "======================================================================="
echo -e "${GREEN}✅ Verificação de arquivos concluída!${NC}"
echo "======================================================================="
