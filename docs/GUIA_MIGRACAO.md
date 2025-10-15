# 🔄 Guia de Migração - Frontend para Backend Flask

Este guia mostra como migrar o frontend atual (que usa localStorage e itens.json) para consumir o backend Flask.

## 📋 Pré-requisitos

1. ✅ Backend Flask instalado e rodando (ver `backend/README.md`)
2. ✅ Dados migrados para SQLite (`python migrate_data.py`)
3. ✅ Servidor rodando em `http://localhost:5000`

## 🔧 Passo a Passo

### 1. Adicionar o APIClient ao HTML

No `index.html`, adicione o script ANTES do `app.js`:

```html
<!-- Antes do app.js -->
<script src="api-client.js"></script>
<script src="app.js"></script>
```

### 2. Modificações no app.js

#### 2.1 Remover carregamento do localStorage

**Antes:**
```javascript
let ordensServico = JSON.parse(localStorage.getItem('ordensServico')) || [];
let proximoIdOS = parseInt(localStorage.getItem('proximoIdOS')) || 1;
let dadosAlimentacao = JSON.parse(localStorage.getItem('dadosAlimentacao')) || null;
```

**Depois:**
```javascript
let ordensServico = [];
let proximoIdOS = 1;
let dadosAlimentacao = null;
```

#### 2.2 Atualizar renderizarAlimentacao()

**Antes:**
```javascript
async function renderizarAlimentacao() {
    if (!dadosAlimentacao) {
        const response = await fetch('itens.json');
        const dados = await response.json();
        dadosAlimentacao = dados.alimentacao;
        localStorage.setItem('dadosAlimentacao', JSON.stringify(dadosAlimentacao));
    }
    // ...
}
```

**Depois:**
```javascript
async function renderizarAlimentacao() {
    try {
        dadosAlimentacao = await APIClient.listarAlimentacao();
        // ... resto do código
    } catch (error) {
        alert('Erro ao carregar dados de alimentação: ' + error.message);
    }
}
```

#### 2.3 Atualizar editarItemAlimentacao()

**Antes:**
```javascript
function salvarEdicaoAlimentacao() {
    // ... código de coleta
    
    // Salvar no localStorage
    localStorage.setItem('dadosAlimentacao', JSON.stringify(dadosAlimentacao));
}
```

**Depois:**
```javascript
async function salvarEdicaoAlimentacao() {
    // ... código de coleta
    
    try {
        // Encontrar o item e obter seu ID do banco
        const item = dadosAlimentacao[categoriaAtual].itens.find(
            i => i.item === itemIdAtual
        );
        
        // Atualizar via API
        await APIClient.atualizarEstoqueItem(item.id, regioes);
        
        // Recarregar dados
        await renderizarAlimentacao();
        alert('Estoque atualizado com sucesso!');
    } catch (error) {
        alert('Erro ao salvar: ' + error.message);
    }
}
```

#### 2.4 Atualizar confirmarEmissaoOS()

**Antes:**
```javascript
function confirmarEmissaoOS() {
    // ... criar OS
    ordensServico.push(os);
    
    // ... atualizar estoque localmente
    
    // Salvar no localStorage
    localStorage.setItem('ordensServico', JSON.stringify(ordensServico));
    localStorage.setItem('proximoIdOS', proximoIdOS);
    localStorage.setItem('dadosAlimentacao', JSON.stringify(dadosAlimentacao));
}
```

**Depois:**
```javascript
async function confirmarEmissaoOS() {
    const dadosOS = coletarDadosOS();
    if (!dadosOS) return;
    
    try {
        // Criar O.S. via API (já atualiza estoque no backend)
        const novaOS = await APIClient.criarOrdemServico(dadosOS);
        
        alert('O.S. emitida com sucesso! Estoque atualizado.');
        document.getElementById('form-emitir-os').reset();
        fecharModalVisualizarOS();
        
        // Recarregar dados
        await renderizarAlimentacao();
        await renderizarOrdensServico();
        renderizarEmitirOS();
        
    } catch (error) {
        alert('Erro ao emitir O.S.: ' + error.message);
    }
}
```

#### 2.5 Atualizar renderizarOrdensServico()

**Antes:**
```javascript
function renderizarOrdensServico() {
    const lista = document.getElementById('lista-os');
    const busca = document.getElementById('busca-os').value.toLowerCase();
    
    const osFiltradas = ordensServico.filter(os => {
        return os.numeroOS.toLowerCase().includes(busca) ||
               os.evento.toLowerCase().includes(busca) ||
               os.detentora.toLowerCase().includes(busca);
    });
    // ...
}
```

**Depois:**
```javascript
async function renderizarOrdensServico() {
    const lista = document.getElementById('lista-os');
    const busca = document.getElementById('busca-os').value.toLowerCase();
    
    try {
        ordensServico = await APIClient.listarOrdensServico(busca);
        
        if (ordensServico.length === 0) {
            lista.innerHTML = '<p class="empty-message">Nenhuma ordem de serviço encontrada.</p>';
            return;
        }
        
        lista.innerHTML = ordensServico.map(os => `
            <!-- ... HTML do card -->
        `).join('');
        
    } catch (error) {
        lista.innerHTML = '<p class="error-message">Erro ao carregar ordens de serviço.</p>';
    }
}
```

### 3. Atualizar event listeners

Adicione `async` nas funções que fazem chamadas à API:

```javascript
// Busca de O.S.
document.getElementById('busca-os').addEventListener('input', async () => {
    await renderizarOrdensServico();
});

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await renderizarAlimentacao();
    await renderizarOrdensServico();
    renderizarEmitirOS();
});
```

### 4. Tratamento de Erros

Adicione tratamento consistente de erros em todas as funções:

```javascript
try {
    // Chamada à API
    const resultado = await APIClient.algumMetodo();
    // Processar resultado
} catch (error) {
    console.error('Erro detalhado:', error);
    alert('Erro: ' + error.message);
}
```

## 🧪 Testando a Migração

### 1. Verificar backend rodando
```powershell
# No terminal do backend
python app.py
# Deve mostrar: Running on http://127.0.0.1:5000
```

### 2. Testar endpoints manualmente

```javascript
// No console do navegador (F12)
APIClient.listarAlimentacao().then(console.log);
APIClient.listarOrdensServico().then(console.log);
```

### 3. Testar fluxo completo
1. ✅ Visualizar itens de alimentação
2. ✅ Editar quantidades de estoque
3. ✅ Emitir uma ordem de serviço
4. ✅ Verificar atualização do estoque
5. ✅ Visualizar O.S. emitidas

## 🔍 Debugging

### Erro de CORS
Se aparecer erro de CORS no console:
- Verificar se Flask-CORS está instalado
- Verificar se `CORS(app)` está em `app.py`

### Erro 404
- Verificar se o backend está rodando
- Verificar se a URL está correta (`http://localhost:5000`)

### Dados não aparecem
- Verificar se `migrate_data.py` foi executado
- Verificar se o banco `controle_itens.db` existe
- Testar endpoint direto no navegador: `http://localhost:5000/api/alimentacao/`

## 📊 Vantagens da Migração

✅ **Consistência**: Dados centralizados no banco
✅ **Confiabilidade**: Transações ACID do SQLite
✅ **Escalabilidade**: Fácil adicionar novas funcionalidades
✅ **Auditoria**: Possível adicionar logs de todas as operações
✅ **Multi-usuário**: Preparado para múltiplos usuários simultâneos
✅ **Backup**: Simples fazer backup do arquivo .db

## 🚀 Próximos Passos

1. ⬜ Implementar autenticação de usuários
2. ⬜ Adicionar logs de auditoria (quem alterou o quê)
3. ⬜ Criar dashboard com gráficos
4. ⬜ Exportar relatórios em Excel/PDF
5. ⬜ Notificações de estoque baixo
6. ⬜ Deploy em servidor de produção
