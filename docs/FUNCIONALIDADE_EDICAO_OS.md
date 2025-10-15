# ✏️ Funcionalidade de Edição de Ordens de Serviço

## Implementação Completa

### 🎯 Objetivo

Permitir editar Ordens de Serviço já emitidas, atualizando automaticamente o estoque (revertendo a quantidade antiga e aplicando a nova).

## Funcionalidades Implementadas

### 1. ✅ Backend - Rota PUT

**Arquivo:** `backend/routes/os_routes.py`

**Rota:** `PUT /api/ordens-servico/<id>`

**Funcionamento:**

```python
@os_bp.route('/<int:os_id>', methods=['PUT'])
def atualizar_ordem(os_id):
    """Atualiza uma ordem de serviço existente"""
    
    # 1. Buscar O.S. existente
    os = OrdemServico.query.get_or_404(os_id)
    
    # 2. REVERTER estoque dos itens antigos
    for item_os in os.itens:
        reverter_estoque_item(...)
    
    # 3. Deletar itens antigos
    for item_os in os.itens:
        db.session.delete(item_os)
    
    # 4. Atualizar dados principais
    os.contrato = dados.get('contrato')
    os.detentora = dados.get('detentora')
    # ... outros campos
    
    # 5. Adicionar NOVOS itens
    for item_os_data in dados.get('itens', []):
        # Criar novo ItemOrdemServico
        # Atualizar estoque com nova quantidade
    
    # 6. Commit
    db.session.commit()
```

**Processo de Atualização do Estoque:**

```
ANTES DA EDIÇÃO:
Item A: 100 unidades no estoque, 50 usadas na O.S.
Estoque disponível: 50 unidades

DURANTE A EDIÇÃO:
1. Reverter: Estoque += 50 (volta para 100)
2. Aplicar nova qtd: Estoque -= 30 (fica com 70)

DEPOIS DA EDIÇÃO:
Item A: 70 unidades disponíveis, 30 usadas na O.S.
```

### 2. ✅ API Client

**Arquivo:** `backend/static/js/api-client.js`

```javascript
static async atualizarOrdemServico(id, dados) {
    return this.request(`/ordens-servico/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados)
    });
}
```

### 3. ✅ Frontend - Botão de Editar

**Arquivo:** `backend/static/js/app.js`

**Na listagem de O.S.:**

```javascript
<div class="item-footer">
    <button onclick="visualizarOSEmitida(${os.id})">👁️ Visualizar</button>
    <button onclick="editarOS(${os.id})">✏️ Editar</button>  // ⬅️ NOVO
    <button onclick="imprimirOS(${os.id})">🖨️ Imprimir</button>
    <button onclick="baixarPDFOS(${os.id})">📄 PDF</button>
</div>
```

### 4. ✅ Função de Edição

**Fluxo da função `editarOS(osId)`:**

```javascript
async function editarOS(osId) {
    // 1. Buscar O.S. no array local
    const os = ordensServico.find(o => o.id === osId);
    
    // 2. Definir que estamos editando
    osEditandoId = osId;
    
    // 3. Mudar para aba de emissão
    document.querySelector('[data-tab="emitir-os"]').click();
    
    // 4. Preencher todos os campos do formulário
    document.getElementById('os-contrato-num').value = os.contrato;
    document.getElementById('os-detentora').value = os.detentora;
    // ... todos os outros campos
    
    // 5. Adicionar itens dinamicamente
    for (const item of os.itens) {
        await adicionarItemOS();
        // Preencher categoria, item, quantidade
    }
    
    // 6. Mudar texto do botão
    submitBtn.textContent = '💾 Atualizar O.S.';
    
    // 7. Adicionar botão "Cancelar Edição"
}
```

### 5. ✅ Função de Cancelar

```javascript
function cancelarEdicaoOS() {
    osEditandoId = null;
    
    // Limpar formulário
    document.getElementById('form-emitir-os').reset();
    document.getElementById('itens-os').innerHTML = '';
    
    // Restaurar botão
    submitBtn.textContent = '✅ Emitir O.S.';
    
    // Remover botão de cancelar
    cancelBtn.remove();
}
```

### 6. ✅ Confirmação (Criação ou Atualização)

**Modificação em `confirmarEmissaoOS()`:**

```javascript
async function confirmarEmissaoOS() {
    const dadosOS = coletarDadosOS();
    const dadosAPI = { ... }; // Mapear dados
    
    // Verificar se é criação ou atualização
    if (osEditandoId) {
        // ⬅️ MODO EDIÇÃO
        await APIClient.atualizarOrdemServico(osEditandoId, dadosAPI);
        alert('O.S. atualizada com sucesso! Estoque recalculado.');
        
        // Limpar estado de edição
        osEditandoId = null;
        submitBtn.textContent = '✅ Emitir O.S.';
        cancelBtn.remove();
        
    } else {
        // ⬅️ MODO CRIAÇÃO
        await APIClient.criarOrdemServico(dadosAPI);
        alert('O.S. emitida com sucesso! Estoque atualizado.');
    }
    
    // Recarregar dados
    await renderizarAlimentacao();
    await renderizarOrdensServico();
}
```

### 7. ✅ Estilos CSS

**Botão Warning (Amarelo):**

```css
.btn-warning {
    background: #ffc107;
    color: #000;
}

.btn-warning:hover {
    background: #e0a800;
}
```

## Fluxo de Uso

### Criando uma Nova O.S.

```
1. Usuário → "📄 Emitir O.S." (aba)
2. Preenche formulário
3. Clica "✅ Emitir O.S."
4. Sistema cria O.S. e atualiza estoque
```

### Editando uma O.S. Existente

```
1. Usuário → "📋 Ordens de Serviço" (aba)
2. Clica "✏️ Editar" em uma O.S.
3. Sistema:
   - Muda para aba "Emitir O.S."
   - Preenche formulário com dados existentes
   - Mostra botão "💾 Atualizar O.S."
   - Mostra botão "❌ Cancelar Edição"
4. Usuário edita campos necessários
5. Clica "💾 Atualizar O.S."
6. Sistema:
   - Reverte estoque antigo
   - Atualiza dados da O.S.
   - Aplica novo estoque
   - Mostra mensagem de sucesso
```

## Exemplo de Edição de Estoque

### Cenário: Editar quantidade de Coffee Break

**ANTES DA EDIÇÃO:**
- O.S. #5: 50 unidades de Coffee Break Tipo 1
- Estoque Região 1: 200 inicial, 50 gasto → 150 disponível

**USUÁRIO EDITA PARA 80 UNIDADES:**

**Processo Backend:**
1. Reverter estoque antigo:
   ```python
   reverter_estoque_item('coffee_break_bebidas_quentes', '1', 50)
   # Estoque gasto: 50 - 50 = 0
   # Disponível: 150 + 50 = 200
   ```

2. Atualizar dados da O.S.:
   ```python
   os.itens[0].quantidade_total = 80
   ```

3. Aplicar novo estoque:
   ```python
   atualizar_estoque_item('coffee_break_bebidas_quentes', '1', 80)
   # Estoque gasto: 0 + 80 = 80
   # Disponível: 200 - 80 = 120
   ```

**DEPOIS DA EDIÇÃO:**
- O.S. #5: 80 unidades de Coffee Break Tipo 1
- Estoque Região 1: 200 inicial, 80 gasto → 120 disponível

## Variáveis de Controle

### `osEditandoId`

**Tipo:** `number | null`

**Propósito:** Armazena o ID da O.S. sendo editada

**Estados:**
- `null` = Modo criação (novo)
- `number` = Modo edição (ID da O.S.)

**Uso:**
```javascript
// Ao iniciar edição
osEditandoId = 5;

// Ao confirmar/cancelar
osEditandoId = null;

// Ao verificar modo
if (osEditandoId) {
    // Está editando
} else {
    // Está criando nova
}
```

## Interface do Usuário

### Botões na Listagem

| Botão | Cor | Ação |
|-------|-----|------|
| 👁️ Visualizar | Azul | Abre modal de preview |
| ✏️ Editar | Amarelo | Carrega dados no formulário |
| 🖨️ Imprimir | Verde | Abre janela de impressão |
| 📄 PDF | Cinza | Baixa PDF da O.S. |

### Botões no Formulário

**Modo Criação:**
- ✅ Emitir O.S. (Verde)

**Modo Edição:**
- 💾 Atualizar O.S. (Verde)
- ❌ Cancelar Edição (Vermelho)

## Arquivos Modificados

1. **backend/routes/os_routes.py**
   - Adicionada rota `PUT /api/ordens-servico/<id>`
   - Função `atualizar_ordem()`

2. **backend/static/js/api-client.js**
   - Método `atualizarOrdemServico(id, dados)`

3. **backend/static/js/app.js**
   - Variável `osEditandoId`
   - Função `editarOS(osId)`
   - Função `cancelarEdicaoOS()`
   - Modificação em `confirmarEmissaoOS()`
   - Botão "✏️ Editar" na listagem

4. **backend/static/css/styles.css**
   - Classes `.btn-warning` e `.btn-warning:hover`

## Testando

### 1. Criar uma O.S.

```
1. Aba "📄 Emitir O.S."
2. Preencher formulário:
   - Contrato: 014/DA/2024
   - Detentora: AMBP
   - CNPJ: 08.472.572/0001-85
   - Evento: Teste
   - Adicionar item: Coffee Break Tipo 1 - 50 unidades
3. "✅ Emitir O.S."
4. Verificar estoque atualizado (50 unidades gastas)
```

### 2. Editar a O.S.

```
1. Aba "📋 Ordens de Serviço"
2. Localizar a O.S. criada
3. Clicar "✏️ Editar"
4. Verificar:
   ✓ Mudou para aba "Emitir O.S."
   ✓ Todos os campos preenchidos
   ✓ Itens carregados
   ✓ Botão mostra "💾 Atualizar O.S."
   ✓ Botão "❌ Cancelar Edição" visível
5. Editar quantidade: 50 → 80
6. Clicar "💾 Atualizar O.S."
7. Verificar:
   ✓ Mensagem "O.S. atualizada com sucesso!"
   ✓ Estoque recalculado (80 unidades gastas)
   ✓ Formulário limpo
   ✓ Voltou ao modo criação
```

### 3. Cancelar Edição

```
1. Clicar "✏️ Editar" em uma O.S.
2. Fazer algumas alterações
3. Clicar "❌ Cancelar Edição"
4. Verificar:
   ✓ Formulário limpo
   ✓ Botão voltou para "✅ Emitir O.S."
   ✓ Botão "Cancelar" removido
   ✓ Sem alterações salvas
```

## Limitações Conhecidas

### 1. Campos Não Salvos no Banco

Ao editar uma O.S., os seguintes campos **NÃO** são salvos:
- Data da Assinatura
- Prazo de Vigência
- Serviço
- Grupo
- Horário do Evento

Eles aparecem no formulário durante edição, mas não são persistidos no banco de dados.

**Solução:** Ver documento `TEMPLATE_COMPLETO_OS.md` para adicionar esses campos ao modelo.

### 2. Valores Monetários

O campo `valorUnit` (preço unitário) não é armazenado. Na edição, o valor padrão será R$ 0,00.

**Solução:** Ver documento `CORRECAO_ERRO_VISUALIZACAO.md` para adicionar campo de valor ao modelo.

## Melhorias Futuras (Opcionais)

- [ ] Histórico de alterações (audit log)
- [ ] Confirmação antes de editar ("Deseja realmente editar?")
- [ ] Visualizar diferenças (diff) entre versão antiga e nova
- [ ] Permissões (só gestor pode editar)
- [ ] Bloquear edição após X dias
- [ ] Notificação por email ao editar

## Status

✅ **Funcionalidade de Edição Implementada e Testada!**

- Rota PUT no backend ✅
- Método no APIClient ✅
- Botão "Editar" na listagem ✅
- Carregar dados no formulário ✅
- Atualização de estoque automática ✅
- Cancelar edição ✅
- UI/UX intuitiva ✅
