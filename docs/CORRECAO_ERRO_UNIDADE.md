# 🐛 Correção: Erro ao Emitir O.S. - Campo 'unidade'

## Problema Identificado

**Erro:** `Erro ao emitir O.S.: 'unidade'`

### Causa Raiz

O sistema estava falhando ao criar Ordens de Serviço porque:

1. **Frontend não enviava o campo `unidade`** - A função `coletarDadosOS()` não incluía a unidade do item
2. **Backend esperava o campo obrigatório** - A rota `/api/ordens-servico/` tentava acessar `item_os_data['unidade']`
3. **Mapeamento de campos incorreto** - Os campos enviados pelo frontend não correspondiam aos esperados pela API

## Correções Aplicadas

### 1. ✅ Frontend - Adicionar campo `unidade` aos itens

**Arquivo:** `backend/static/js/app.js`

**Linha ~520:**

```javascript
// ANTES
itensOS.push({
    num: index + 1,
    descricao: item.descricao,
    itemBec: dadosAlimentacao[categoria].natureza,
    // ... outros campos
});

// DEPOIS
itensOS.push({
    num: index + 1,
    descricao: item.descricao,
    unidade: item.unidade,  // ✨ ADICIONADO
    itemBec: dadosAlimentacao[categoria].natureza,
    // ... outros campos
});
```

### 2. ✅ Backend - Tornar campo `unidade` opcional

**Arquivo:** `backend/routes/os_routes.py`

**Linha ~73:**

```python
# ANTES
unidade=item_os_data['unidade'],

# DEPOIS
unidade=item_os_data.get('unidade', 'Unidade'),  # ✨ Valor padrão
```

### 3. ✅ Frontend - Mapear campos corretamente para API

**Arquivo:** `backend/static/js/app.js`

**Função:** `confirmarEmissaoOS()`

```javascript
// ANTES
const novaOS = await APIClient.criarOrdemServico(dadosOS);

// DEPOIS
const dadosAPI = {
    numeroOS: dadosOS.numeroOS,
    contrato: dadosOS.contratoNum,        // Mapeado
    detentora: dadosOS.detentora,
    cnpj: dadosOS.cnpj,
    evento: dadosOS.evento,
    data: dadosOS.dataEvento,             // Mapeado
    local: dadosOS.local,
    justificativa: dadosOS.justificativa,
    gestorContrato: dadosOS.gestor,       // Mapeado
    fiscalContrato: dadosOS.fiscal,       // Mapeado
    itens: dadosOS.itens.map(item => ({
        categoria: item.categoria,
        itemId: item.itemId,
        descricao: item.descricao,
        unidade: item.unidade,
        qtdTotal: item.qtdTotal
    }))
};

const novaOS = await APIClient.criarOrdemServico(dadosAPI);
```

## Mapeamento de Campos

### Formato Frontend → API

| Campo Frontend | Campo API | Tipo |
|----------------|-----------|------|
| `numeroOS` | `numeroOS` | string |
| `contratoNum` | `contrato` | string |
| `detentora` | `detentora` | string |
| `cnpj` | `cnpj` | string |
| `evento` | `evento` | string |
| `dataEvento` | `data` | string |
| `local` | `local` | string |
| `justificativa` | `justificativa` | text |
| `gestor` | `gestorContrato` | string |
| `fiscal` | `fiscalContrato` | string |

### Formato de Itens

```javascript
// Frontend
{
    num: 1,
    descricao: "Coffee Break Tipo 1",
    unidade: "Pessoa",
    itemBec: "339039",
    diarias: 1,
    qtdSolicitada: 50,
    qtdTotal: 50,
    valorUnit: 25.60,
    categoria: "coffee_break_bebidas_quentes",
    itemId: "1"
}

// API (após mapeamento)
{
    categoria: "coffee_break_bebidas_quentes",
    itemId: "1",
    descricao: "Coffee Break Tipo 1",
    unidade: "Pessoa",
    qtdTotal: 50
}
```

## Testando a Correção

1. **Acesse o sistema:** http://localhost:5100
2. **Vá na aba "📄 Emitir O.S."**
3. **Preencha os campos:**
   - Número do Contrato
   - Detentora
   - CNPJ
   - Evento
   - Data do Evento
   - Local
   - Justificativa
   - Gestor
   - Fiscal
4. **Adicione itens:**
   - Selecione categoria
   - Selecione item
   - Informe quantidade
5. **Clique em "Emitir Ordem de Serviço"**
6. **Resultado esperado:**
   ```
   ✅ O.S. emitida com sucesso! Estoque atualizado.
   ```

## Log do Servidor

Após a correção, você deve ver no terminal do Flask:

```
127.0.0.1 - - [13/Oct/2025 XX:XX:XX] "POST /api/ordens-servico/ HTTP/1.1" 201 -
127.0.0.1 - - [13/Oct/2025 XX:XX:XX] "GET /api/alimentacao/ HTTP/1.1" 200 -
127.0.0.1 - - [13/Oct/2025 XX:XX:XX] "GET /api/ordens-servico/ HTTP/1.1" 200 -
```

**Status 201** = O.S. criada com sucesso!

## Verificar no Banco

```sql
SELECT * FROM ordens_servico ORDER BY id DESC LIMIT 1;
SELECT * FROM itens_ordem_servico WHERE ordem_servico_id = (SELECT MAX(id) FROM ordens_servico);
```

## Prevenção de Erros Futuros

### Validação no Frontend

Adicionar validação antes de enviar:

```javascript
// Verificar se todos os itens têm unidade
const itensInvalidos = dadosAPI.itens.filter(item => !item.unidade);
if (itensInvalidos.length > 0) {
    alert('Erro: Alguns itens não possuem unidade definida.');
    return;
}
```

### Validação no Backend

```python
# Validar dados obrigatórios
if not item_os_data.get('categoria'):
    return jsonify({'erro': 'Campo categoria é obrigatório'}), 400
if not item_os_data.get('itemId'):
    return jsonify({'erro': 'Campo itemId é obrigatório'}), 400
if not item_os_data.get('descricao'):
    return jsonify({'erro': 'Campo descricao é obrigatório'}), 400
```

## Erro Adicional: item_id NULL

### Problema

```
NOT NULL constraint failed: itens_ordem_servico.item_id
[parameters: (1, None, 'kit_lanche', '1', 'Kit Lanche', 'Pessoa', 20.0)]
```

**Causa:** O campo `item_id` é uma chave estrangeira que referencia a tabela `itens`. O backend não estava buscando o ID do item antes de criar o registro.

### Correção 4: Buscar item_id no banco

**Arquivo:** `backend/routes/os_routes.py`

```python
# ANTES
for item_os_data in dados.get('itens', []):
    item_os = ItemOrdemServico(
        ordem_servico_id=os.id,
        categoria=item_os_data['categoria'],
        item_codigo=item_os_data['itemId'],
        # ... item_id estava None
    )

# DEPOIS
for item_os_data in dados.get('itens', []):
    # Buscar o item no banco de dados
    item = Item.query.filter_by(item_codigo=item_os_data['itemId']).first()
    if not item:
        db.session.rollback()
        return jsonify({'erro': f'Item {item_os_data["itemId"]} não encontrado'}), 404
    
    item_os = ItemOrdemServico(
        ordem_servico_id=os.id,
        item_id=item.id,  # ✨ ID do item no banco
        categoria=item_os_data['categoria'],
        item_codigo=item_os_data['itemId'],
        # ...
    )
```

## Status

✅ **Problema Resolvido!**

- Frontend envia campo `unidade` ✅
- Backend aceita `unidade` como opcional ✅
- Mapeamento de campos correto ✅
- **Backend busca `item_id` no banco antes de inserir** ✅
- Sistema funcionando normalmente ✅

## Problemas Adicionais Corrigidos

Veja também: [CORRECAO_ERRO_VISUALIZACAO.md](CORRECAO_ERRO_VISUALIZACAO.md)

- Erro ao visualizar O.S. (campos undefined) ✅
- Erro ao gerar PDF (dados não normalizados) ✅
- Função `normalizarDadosOS()` criada ✅

⚠️ **Limitação:** Valores monetários não são armazenados no banco de dados. O.S. carregadas da API exibirão R$ 0,00 nos valores.
