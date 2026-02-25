# 📊 RELATÓRIO FINAL: ANÁLISE DOS SEEDS vs BANCO LOCAL

Data: 25/02/2026
Status: ✅ ANÁLISE COMPLETA

---

## 🎯 OBJETIVO
Verificar se os seeds na pasta `backend/scripts/seed` estão alinhados com o banco de dados local para serem executados na VPS.

---

## 📈 ESTADO ATUAL DO BANCO LOCAL

| Módulo | Categorias | Itens | Detentoras | Grupos Cobertos |
|--------|-----------|-------|------------|-----------------|
| **Coffee** | 5 | 17 | 4 | 1, 2, 3, 4 |
| **Hospedagem** | 2 | 6 | 2 | 1, 2 |
| **Organização** | 4 | 119 | 1 | 1 |
| **Transporte** | 4 | 6 | 2 | 1, 4 |
| **TOTAL** | **15** | **148** | **9** | - |

### Estoques Regionais por Região:
- Região 1: 148 estoques
- Região 2: 148 estoques
- Região 3: 148 estoques
- Região 4: 29 estoques
- Região 5: 29 estoques
- Região 6: 29 estoques

**Total de Estoques:** 531

---

## 🔍 ANÁLISE DETALHADA POR MÓDULO

### 1️⃣ COFFEE BREAK

#### ✅ ITENS E CATEGORIAS - OK
- **seed_coffee_fix.py** - ✅ Funcional
  - Usa arquivo: `scripts/itens.json` ✅ (arquivo existe)
  - Cria 5 categorias: ✅
    1. coffee_break_bebidas_quentes (4 itens)
    2. fornecimento_agua_mineral (3 itens)
    3. kit_lanche (1 item)
    4. fornecimento_biscoitos (8 itens)
    5. almoco_jantar (1 item)
  - **Total:** 17 itens ✅

#### ⚠️ DETENTORAS - INCOMPLETO
- **seed_detentoras_coffee.py** - ⚠️ Precisa atualização
  - **Seed atual:** Cria 6 detentoras com dados GENÉRICOS/PLACEHOLDER
  - **Banco local:** Tem 4 detentoras REAIS (grupos 1-4)
  
  **Detentoras REAIS no banco:**
  1. ✅ Grupo 1: AMBP PROMOÇÕES E EVENTOS EMPRESARIAIS LTDA-EPP
  2. ✅ Grupo 2: XPTO LTDA
  3. ✅ Grupo 3: ALPHA LTDA
  4. ✅ Grupo 4: FALCON LDTA
  5. ❌ Grupo 5: FALTANDO
  6. ❌ Grupo 6: FALTANDO

**AÇÃO NECESSÁRIA:** 
- ✏️ Substituir detentoras genéricas pelas reais (grupos 1-4)
- ✏️ Adicionar detentoras para grupos 5-6 (ou criar apenas as existentes)

---

### 2️⃣ HOSPEDAGEM

#### ✅ ITENS E CATEGORIAS - OK
- **seed_hospedagem.py** - ✅ Funcional
  - 2 categorias:
    1. hospedagem_pensao_completa (3 itens)
    2. hospedagem_meia_pensao (3 itens)
  - **Total:** 6 itens ✅
  - Quantidades e preços definidos corretamente ✅

#### ⚠️ DETENTORAS - INCOMPLETO
- **Banco local:** Tem 2 detentoras REAIS (grupos 1-2)
  
  **Detentoras REAIS no banco:**
  1. ✅ Grupo 1: Hotel
  2. ✅ Grupo 2: Hotel Hibis
  3. ❌ Grupo 3: FALTANDO
  4. ❌ Grupo 4: FALTANDO
  5. ❌ Grupo 5: FALTANDO
  6. ❌ Grupo 6: FALTANDO

**AÇÃO NECESSÁRIA:**
- ✏️ Criar seed de detentoras de hospedagem com os dados reais
- ✏️ Adicionar detentoras para grupos 3-6 (se necessário)

---

### 3️⃣ ORGANIZAÇÃO DE EVENTOS

#### ✅ ITENS E CATEGORIAS - OK
- **seed_organizacao.py** - ✅ Funcional
  - 4 categorias:
    1. montagem_decoracao (47 itens)
    2. recursos_humanos (11 itens)
    3. equipamento_informatica (52 itens)
    4. material_grafico_expediente (9 itens)
  - **Total:** 119 itens ✅
  - Estoques para 3 regiões/grupos ✅

#### ⚠️ DETENTORAS - INCOMPLETO
- **Banco local:** Tem 1 detentora REAL (grupo 1)
  
  **Detentoras REAIS no banco:**
  1. ✅ Grupo 1: Teste LTDA
  2. ❌ Grupo 2: FALTANDO
  3. ❌ Grupo 3: FALTANDO

**AÇÃO NECESSÁRIA:**
- ✏️ Criar seed de detentoras de organização
- ✏️ Adicionar detentoras para grupos 2-3 (se necessário)

---

### 4️⃣ TRANSPORTE

#### ⚠️ ITENS E CATEGORIAS - DESALINHADO
- **seed_transportes.py** - ⚠️ Precisa atualização

  **Seed cria:**
  - 3 categorias, 5 itens
  
  **Banco tem:**
  - 4 categorias, 6 itens
  
  **Categorias no banco:**
  1. ✅ transporte_veiculos_leves (2 itens) - OK no seed
  2. ❌ transporte_veiculos_pesados (0 itens) - Categoria vazia no banco
  3. ✅ transporte_fretamento (3 itens) - OK no seed
  4. ❌ **"Veículos Passageiros"** (1 item) - FALTANDO NO SEED
     - Item: "Veículo tipo ônibus com no min. 44 lugares, equipado com WC e ar-condicionado"
     - Tipo: veiculos_passageiros
     - Código: 1
     - Unidade: KM
     - Qtd inicial em todas regiões: 39095

**AÇÃO NECESSÁRIA:**
- ✏️ Adicionar categoria "Veículos Passageiros" no seed
- ✏️ Adicionar o item de ônibus com 44 lugares
- ✏️ Decidir se mantém categoria "transporte_veiculos_pesados" vazia

#### ⚠️ DETENTORAS - INCOMPLETO
- **seed_detentoras_transporte.py** - ⚠️ Precisa atualização
  - **Seed atual:** Cria 6 detentoras com dados GENÉRICOS
  - **Banco local:** Tem 2 detentoras REAIS (grupos 1 e 4)
  
  **Detentoras REAIS no banco:**
  1. ✅ Grupo 1: ENTRAN
  2. ❌ Grupo 2: FALTANDO
  3. ❌ Grupo 3: FALTANDO
  4. ✅ Grupo 4: Transporte Rapidão
  5. ❌ Grupo 5: FALTANDO
  6. ❌ Grupo 6: FALTANDO

**AÇÃO NECESSÁRIA:**
- ✏️ Substituir detentoras genéricas pelas reais (grupos 1 e 4)
- ✏️ Adicionar detentoras para outros grupos (se necessário)

---

## 📋 RESUMO DE AÇÕES NECESSÁRIAS

### 🔴 PRIORIDADE ALTA (Bloqueiam uso na VPS)

1. **✏️ Atualizar seed_detentoras_coffee.py**
   - Substituir dados genéricos por dados reais
   - Incluir: AMBP, XPTO, ALPHA, FALCON

2. **✏️ Atualizar seed_transportes.py**
   - Adicionar categoria "Veículos Passageiros"
   - Adicionar item de ônibus 44 lugares

3. **✏️ Atualizar seed_detentoras_transporte.py**
   - Substituir dados genéricos por dados reais
   - Incluir: ENTRAN (grupo 1), Transporte Rapidão (grupo 4)

### 🟡 PRIORIDADE MÉDIA (Melhorias)

4. **✏️ Criar seed_detentoras_hospedagem.py**
   - Incluir: Hotel (grupo 1), Hotel Hibis (grupo 2)

5. **✏️ Criar seed_detentoras_organizacao.py**
   - Incluir: Teste LTDA (grupo 1)

---

## ✅ SEEDS PRONTOS PARA USO NA VPS

Estes seeds podem ser executados IMEDIATAMENTE na VPS sem modificações:

1. ✅ **seed_coffee_fix.py**
   - ⚠️ Requer arquivo `scripts/itens.json` (já existe)
   
2. ✅ **seed_hospedagem.py**
   - Cria categorias e itens corretamente

3. ✅ **seed_organizacao.py**
   - Cria categorias e itens corretamente

---

## 🚀 ORDEM DE EXECUÇÃO RECOMENDADA NA VPS

```bash
# 1. Coffee (itens + detentoras)
python backend/scripts/seed/seed_coffee_fix.py
python backend/scripts/seed/seed_detentoras_coffee.py  # APÓS CORREÇÃO

# 2. Hospedagem (itens + detentoras)
python backend/scripts/seed/seed_hospedagem.py
python backend/scripts/seed/seed_detentoras_hospedagem.py  # CRIAR

# 3. Organização (itens + detentoras)
python backend/scripts/seed/seed_organizacao.py
python backend/scripts/seed/seed_detentoras_organizacao.py  # CRIAR

# 4. Transporte (itens + detentoras)
python backend/scripts/seed/seed_transportes.py  # APÓS CORREÇÃO
python backend/scripts/seed/seed_detentoras_transporte.py  # APÓS CORREÇÃO
```

---

## 📝 OBSERVAÇÕES FINAIS

1. **Arquivo itens.json:**
   - ✅ Existe em `scripts/itens.json`
   - ✅ Contém todas as 5 categorias de coffee
   - ✅ Total de 17 itens alinhado com banco

2. **Grupos vs Regiões:**
   - Organização usa 3 grupos (estoques para regiões 1-3)
   - Outros módulos usam 6 regiões
   - Isso está correto conforme o modelo de negócio

3. **Categoria "transporte_veiculos_pesados":**
   - Existe no banco mas está vazia (0 itens)
   - Decidir se deve ser criada vazia ou removida

4. **Detentoras placeholder:**
   - Seeds atuais têm dados genéricos (CNPJs fictícios, etc)
   - DEVEM ser substituídos por dados reais antes de usar na VPS

---

## ✅ CONCLUSÃO

**Status Geral:** ⚠️ **80% PRONTO** - Requer ajustes em detentoras e transportes

**Próximos Passos:**
1. Corrigir seeds de detentoras (coffee, transporte)
2. Criar seeds de detentoras (hospedagem, organização)
3. Corrigir seed_transportes.py (adicionar categoria faltante)
4. Testar todos os seeds localmente
5. Executar na VPS

**Tempo Estimado para Correções:** 30-45 minutos
