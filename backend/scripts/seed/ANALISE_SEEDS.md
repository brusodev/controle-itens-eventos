# ANÁLISE DOS SEEDS vs BANCO DE DADOS LOCAL

## 📊 ESTADO ATUAL DO BANCO DE DADOS LOCAL

### Por Módulo:

**COFFEE:**
- Categorias: 5
- Itens: 17
- Detentoras: 4

**HOSPEDAGEM:**
- Categorias: 2
- Itens: 6
- Detentoras: 2

**ORGANIZAÇÃO:**
- Categorias: 4
- Itens: 119
- Detentoras: 1

**TRANSPORTE:**
- Categorias: 4
- Itens: 6
- Detentoras: 2

**TOTAL:** 15 categorias, 148 itens, 9 detentoras

---

## 🔍 ANÁLISE DOS SEEDS

### 1. ❌ seed_coffee_fix.py
**Problema:** Depende de um arquivo `itens.json` que não foi encontrado no repositório.
- Usa: `backend/scripts/itens.json`
- Status: ⚠️ Arquivo JSON não encontrado
- **Recomendação:** Criar seed direto em Python sem depender de JSON

### 2. ⚠️ seed_detentoras_coffee.py
**Problema:** Cria 6 detentoras genéricas/placeholder, mas o banco tem 4 detentoras REAIS:
- Banco: AMBP PROMOÇÕES, XPTO LTDA, ALPHA LTDA, FALCON LDTA
- Seed: DETENTORA GRUPO 1-6 - COFFEE (dados fictícios)
- **Recomendação:** Atualizar seed com as detentoras reais do banco local

### 3. ⚠️ seed_detentoras_transporte.py
**Problema:** Cria 6 detentoras genéricas, mas o banco tem apenas 2:
- Banco: ENTRAN (Grupo 1), Transporte Rapidão (Grupo 4)
- Seed: 6 detentoras com nomes fictícios
- **Recomendação:** Atualizar seed com as detentoras reais do banco local

### 4. ✅ seed_hospedagem.py
**Status:** OK - Alinhado com o banco
- 2 categorias, 6 itens
- Quantidades iniciais definidas corretamente
- **Observação:** Banco tem 2 detentoras, ideal seria ter 6

### 5. ✅ seed_organizacao.py
**Status:** OK - Alinhado com o banco
- 4 categorias, 119 itens
- Estrutura completa
- **Observação:** Banco tem apenas 1 detentora, ideal seria ter 3 (um por grupo)

### 6. ⚠️ seed_transportes.py
**Problema:** Seed cria 3 categorias e 5 itens, mas banco tem 4 categorias e 6 itens
- Seed não tem: categoria "Veículos Passageiros" nem o item extra
- Seed não cria: categoria "transporte_veiculos_pesados"
- **Recomendação:** Verificar e alinhar categorias e itens

---

## 📋 AÇÕES NECESSÁRIAS

### PRIORIDADE ALTA

1. **Criar seed_coffee.py completo**
   - Substituir `seed_coffee_fix.py` que depende de JSON
   - Criar categorias e itens baseados no banco local atual
   - 5 categorias, 17 itens

2. **Atualizar seed_detentoras_coffee.py**
   - Usar dados reais: AMBP, XPTO, ALPHA, FALCON
   - Adicionar detentoras para grupos 5 e 6 se necessário

3. **Atualizar seed_detentoras_transporte.py**
   - Usar dados reais: ENTRAN, Transporte Rapidão
   - Adicionar detentoras para outros grupos se necessário

4. **Corrigir seed_transportes.py**
   - Adicionar categoria "transporte_veiculos_pesados"
   - Adicionar categoria "Veículos Passageiros" ou ajustar conforme necessário
   - Verificar o 6º item que está no banco

### PRIORIDADE MÉDIA

5. **Criar seeds de detentoras faltantes**
   - Hospedagem: criar detentoras para grupos 3-6
   - Organização: criar detentoras para grupos 2-3

---

## ✅ SEEDS PRONTOS PARA USO NA VPS

- ✅ seed_hospedagem.py
- ✅ seed_organizacao.py

## ⚠️ SEEDS QUE PRECISAM CORREÇÃO

- ❌ seed_coffee_fix.py (substituir)
- ⚠️ seed_detentoras_coffee.py (atualizar dados)
- ⚠️ seed_detentoras_transporte.py (atualizar dados)
- ⚠️ seed_transportes.py (adicionar categorias/itens faltantes)
