# 🚨 CORREÇÃO DE BUG CRÍTICO: Item Errado Salvo nas O.S.

**Data:** 28/10/2025  
**Severidade:** CRÍTICA  
**Impacto:** Estoque sendo abatido incorretamente

---

## 📋 Descrição do Problema

Ao emitir uma Ordem de Serviço com múltiplos itens diferentes (ex: Coffee Break + Água), o sistema estava salvando **itens duplicados** ao invés dos itens corretos.

### Exemplo Real (O.S. 20/2025):

**Esperado:**
- Item 1: Coffee Break Tipo 1 (ID=1) - 100 unidades
- Item 2: Água mineral 200ml (ID=5) - 100 unidades

**O que foi salvo:**
- Item 1: `item_id=1` (Coffee Break) ✅
- Item 2: `item_id=1` (Coffee Break) ❌ **ERRADO! Deveria ser ID=5 (Água)**

**Resultado:**
- Estoque abatido: 200 unidades de Coffee Break
- Estoque de Água: NÃO foi abatido ❌

---

## 🔍 Causa Raiz

### Problema 1: Frontend usando código BEC ao invés de ID

**Arquivo:** `backend/static/js/app.js`  
**Função:** `atualizarItensOS()`

```javascript
// ❌ ANTES (ERRADO)
option.value = item.item;  // item.item = código BEC ("339030")

// ✅ DEPOIS (CORRETO)
option.value = item.id;    // item.id = ID do banco (1, 2, 5, 6...)
```

### Problema 2: Busca de item usando campo errado

**Arquivo:** `backend/static/js/app.js`  
**Função:** `coletarDadosOS()`

```javascript
// ❌ ANTES (ERRADO)
const item = dadosAlimentacao[categoria].itens.find(i => i.item === itemId);

// ✅ DEPOIS (CORRETO)
const itemId = parseInt(itemSelect.value);  // Converter para número
const item = dadosAlimentacao[categoria].itens.find(i => i.id === itemId);
```

### Problema 3: Backend retornando campo errado

**Arquivo:** `backend/models.py`  
**Modelo:** `ItemOrdemServico.to_dict()`

```python
# ❌ ANTES (ERRADO)
'itemId': self.item_codigo  # Código BEC ("339030")

# ✅ DEPOIS (CORRETO)
'itemId': self.item_id,       # ID do banco (1, 2, 5, 6...)
'itemCodigo': self.item_codigo  # Código BEC separado
```

### Problema 4: Edição de O.S. com fallback incorreto

**Arquivo:** `backend/static/js/app.js`  
**Funções:** `editarOS()` e `restaurarOSParaEdicao()`

```javascript
// ❌ ANTES (ERRADO)
itemSelect.value = item.itemId || item.item_codigo;

// ✅ DEPOIS (CORRETO)
itemSelect.value = item.itemId;  // Agora itemId é o ID correto
```

---

## ✅ Correções Implementadas

### 1. **models.py** (ItemOrdemServico.to_dict)
```python
def to_dict(self):
    return {
        'id': self.id,
        'categoria': self.categoria,
        'itemId': self.item_id,          # ✅ CORRIGIDO
        'itemCodigo': self.item_codigo,  # ✅ Novo campo
        'itemBec': self.item_bec,
        'descricao': self.descricao,
        'unidade': self.unidade,
        'diarias': self.diarias or 1,
        'qtdSolicitada': self.quantidade_solicitada,
        'qtdTotal': self.quantidade_total
    }
```

### 2. **app.js** (atualizarItensOS)
```javascript
function atualizarItensOS(select) {
    // ... código omitido ...
    dadosAlimentacao[categoria].itens.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;  // ✅ CORRIGIDO: usar ID do banco
        option.textContent = item.descricao;
        option.setAttribute('data-unidade', item.unidade);
        option.setAttribute('data-item-bec', item.item);  // ✅ BEC como data attribute
        itemSelect.appendChild(option);
    });
}
```

### 3. **app.js** (coletarDadosOS)
```javascript
function coletarDadosOS() {
    // ... código omitido ...
    itemDivs.forEach((div, index) => {
        const categoria = div.querySelector('.os-categoria').value;
        const itemSelect = div.querySelector('.os-item');
        const itemId = parseInt(itemSelect.value);  // ✅ CORRIGIDO: converter para número
        const diarias = parseInt(div.querySelector('.os-diarias').value) || 1;
        const quantidade = parseFloat(div.querySelector('.os-quantidade').value) || 0;
        
        if (categoria && itemId && quantidade) {
            // ✅ CORRIGIDO: buscar pelo ID do banco
            const item = dadosAlimentacao[categoria].itens.find(i => i.id === itemId);
            const selectedOption = itemSelect.options[itemSelect.selectedIndex];
            const itemBec = selectedOption.getAttribute('data-item-bec') || dadosAlimentacao[categoria].natureza;
            
            itensOS.push({
                // ... campos omitidos ...
                itemId  // ✅ Agora é o ID correto
            });
        }
    });
}
```

### 4. **app.js** (editarOS e restaurarOSParaEdicao - 2 locais)
```javascript
// ✅ CORRIGIDO: remover fallback incorreto
itemSelect.value = item.itemId;  // Agora itemId retorna o ID correto do banco
```

---

## 🧪 Como Testar

1. **Limpar cache do navegador:** Ctrl+Shift+R
2. **Emitir nova O.S. com itens diferentes:**
   - Adicionar "Coffee Break Tipo 1"
   - Adicionar "Água mineral em copos de 200 ml"
   - Visualizar e confirmar
3. **Verificar no banco:**
   ```bash
   python check_os_20.py
   ```
4. **Conferir:**
   - Item #1: `item_id=1` (Coffee Break) ✅
   - Item #2: `item_id=5` (Água) ✅
   - Sem duplicações ✅

---

## 📊 Impacto

**Antes:**
- ❌ Itens errados salvos
- ❌ Estoque abatido incorretamente
- ❌ Relatórios com dados incorretos

**Depois:**
- ✅ Itens corretos salvos com ID do banco
- ✅ Estoque abatido corretamente
- ✅ Integridade dos dados garantida

---

## 🔄 O.S. Afetadas

**Verificar e corrigir manualmente:**
- O.S. 20/2025 (2 Coffee Break ao invés de Coffee + Água)
- Todas as O.S. emitidas antes desta correção

**Script de verificação:**
```bash
python verificar_item_os12.py  # Adaptar para verificar todas as O.S.
```

---

## 📝 Notas Técnicas

### Diferença entre campos:
- **`item.id`**: ID na tabela `itens` (1, 2, 3, 5, 6...) - **CORRETO**
- **`item.item` / `item_codigo`**: Código BEC (339030, 339039...) - Apenas para exibição

### Por que aconteceu:
1. API retornava `item.item` (código BEC) junto com `item.id`
2. Frontend usava `item.item` como value do `<option>`
3. Ao salvar, o código BEC era enviado como itemId
4. Backend não validava e salvava com ID errado

### Prevenção futura:
- ✅ Sempre usar `item.id` para referências de banco
- ✅ Usar códigos (BEC, etc) apenas para exibição
- ✅ Validar tipos (parseInt, parseFloat) antes de buscar
- ✅ Adicionar validação no backend para rejeitar IDs inválidos

---

**Autor:** Sistema (GitHub Copilot)  
**Revisado por:** Bruno Vargas  
**Status:** ✅ Corrigido e testado
