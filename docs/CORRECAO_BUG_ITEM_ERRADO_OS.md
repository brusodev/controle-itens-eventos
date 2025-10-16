# 🐛 Correção: Bug de Item Errado na Criação de O.S.

## ❌ O Problema

Quando o usuário selecionava um item no formulário de emissão de O.S., o sistema salvava o **item errado** no banco de dados.

### Exemplo do Bug:
- **Selecionado**: Água mineral em garrafas de 500 ml (ID: 6, Código: "2")
- **Salvo no banco**: Coffee Break Tipo 2 (ID: 2, Código: "2")
- **Resultado**: PDF mostrava item errado, mas estoque era abatido do item errado

---

## 🔍 Causa Raiz

O código estava usando `item_codigo` (campo string que pode se repetir) em vez de `id` (campo único) para identificar os itens.

### Estrutura dos Dados:

```javascript
// Coffee Break Tipo 2
{
  id: 2,           // ✅ ID único
  item: "2",       // ❌ Código (pode repetir)
  descricao: "Coffee Break Tipo 2"
}

// Água mineral 500ml (categoria diferente)
{
  id: 6,           // ✅ ID único
  item: "2",       // ❌ Código (repetido!)
  descricao: "Água mineral em garrafas de 500 ml"
}
```

### Fluxo do Bug:

1. **Select populado** com `value="2"` (item_codigo) ❌
2. **Usuário seleciona** Água 500ml
3. **coletarDadosOS()** busca por `i.item === "2"` ❌
4. **Encontra** Coffee Break primeiro (categoria processada antes) ❌
5. **Salva** dados do Coffee Break em vez da Água ❌

---

## ✅ Solução Implementada

### 1. Correção em `atualizarItensOS()` (linha ~479)

**Antes:**
```javascript
option.value = item.item;  // ❌ Usa item_codigo (string)
```

**Depois:**
```javascript
option.value = item.id;  // ✅ Usa ID único (número)
option.setAttribute('data-item-codigo', item.item);  // Guarda código para referência
```

### 2. Correção em `coletarDadosOS()` (linha ~537)

**Antes:**
```javascript
const itemId = itemSelect.value;  // ❌ String
const item = dadosAlimentacao[categoria].itens.find(i => i.item === itemId);  // ❌ Busca por código
```

**Depois:**
```javascript
const itemId = parseInt(itemSelect.value);  // ✅ Converte para número
const item = dadosAlimentacao[categoria].itens.find(i => i.id === itemId);  // ✅ Busca por ID

if (!item) {
    console.error(`Item com ID ${itemId} não encontrado na categoria ${categoria}`);
    return;
}
```

---

## 🧪 Como Testar

1. **Limpe o cache** do navegador (Ctrl+Shift+Del)
2. **Recarregue** a página (F5)
3. **Crie uma nova O.S.**:
   - Selecione categoria: "Fornecimento de Água Mineral"
   - Selecione item: "Água mineral em garrafas de 500 ml"
   - Quantidade: 100
   - Grupo: 1
4. **Visualize e Emita** a O.S.
5. **Verifique**:
   - ✅ PDF mostra "Água mineral em garrafas de 500 ml"
   - ✅ Item BEC: 339030 (correto para Água)
   - ✅ Estoque de Água foi abatido
   - ✅ Estoque de Coffee Break NÃO foi alterado

---

## 📊 Impacto

### Antes da Correção:
- ❌ Itens salvos aleatoriamente baseado na ordem de processamento
- ❌ Estoque abatido do item errado
- ❌ PDF mostrava item incorreto
- ❌ Dados inconsistentes entre O.S. e movimentações

### Após a Correção:
- ✅ Item correto salvo sempre
- ✅ Estoque abatido corretamente
- ✅ PDF mostra item selecionado
- ✅ Dados consistentes

---

## 🔧 Correção Manual da O.S. 11/2025

A O.S. 11/2025 foi corrigida manualmente com o script `corrigir_os11_agua.py`:

1. ✅ Reverteu abatimento do Coffee Break (região 2)
2. ✅ Atualizou `item_id` de 2 para 6
3. ✅ Atualizou `descricao` e `item_bec`
4. ✅ Abateu estoque correto (Água 500ml, região 2)
5. ✅ Registrou movimentação correta

**Estado Final:**
- Item: Água mineral em garrafas de 500 ml ✅
- Item ID: 6 ✅
- Item BEC: 339030 ✅
- Estoque Água (região 2): 5.000 - 300 = 4.700 ✅
- Estoque Coffee Break (região 2): 1.500 (intacto) ✅

---

## 📝 Notas Importantes

### Sobre `item_bec`:
- **NÃO é identificador único** de item
- **É o código da natureza da despesa** (código BEC)
- **Serve para classificação contábil/fiscal**
- **Pode ser igual** entre itens da mesma categoria

### Sobre `item_codigo` (campo `item`):
- **NÃO é identificador único global**
- **É único apenas dentro da categoria**
- **Pode repetir** entre categorias diferentes
- **Usado para referência** no documento original

### Sobre `id`:
- ✅ **Identificador único global**
- ✅ **Auto-incremento** no banco
- ✅ **Nunca se repete**
- ✅ **Deve ser usado** em todas as consultas e relações

---

## ✅ Arquivos Modificados

1. **frontend/app.js**
   - Função `atualizarItensOS()` (linha ~479)
   - Função `coletarDadosOS()` (linha ~537)

2. **backend/corrigir_os11_agua.py** (script único de correção)

---

## 🎯 Conclusão

O bug foi causado por uma confusão entre campos:
- `id` → Identificador único (correto) ✅
- `item_codigo` → Código do item dentro da categoria (incorreto para identificação global) ❌
- `item_bec` → Código da natureza da despesa (não é identificador) ❌

A correção garante que **sempre** o ID único seja usado, eliminando ambiguidades e garantindo consistência dos dados.

---

**Data da Correção:** 16/10/2025  
**Arquivos Afetados:** `frontend/app.js`  
**Status:** ✅ Corrigido e Testado
