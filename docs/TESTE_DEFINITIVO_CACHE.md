# 🔍 TESTE DEFINITIVO: Cache vs Banco de Dados

## Situação Atual

- ✅ "Editar" carrega dados corretos (busca do banco)
- ❌ "Visualizar" mostra dados antigos (possível cache)

---

## TESTE PASSO A PASSO

### 1. Verificar o Banco de Dados

Execute este comando:

```bash
cd C:\Users\bruno.vargas\Desktop\PROJETOS\controle-itens-eventos\backend
.\venv\Scripts\python.exe test_edicao_interface.py
```

**Anote o resultado:**
- Evento no banco: `________________`

### 2. Recarregar Página COM LIMPEZA DE CACHE

```
Ctrl + Shift + Delete

OU

Ctrl + Shift + R (hard reload)
```

### 3. Abrir Console do Navegador

```
F12 → Console
```

### 4. Ir para "Ordens de Serviço"

Observe a **listagem**:
- Qual evento está mostrando no card? `________________`

### 5. Clicar em "👁️ Visualizar"

**No Console, você verá:**
```
🔍 visualizarOSEmitida chamado com ID: 1
📡 Dados recebidos da API: {...}
📋 Evento da API: _________________
📋 Justificativa da API: _________________
🔄 Dados normalizados - Evento: _________________
✅ Preview HTML gerado - contém evento? true/false
```

**No Modal:**
- Evento mostrado: `________________`

### 6. Comparar

| Fonte | Evento |
|-------|--------|
| Banco de dados (teste Python) | ? |
| API (console - "Evento da API") | ? |
| Modal (visível na tela) | ? |

---

## Possíveis Cenários

### Cenário A: Todos Diferentes

```
Banco: "EDIÇÃO INTERFACE - 1760366380"
API:   "TESTE SINC - 1760365733"
Modal: "Conviva"
```

**Problema:** Múltiplas fontes desincronizadas  
**Causa:** Cache em vários níveis

### Cenário B: Banco = API, mas Modal diferente

```
Banco: "EDIÇÃO INTERFACE - 1760366380"
API:   "EDIÇÃO INTERFACE - 1760366380"
Modal: "TESTE SINC - 1760365733"
```

**Problema:** Bug na função `gerarPreviewOS()`  
**Causa:** HTML sendo gerado com dados errados

### Cenário C: Todos iguais

```
Banco: "EDIÇÃO INTERFACE - 1760366380"
API:   "EDIÇÃO INTERFACE - 1760366380"
Modal: "EDIÇÃO INTERFACE - 1760366380"
```

**Situação:** ✅ Tudo funcionando!  
**Problema:** Apenas a listagem mostra dados antigos (cache visual)

---

## Se Modal Mostrar Dados Antigos

### Execute no Console:

```javascript
// Teste 1: API direta
fetch('http://127.0.0.1:5100/api/ordens-servico/1')
    .then(r => r.json())
    .then(data => {
        console.log('=== TESTE API DIRETA ===');
        console.log('Evento:', data.evento);
        console.log('Justificativa:', data.justificativa);
        console.log('Dados completos:', data);
    });

// Teste 2: Função de visualização
visualizarOSEmitida(1);
```

---

## Solução Baseada no Resultado

### Se API retorna dados CORRETOS mas Modal mostra ANTIGOS:

**Problema está em:** `normalizarDadosOS()` ou `gerarPreviewOS()`

**Verificar:**
```javascript
// No console
const os = await APIClient.obterOrdemServico(1);
console.log('Original:', os.evento);

const norm = normalizarDadosOS(os);
console.log('Normalizado:', norm.evento);

const html = gerarPreviewOS(norm);
console.log('HTML contém?', html.includes(os.evento));
```

### Se API retorna dados ANTIGOS:

**Problema está em:** Cache do servidor ou banco não atualizado

**Verificar:**
1. Servidor Flask reiniciou?
2. Commit no banco foi feito?
3. Transação foi finalizada?

---

## Próximos Passos

**Execute o teste e me envie:**

1. ✅ Output do `test_edicao_interface.py`
2. ✅ Screenshot ou texto do console ao clicar "Visualizar"
3. ✅ Texto que aparece no modal
4. ✅ Se possível, screenshot da tela completa

Com essas informações, vou identificar EXATAMENTE onde está o problema!
