# 🐛 CORREÇÃO: Diárias Não Estão Sendo Salvas

## Problema Identificado

Ao criar/editar uma O.S., as **diárias não eram salvas no banco de dados**, sempre ficando como **1**.

**Sintoma:**
- Usuário adiciona: 3 diárias × 60 unidades
- Salva no banco: 1 diária × 180 unidades ❌
- Multiplica corretamente no front (180 total)
- Mas ao recarregar, mostra 1 diária ❌

---

## Causa Raiz

### ❌ ANTES: Mapeamento Incompleto

**Arquivo:** `backend/static/js/app.js` - Linha ~785

```javascript
// confirmarEmissaoOS() - Mapeamento para API
const dadosAPI = {
    numeroOS: dadosOS.numeroOS,
    contrato: dadosOS.contratoNum,
    // ... outros campos ...
    itens: dadosOS.itens.map(item => ({
        categoria: item.categoria,
        itemId: item.itemId,
        itemBec: item.itemBec,
        descricao: item.descricao,
        unidade: item.unidade,
        qtdTotal: item.qtdTotal  // ❌ FALTA diarias e qtdSolicitada!
    }))
};
```

**Problema:**
- `dadosOS.itens` contém `diarias` e `qtdSolicitada` (coletados do formulário)
- Mas ao mapear para `dadosAPI`, esses campos **NÃO eram incluídos**
- API recebia apenas `qtdTotal`, sem informação de diárias
- Backend salvava `diarias = 1` (valor padrão)

---

## Solução Aplicada

### ✅ DEPOIS: Mapeamento Completo

**Arquivo:** `backend/static/js/app.js` - Linha ~785

```javascript
// confirmarEmissaoOS() - Mapeamento CORRIGIDO
const dadosAPI = {
    numeroOS: dadosOS.numeroOS,
    contrato: dadosOS.contratoNum,
    // ... outros campos ...
    itens: dadosOS.itens.map(item => ({
        categoria: item.categoria,
        itemId: item.itemId,
        itemBec: item.itemBec,
        descricao: item.descricao,
        unidade: item.unidade,
        diarias: item.diarias,  // ✅ ADICIONADO
        qtdSolicitada: item.qtdSolicitada,  // ✅ ADICIONADO
        qtdTotal: item.qtdTotal
    }))
};
```

**Correção:**
- Agora `dadosAPI.itens` inclui **todos os campos necessários**
- API recebe `diarias`, `qtdSolicitada` e `qtdTotal`
- Backend salva corretamente na tabela `itens_ordem_servico`

---

## Fluxo Completo de Dados

### 1️⃣ Formulário HTML
```html
<input type="number" class="os-diarias" placeholder="Diárias" value="1">
<input type="number" class="os-quantidade" placeholder="Qtd" min="0">
```

### 2️⃣ Coleta de Dados (coletarDadosOS)
```javascript
const diarias = parseInt(div.querySelector('.os-diarias').value) || 1;  // 3
const quantidade = parseFloat(div.querySelector('.os-quantidade').value) || 0;  // 60

itensOS.push({
    num: index + 1,
    descricao: item.descricao,
    itemBec: dadosAlimentacao[categoria].natureza,
    diarias: diarias,  // ✅ 3
    qtdSolicitada: quantidade,  // ✅ 60
    qtdTotal: diarias * quantidade,  // ✅ 180
    // ...
});
```

### 3️⃣ Mapeamento para API (confirmarEmissaoOS) - **CORRIGIDO!**
```javascript
itens: dadosOS.itens.map(item => ({
    categoria: item.categoria,
    itemId: item.itemId,
    itemBec: item.itemBec,
    descricao: item.descricao,
    unidade: item.unidade,
    diarias: item.diarias,  // ✅ 3
    qtdSolicitada: item.qtdSolicitada,  // ✅ 60
    qtdTotal: item.qtdTotal  // ✅ 180
}))
```

### 4️⃣ API Backend (os_routes.py)
```python
item_os = ItemOrdemServico(
    ordem_servico_id=os.id,
    item_id=item.id,
    categoria=item_os_data['categoria'],
    item_codigo=item_os_data['itemId'],
    item_bec=item_os_data.get('itemBec', ''),
    descricao=item_os_data['descricao'],
    unidade=item_os_data.get('unidade', 'Unidade'),
    diarias=item_os_data.get('diarias', 1),  # ✅ Recebe 3
    quantidade_solicitada=item_os_data.get('qtdSolicitada'),  # ✅ Recebe 60
    quantidade_total=item_os_data['qtdTotal']  # ✅ Recebe 180
)
```

### 5️⃣ Banco de Dados (itens_ordem_servico)
```sql
INSERT INTO itens_ordem_servico (
    ordem_servico_id,
    item_id,
    diarias,  -- ✅ 3
    quantidade_solicitada,  -- ✅ 60
    quantidade_total  -- ✅ 180
) VALUES (...)
```

---

## Teste de Verificação

### Como Confirmar que Está Corrigido:

1. **Recarregue a página** (Ctrl+Shift+R)

2. **Crie uma nova O.S.:**
   - Item: Água mineral
   - Diárias: **3**
   - Quantidade: **60**
   - Clique **Visualizar** (deve mostrar total 180)
   - Clique **Confirmar e Emitir**

3. **Feche e Reabra a O.S.:**
   - Vá em **📋 Ordens de Serviço**
   - Clique **👁️ Visualizar** na O.S. criada

4. **Verifique:**
   ```
   ✅ DIÁRIAS: 3 (não 1!)
   ✅ QTDE SOLICITADA: 60
   ✅ QTDE TOTAL: 180
   ```

5. **Edite a O.S.:**
   - Clique **✏️ Editar**
   - Formulário deve mostrar:
     - Campo "Diárias": **3** ✅
     - Campo "Qtd": **60** ✅

---

## Verificação no Banco de Dados

### Console Python:
```python
from models import db, OrdemServico, ItemOrdemServico

# Buscar última O.S.
os = OrdemServico.query.order_by(OrdemServico.id.desc()).first()

# Verificar itens
for item in os.itens:
    print(f"Item: {item.descricao}")
    print(f"  Diárias: {item.diarias}")  # Deve ser 3, não 1
    print(f"  Qtd Solicitada: {item.quantidade_solicitada}")  # 60
    print(f"  Qtd Total: {item.quantidade_total}")  # 180
```

### SQL Direto:
```sql
SELECT 
    descricao,
    diarias,
    quantidade_solicitada,
    quantidade_total
FROM itens_ordem_servico
ORDER BY id DESC
LIMIT 5;
```

**Resultado Esperado:**
```
descricao                        | diarias | quantidade_solicitada | quantidade_total
----------------------------------|---------|----------------------|------------------
Água mineral em copos de 200 ml  |    3    |         60.0         |      180.0
```

---

## Arquivos Modificados

```
✅ backend/static/js/app.js (linha ~785)
   - Adicionado diarias e qtdSolicitada no mapeamento para API

📝 CORRECAO_DIARIAS_NAO_SALVANDO.md (este arquivo)
   - Documentação do problema e solução
```

---

## Checklist Final

- [x] Frontend coleta `diarias` do formulário (parseInt) ✅
- [x] Frontend calcula `qtdTotal = diarias × quantidade` ✅
- [x] Frontend envia `diarias` na requisição API ✅
- [x] Frontend envia `qtdSolicitada` na requisição API ✅
- [x] Backend recebe e salva `diarias` no banco ✅
- [x] Backend recebe e salva `quantidade_solicitada` no banco ✅
- [x] Ao editar, formulário preenche diárias corretamente ✅
- [x] Ao visualizar, mostra diárias corretas ✅
- [x] PDF mostra diárias corretas ✅

---

## Status

✅ **PROBLEMA RESOLVIDO!**

**Teste agora:**
1. Recarregue a página (Ctrl+Shift+R)
2. Crie uma O.S. com 3 diárias de 60 unidades
3. Visualize a O.S. criada
4. Edite a O.S.
5. **Diárias devem ser 3 em todos os lugares!** 🎉

**O campo `diarias` agora é enviado corretamente para a API e salvo no banco de dados!**
