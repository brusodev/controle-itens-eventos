# 🐛 DEBUG: PDF com Dados Antigos

**Status:** 🔍 Em investigação  
**Sintoma:** Modal mostra dados corretos, mas PDF gerado contém dados antigos

---

## Teste de Depuração Adicionado

### Logs no Console do Navegador

Foram adicionados `console.log()` na função `baixarPDFOS()` para rastrear o fluxo:

```javascript
async function baixarPDFOS(osId) {
    console.log('🔍 baixarPDFOS chamado com osId:', osId);
    
    const os = await APIClient.obterOrdemServico(osId);
    console.log('📡 Dados recebidos da API:', os);
    console.log('📋 Evento:', os.evento);
    console.log('📋 Justificativa:', os.justificativa);
    
    const dadosNormalizados = normalizarDadosOS(os);
    console.log('🔄 Dados normalizados:', dadosNormalizados);
    console.log('📋 Evento normalizado:', dadosNormalizados.evento);
    
    const preview = gerarPreviewOS(dadosNormalizados);
    console.log('📄 Preview HTML gerado:', preview.substring(0, 500));
    
    // ... continua gerando PDF
}
```

---

## Instruções de Teste

### 1. Recarregar Página (Limpar Cache do Navegador)

```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### 2. Abrir Console do Navegador

```
F12 → Aba "Console"
```

### 3. Testar Visualização

1. Acesse: http://127.0.0.1:5100/
2. Vá para "Ordens de Serviço"
3. Clique "👁️ Visualizar" na O.S. #1/2025

**Verifique no modal:**
- Evento deve mostrar: `TESTE SINC - 1760365733`

### 4. Testar Geração de PDF

1. No modal, clique "📥 Baixar PDF"
2. **OBSERVE O CONSOLE** - deve mostrar:

```
🔍 baixarPDFOS chamado com osId: 1
📡 Dados recebidos da API: {id: 1, numeroOS: "1/2025", evento: "TESTE SINC - 1760365733", ...}
📋 Evento: TESTE SINC - 1760365733
📋 Justificativa: Justificativa de teste - timestamp: 1760365733
🔄 Dados normalizados: {evento: "TESTE SINC - 1760365733", ...}
📋 Evento normalizado: TESTE SINC - 1760365733
📄 Preview HTML gerado: <div class="os-document">...
```

3. Abra o PDF baixado
4. Verifique se contém: `TESTE SINC - 1760365733`

---

## Possíveis Causas (Checklist)

### ✅ API está OK
- Backend retorna dados corretos
- GET /api/ordens-servico/1 funciona

### ✅ Função baixarPDFOS() busca da API
- Código foi corrigido
- Usa `await APIClient.obterOrdemServico(osId)`

### ⚠️ Possíveis Problemas Restantes

#### 1. Cache do Navegador
**Sintoma:** JavaScript antigo ainda carregado  
**Solução:** Ctrl+Shift+R para recarregar

#### 2. Problema na Normalização
**Sintoma:** `normalizarDadosOS()` usa campo errado  
**Como verificar:** 
- Ver logs do console
- Comparar `os.evento` vs `dadosNormalizados.evento`

#### 3. Problema no HTML Preview
**Sintoma:** `gerarPreviewOS()` usa dados antigos de outra fonte  
**Como verificar:**
- Ver HTML gerado no console
- Procurar texto antigo no HTML

#### 4. Multiple Calls
**Sintoma:** Função sendo chamada com ID errado  
**Como verificar:**
- Ver `osId` no primeiro log
- Deve ser `1` (número)

---

## Teste no Console do Navegador

Execute este código no console (F12):

```javascript
// Teste 1: Verificar se APIClient funciona
async function teste1() {
    console.log('=== TESTE 1: API Client ===');
    const os = await APIClient.obterOrdemServico(1);
    console.log('Dados:', os);
    console.log('Evento:', os.evento);
    return os;
}

// Teste 2: Verificar normalização
async function teste2() {
    console.log('=== TESTE 2: Normalização ===');
    const os = await APIClient.obterOrdemServico(1);
    const norm = normalizarDadosOS(os);
    console.log('Original evento:', os.evento);
    console.log('Normalizado evento:', norm.evento);
    return norm;
}

// Teste 3: Verificar preview HTML
async function teste3() {
    console.log('=== TESTE 3: Preview HTML ===');
    const os = await APIClient.obterOrdemServico(1);
    const norm = normalizarDadosOS(os);
    const preview = gerarPreviewOS(norm);
    console.log('HTML contém evento?', preview.includes(os.evento));
    console.log('Procurar no HTML:', os.evento);
    
    // Mostrar parte do HTML que contém evento
    const idx = preview.indexOf('Evento:');
    if (idx > -1) {
        console.log('Trecho do HTML:', preview.substring(idx, idx + 200));
    }
    return preview;
}

// Executar todos
async function testarTudo() {
    await teste1();
    console.log('\n');
    await teste2();
    console.log('\n');
    await teste3();
}

testarTudo();
```

---

## Análise de Resultados

### Se logs mostram dados CORRETOS mas PDF tem dados ANTIGOS:

**Possível causa:** Problema no `html2canvas` ou `jsPDF`
- HTML temporário pode estar pegando CSS/dados de outro lugar
- Imagem sendo gerada antes do DOM atualizar completamente

**Solução:** Aumentar timeout antes de gerar canvas:

```javascript
// Linha ~1076 em app.js
await new Promise(resolve => setTimeout(resolve, 300));  // ← Aumentar para 1000
```

### Se logs mostram dados ANTIGOS:

**Possível causa:** Cache do navegador
- JavaScript antigo ainda carregado
- Service Worker cacheando versão antiga

**Solução:**
1. Ctrl+Shift+R (hard reload)
2. Limpar cache: DevTools → Application → Clear Storage
3. Desabilitar cache: DevTools → Network → "Disable cache"

### Se `osId` está errado nos logs:

**Possível causa:** Botão passando ID incorreto

**Verificar em:** `visualizarOSEmitida()` linha ~865:
```javascript
modalButtons.innerHTML = `
    <button onclick="baixarPDFOS(${osId})">📥 Baixar PDF</button>
`;
```

---

## Próximo Passo

1. **Recarregue a página com Ctrl+Shift+R**
2. **Abra Console (F12)**
3. **Clique "Visualizar" e depois "Baixar PDF"**
4. **Copie TODO o output do console**
5. **Compare:**
   - Evento nos logs: `_______`
   - Evento no PDF: `_______`

Se forem diferentes, há um bug na geração do canvas/PDF.  
Se forem iguais aos logs mas diferentes do esperado, há bug na API ou normalização.

---

## Workaround Temporário

Se o problema persistir, force um refresh mais agressivo:

```javascript
// Em baixarPDFOS(), após buscar da API:
const os = await APIClient.obterOrdemServico(osId);

// Adicionar delay maior
await new Promise(resolve => setTimeout(resolve, 1000));

const dadosNormalizados = normalizarDadosOS(os);
const preview = gerarPreviewOS(dadosNormalizados);

// Criar elemento temporário
const tempDiv = document.createElement('div');
tempDiv.innerHTML = preview;
document.body.appendChild(tempDiv);

// Esperar MAIS tempo para DOM atualizar
await new Promise(resolve => setTimeout(resolve, 1000));  // ← AUMENTAR

// Então gerar canvas...
```

---

**Aguardando resultado dos logs do console para próximos passos.**
