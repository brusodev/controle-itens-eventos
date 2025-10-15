# 🐛 Correção: PDF e Impressão Não Refletiam Alterações

## Problema Identificado

Após editar uma O.S. e clicar em "Atualizar O.S.", ao tentar visualizar, imprimir ou baixar PDF, os dados mostrados eram **antigos** (antes da edição).

### Causa Raiz

As funções `visualizarOSEmitida()`, `imprimirOS()` e `baixarPDFOS()` estavam buscando dados do array local `ordensServico`, que é carregado apenas uma vez e não é atualizado automaticamente após edições.

```javascript
// ❌ ANTES (INCORRETO)
function visualizarOSEmitida(osId) {
    const os = ordensServico.find(o => o.id === osId);  // ⬅️ Dados em cache
    // ...
}

function imprimirOS(osId) {
    const os = ordensServico.find(o => o.id === osId);  // ⬅️ Dados em cache
    // ...
}

async function baixarPDFOS(osId) {
    const os = ordensServico.find(o => o.id === osId);  // ⬅️ Dados em cache
    // ...
}
```

### Fluxo do Problema

```
1. Usuário edita O.S. #5
   - Muda "Coffee Break: 50 unidades" → "80 unidades"
   
2. Backend atualiza no banco de dados ✅
   - Banco: 80 unidades (ATUALIZADO)
   - Cache local (ordensServico): 50 unidades (DESATUALIZADO)

3. Usuário clica "Visualizar" ou "Imprimir"
   - Função busca dados do cache local
   - Mostra: 50 unidades (DADOS ANTIGOS) ❌

4. Resultado: Usuário vê dados desatualizados
```

## Solução Implementada

### Buscar Dados Atualizados da API

Modificadas as três funções para buscar dados **diretamente da API** sempre que forem chamadas:

```javascript
// ✅ DEPOIS (CORRETO)
async function visualizarOSEmitida(osId) {
    try {
        // Buscar dados atualizados da API
        const os = await APIClient.obterOrdemServico(osId);  // ⬅️ Dados frescos
        if (!os) {
            alert('Ordem de Serviço não encontrada.');
            return;
        }
        
        const dadosNormalizados = normalizarDadosOS(os);
        const preview = gerarPreviewOS(dadosNormalizados);
        // ...
        
    } catch (error) {
        console.error('Erro ao visualizar O.S.:', error);
        alert('Erro ao carregar dados da O.S.');
    }
}

async function imprimirOS(osId) {
    try {
        // Buscar dados atualizados da API
        const os = await APIClient.obterOrdemServico(osId);  // ⬅️ Dados frescos
        if (!os) {
            alert('Ordem de Serviço não encontrada.');
            return;
        }
        
        const dadosNormalizados = normalizarDadosOS(os);
        const preview = gerarPreviewOS(dadosNormalizados);
        // ...
        
    } catch (error) {
        console.error('Erro ao imprimir O.S.:', error);
        alert('Erro ao carregar dados da O.S. para impressão.');
    }
}

async function baixarPDFOS(osId) {
    try {
        // Buscar dados atualizados da API
        const os = await APIClient.obterOrdemServico(osId);  // ⬅️ Dados frescos
        if (!os) {
            alert('Ordem de Serviço não encontrada.');
            return;
        }
        
        const dadosNormalizados = normalizarDadosOS(os);
        const preview = gerarPreviewOS(dadosNormalizados);
        // ...
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Erro ao gerar PDF. Tente novamente.');
        // ...
    }
}
```

### Método da API Usado

```javascript
// api-client.js
static async obterOrdemServico(id) {
    return this.request(`/ordens-servico/${id}`);
}
```

**Rota Backend:** `GET /api/ordens-servico/<id>`

**Retorna:** Dados completos e atualizados da O.S. do banco de dados

## Fluxo Corrigido

```
1. Usuário edita O.S. #5
   - Muda "Coffee Break: 50 unidades" → "80 unidades"
   
2. Backend atualiza no banco de dados ✅
   - Banco: 80 unidades (ATUALIZADO)

3. Usuário clica "Visualizar" ou "Imprimir"
   - Função faz requisição GET /api/ordens-servico/5
   - Backend retorna dados atualizados do banco
   - Mostra: 80 unidades (DADOS ATUALIZADOS) ✅

4. Resultado: Usuário vê dados corretos
```

## Comparação: Antes vs Depois

### ANTES (Cache Local)

| Ação | Fonte de Dados | Resultado |
|------|----------------|-----------|
| Editar O.S. | API (atualiza banco) | ✅ Salvo |
| Visualizar | Cache local | ❌ Antigo |
| Imprimir | Cache local | ❌ Antigo |
| Baixar PDF | Cache local | ❌ Antigo |

**Problema:** Cache local não sincroniza com banco após edições.

### DEPOIS (Buscar da API)

| Ação | Fonte de Dados | Resultado |
|------|----------------|-----------|
| Editar O.S. | API (atualiza banco) | ✅ Salvo |
| Visualizar | API (banco de dados) | ✅ Atualizado |
| Imprimir | API (banco de dados) | ✅ Atualizado |
| Baixar PDF | API (banco de dados) | ✅ Atualizado |

**Solução:** Sempre busca dados frescos do banco de dados.

## Benefícios da Solução

### 1. ✅ Dados Sempre Atualizados

- Visualização reflete últimas alterações
- Impressão usa dados corretos
- PDF gerado com informações atuais

### 2. ✅ Consistência

- Todas as funções usam a mesma fonte (API)
- Não há discrepância entre visualizações

### 3. ✅ Resiliência

- Tratamento de erros com try-catch
- Mensagens claras para o usuário

### 4. ✅ Performance Aceitável

- Requisição adicional (~100ms) é imperceptível
- Custo-benefício: dados corretos > velocidade

## Impacto na Performance

### Chamadas à API

**Antes:**
- Carregar listagem: 1 requisição
- Visualizar O.S.: 0 requisições (cache)
- **Total: 1 requisição**

**Depois:**
- Carregar listagem: 1 requisição
- Visualizar O.S.: 1 requisição (API)
- **Total: 2 requisições**

**Overhead:** +1 requisição por visualização (~50-100ms)

**Justificativa:** Prioridade é dados corretos, não velocidade.

### Otimizações Futuras (Opcional)

Se performance se tornar um problema:

1. **Atualizar cache após edição:**
```javascript
// Após atualizar O.S.
const osAtualizada = await APIClient.atualizarOrdemServico(osEditandoId, dadosAPI);

// Atualizar no cache local
const index = ordensServico.findIndex(os => os.id === osEditandoId);
if (index !== -1) {
    ordensServico[index] = osAtualizada;
}
```

2. **Invalidar cache:**
```javascript
// Marcar O.S. como "desatualizada"
ordensServico.find(os => os.id === osEditandoId)._stale = true;

// Na visualização, recarregar apenas se stale
if (os._stale) {
    os = await APIClient.obterOrdemServico(osId);
}
```

3. **Cache com TTL:**
```javascript
// Adicionar timestamp
os._lastFetch = Date.now();

// Recarregar se cache tiver mais de 5 minutos
if (Date.now() - os._lastFetch > 300000) {
    os = await APIClient.obterOrdemServico(osId);
}
```

## Cenários de Teste

### Teste 1: Visualização Após Edição

```
1. Criar O.S. com Coffee Break - 50 unidades
2. Clicar "✏️ Editar"
3. Mudar quantidade para 80
4. Clicar "💾 Atualizar O.S."
5. Clicar "👁️ Visualizar"
6. Resultado esperado: Mostra 80 unidades ✅
```

### Teste 2: Impressão Após Edição

```
1. Editar O.S. (qualquer campo)
2. Salvar alterações
3. Clicar "🖨️ Imprimir"
4. Resultado esperado: Dados atualizados na impressão ✅
```

### Teste 3: PDF Após Edição

```
1. Editar O.S. (justificativa, itens, etc.)
2. Salvar alterações
3. Clicar "📄 PDF"
4. Resultado esperado: PDF com dados atualizados ✅
```

### Teste 4: Múltiplas Edições

```
1. Editar O.S. - mudar qtd 50 → 80
2. Visualizar (deve mostrar 80) ✅
3. Editar novamente - mudar qtd 80 → 100
4. Imprimir (deve mostrar 100) ✅
5. Baixar PDF (deve mostrar 100) ✅
```

### Teste 5: Edição + Atualização da Listagem

```
1. Ter várias O.S. na listagem
2. Editar O.S. #5
3. Voltar para aba "Ordens de Serviço"
4. Visualizar O.S. #5 da listagem
5. Resultado esperado: Mostra dados atualizados ✅
```

## Arquivos Modificados

**Arquivo:** `backend/static/js/app.js`

**Funções alteradas:**

1. `visualizarOSEmitida(osId)` → `async function visualizarOSEmitida(osId)`
   - Adicionado: `await APIClient.obterOrdemServico(osId)`
   - Adicionado: `try-catch` para tratamento de erros

2. `imprimirOS(osId)` → `async function imprimirOS(osId)`
   - Adicionado: `await APIClient.obterOrdemServico(osId)`
   - Adicionado: `try-catch` para tratamento de erros

3. `baixarPDFOS(osId)` (já era async)
   - Substituído: `ordensServico.find(...)` por `await APIClient.obterOrdemServico(osId)`
   - Melhorado: Tratamento de erros

**Linhas modificadas:** ~30 linhas

**Commits sugeridos:**
```
fix: Buscar dados atualizados da API ao visualizar/imprimir O.S.

- visualizarOSEmitida() agora busca da API
- imprimirOS() agora busca da API
- baixarPDFOS() agora busca da API
- Correção: dados desatualizados após edição
```

## Status

✅ **Problema Corrigido!**

- Visualização mostra dados atualizados ✅
- Impressão usa dados atualizados ✅
- PDF gerado com dados atualizados ✅
- Tratamento de erros adicionado ✅
- Mensagens claras ao usuário ✅

## Validação

Execute os 5 cenários de teste acima para validar a correção.

**Resultado esperado:** Todas as operações (visualizar, imprimir, PDF) devem refletir as últimas alterações feitas na O.S.
