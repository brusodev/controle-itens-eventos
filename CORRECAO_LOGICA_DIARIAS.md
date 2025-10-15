# 🔧 Correção: Lógica de Diárias e Quantidade

## Problema Identificado

Ao adicionar um item com:
- **3 diárias**
- **60 unidades** (quantidade por dia)

O sistema mostrava:
- ❌ **DIÁRIAS:** 1
- ❌ **QTDE SOLICITADA:** 180
- ❌ **QTDE SOLICITADA TOTAL:** 180

Quando deveria mostrar:
- ✅ **DIÁRIAS:** 3
- ✅ **QTDE SOLICITADA:** 60 (quantidade por dia)
- ✅ **QTDE SOLICITADA TOTAL:** 180 (3 × 60)

---

## Causa Raiz

### 1️⃣ Problema na Coleta de Dados (app.js)

**Antes (linhas 542-556):**
```javascript
const diarias = div.querySelector('.os-diarias').value;  // ❌ String!
const quantidade = div.querySelector('.os-quantidade').value;  // ❌ String!

itensOS.push({
    diarias: diarias || 1,  // ❌ String ou número
    qtdSolicitada: quantidade,  // ❌ String "60"
    qtdTotal: (diarias || 1) * quantidade,  // ❌ Multiplicação com strings!
});
```

**Problema:**
- `value` de input HTML sempre retorna **string**
- Multiplicação de string × número pode dar resultados inesperados
- Conversão implícita causava erros de cálculo

**Depois (CORRIGIDO):**
```javascript
const diarias = parseInt(div.querySelector('.os-diarias').value) || 1;  // ✅ Número
const quantidade = parseFloat(div.querySelector('.os-quantidade').value) || 0;  // ✅ Número

itensOS.push({
    diarias: diarias,  // ✅ Número inteiro
    qtdSolicitada: quantidade,  // ✅ Número float
    qtdTotal: diarias * quantidade,  // ✅ Multiplicação correta!
});
```

---

### 2️⃣ Problema na Edição de O.S. (app.js)

**Antes (linha 1461):**
```javascript
// ❌ Preenchia com quantidade TOTAL ao invés de quantidade SOLICITADA
const qtdInput = ultimoItem.querySelector('.os-quantidade');
qtdInput.value = item.qtdTotal || item.quantidade_total;
```

**Problema:**
- Ao editar uma O.S., o formulário recebia `qtdTotal` (180)
- Deveria receber `qtdSolicitada` (60)
- Usuário via 180 ao invés de 60 ao editar

**Depois (CORRIGIDO):**
```javascript
// ✅ Preenche diárias
const diariasInput = ultimoItem.querySelector('.os-diarias');
diariasInput.value = item.diarias || 1;

// ✅ Preenche quantidade SOLICITADA (não total!)
const qtdInput = ultimoItem.querySelector('.os-quantidade');
qtdInput.value = item.qtdSolicitada || 
                 item.quantidade_solicitada || 
                 (item.qtdTotal || item.quantidade_total) / (item.diarias || 1);
```

**Lógica:**
1. Tenta usar `qtdSolicitada` (campo novo)
2. Se não existir, usa `quantidade_solicitada` (nome do banco)
3. Como fallback, calcula: `qtdTotal ÷ diarias`

---

### 3️⃣ Problema na Geração do PDF (pdf_generator.py)

**Antes (linha 339):**
```python
# ❌ Condição falhava quando qtdSolicitada = 0
qtd_solicitada = float(item.get('qtdSolicitada', 0)) if item.get('qtdSolicitada') else float(item.get('qtdTotal', 0)) / diarias
```

**Problema:**
- `if item.get('qtdSolicitada')` é `False` quando o valor é 0
- Entrava no `else` mesmo quando qtdSolicitada existia
- Recalculava de forma errada

**Depois (CORRIGIDO):**
```python
# ✅ Verifica se é None, não se é truthy
qtd_solicitada = (
    float(item.get('qtdSolicitada', 0)) 
    if item.get('qtdSolicitada') is not None 
    else (float(item.get('qtdTotal', 0)) / diarias if diarias > 0 else 0)
)
```

**Lógica:**
- Usa `is not None` ao invés de truthy check
- Permite valores 0 válidos
- Só recalcula se realmente não existir

---

## Correções Aplicadas

### ✅ Arquivo: `backend/static/js/app.js`

#### Correção 1: Conversão de tipos na coleta de dados (linhas 535-556)
```diff
- const diarias = div.querySelector('.os-diarias').value;
- const quantidade = div.querySelector('.os-quantidade').value;
+ const diarias = parseInt(div.querySelector('.os-diarias').value) || 1;
+ const quantidade = parseFloat(div.querySelector('.os-quantidade').value) || 0;

  itensOS.push({
-     diarias: diarias || 1,
+     diarias: diarias,
      qtdSolicitada: quantidade,
-     qtdTotal: (diarias || 1) * quantidade,
+     qtdTotal: diarias * quantidade,
  });
```

#### Correção 2: Preenchimento correto na edição (linhas 1453-1466)
```diff
  // Preencher item
  const itemSelect = ultimoItem.querySelector('.os-item');
  itemSelect.value = item.itemId || item.item_codigo;
  
+ // Preencher diárias
+ const diariasInput = ultimoItem.querySelector('.os-diarias');
+ diariasInput.value = item.diarias || 1;
+ 
- // Preencher quantidade
+ // Preencher quantidade solicitada (não total!)
  const qtdInput = ultimoItem.querySelector('.os-quantidade');
- qtdInput.value = item.qtdTotal || item.quantidade_total;
+ qtdInput.value = item.qtdSolicitada || item.quantidade_solicitada || 
+                  (item.qtdTotal || item.quantidade_total) / (item.diarias || 1);
```

---

### ✅ Arquivo: `backend/pdf_generator.py`

#### Correção 3: Verificação correta de existência (linha 339)
```diff
  for idx, item in enumerate(dados.get('itens', []), 1):
      diarias = int(item.get('diarias', 1))
-     qtd_solicitada = float(item.get('qtdSolicitada', 0)) if item.get('qtdSolicitada') else float(item.get('qtdTotal', 0)) / diarias
+     qtd_solicitada = (
+         float(item.get('qtdSolicitada', 0)) 
+         if item.get('qtdSolicitada') is not None 
+         else (float(item.get('qtdTotal', 0)) / diarias if diarias > 0 else 0)
+     )
      qtd_total = float(item.get('qtdTotal', 0))
```

---

## Como Testar

### 1. Criar Nova O.S.

1. Vá para **📄 Emitir O.S.**
2. Adicione um item com:
   - Categoria: qualquer
   - Item: qualquer
   - **Diárias:** 3
   - **Qtd:** 60
3. Clique **👁️ Visualizar**
4. **Verifique:**
   - ✅ DIÁRIAS: 3
   - ✅ QTDE SOLICITADA: 60
   - ✅ QTDE SOLICITADA TOTAL: 180

### 2. Editar O.S. Existente

1. Vá para **📋 Ordens de Serviço**
2. Clique **✏️ Editar** em qualquer O.S.
3. **Verifique o formulário:**
   - ✅ Campo "Diárias" mostra o valor correto
   - ✅ Campo "Qtd" mostra quantidade por dia (não total)
4. Mude valores e salve
5. **Verifique PDF:**
   - ✅ Cálculos corretos

### 3. Gerar PDF

1. Em qualquer O.S., clique **📄 PDF**
2. Abra o PDF gerado
3. **Verifique tabela de itens:**
   - ✅ Coluna DIÁRIAS mostra valores corretos
   - ✅ QTDE SOLICITADA = quantidade por dia
   - ✅ QTDE SOLICITADA TOTAL = diárias × qtdSolicitada
   - ✅ VALOR TOTAL = qtdTotal × valor unitário

---

## Exemplo Prático

### Entrada:
- **Categoria:** Coffee Break e Bebidas Quentes
- **Item:** Água mineral em copos de 200 ml
- **Diárias:** 3
- **Quantidade:** 60

### Processamento Correto:
```javascript
// Frontend (app.js)
const diarias = 3;  // parseInt("3")
const quantidade = 60;  // parseFloat("60")
const qtdTotal = 3 * 60 = 180;  // Número × Número

// Backend (models.py)
ItemOrdemServico(
    diarias=3,
    quantidade_solicitada=60,
    quantidade_total=180
)

// PDF (pdf_generator.py)
diarias = 3
qtd_solicitada = 60  // Não recalcula!
qtd_total = 180
```

### Saída no PDF:
| Nº | DESCRIÇÃO | ITEM BEC | DIÁRIAS | QTDE SOLICITADA | QTDE SOLICITADA TOTAL | VALOR UNIT. | VALOR TOTAL |
|----|-----------|----------|---------|-----------------|----------------------|-------------|-------------|
| 1  | Água mineral em copos de 200 ml | 339030 | **3** | **60** | **180** | R$ 25,60 | R$ 4.608,00 |

---

## Impacto

### ✅ Antes:
- Diárias não apareciam corretamente
- Quantidade mostrava total ao invés de por dia
- Edição de O.S. quebrava os valores

### ✅ Depois:
- **Lógica matemática correta:** diarias × quantidade = total
- **Edição funcional:** valores corretos ao reabrir O.S.
- **PDF preciso:** todas as colunas com dados corretos
- **Conversão de tipos garantida:** sem erros de string × número

---

## Status

✅ **CORRIGIDO EM 3 ARQUIVOS:**
1. `backend/static/js/app.js` (coleta de dados)
2. `backend/static/js/app.js` (edição de O.S.)
3. `backend/pdf_generator.py` (geração de PDF)

✅ **TESTE AGORA:**
1. Recarregue a página (Ctrl+Shift+R)
2. Crie uma nova O.S. com 3 diárias de 60 unidades
3. Verifique que aparece corretamente!

---

## Arquivos Modificados

```
backend/
  ├── static/
  │   └── js/
  │       └── app.js ✅ (2 correções)
  └── pdf_generator.py ✅ (1 correção)
```

**Total:** 3 correções em 2 arquivos
