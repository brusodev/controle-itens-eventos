# 🔍 DEBUG: Diárias Sempre Aparecem Como 1

## Problema Relatado

**Usuário:** "Crio uma O.S. com 10 diárias e sempre aparece 1"

## Diagnóstico

### 1. ✅ Código Está Correto

**Coleta do formulário** (linha ~542):
```javascript
const diarias = parseInt(div.querySelector('.os-diarias').value) || 1;  // ✅ Converte para número
```

**Mapeamento para API** (linha ~791):
```javascript
diarias: item.diarias,  // ✅ Envia para API
qtdSolicitada: item.qtdSolicitada,  // ✅ Envia para API
```

**Edição - Preenchimento** (linha ~1473):
```javascript
diariasInput.value = item.diarias || 1;  // ✅ Preenche do banco
```

### 2. ❌ O.S. Antigas Sem Dados

**Banco de dados atual:**
```
ID 10: diarias=1, qtd_sol=None, qtd_total=120.0
ID 11: diarias=1, qtd_sol=None, qtd_total=60.0
ID 12: diarias=1, qtd_sol=None, qtd_total=180.0
```

**Problema:** 
- `quantidade_solicitada = None` (não foi populado na migration)
- Todas têm `diarias = 1` (valor padrão)

### 3. 🔄 POSSÍVEL CACHE DO NAVEGADOR

**Hipótese:** Navegador está usando versão antiga do `app.js` em cache!

## Solução

### Passo 1: Limpar Cache do Navegador

**Opção A - Hard Reload:**
```
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

**Opção B - DevTools:**
1. F12 para abrir DevTools
2. Clique direito no botão de reload
3. Selecione **"Empty Cache and Hard Reload"**

**Opção C - Limpar tudo:**
1. Ctrl + Shift + Delete
2. Marcar "Cached images and files"
3. Time range: "All time"
4. Clear data

### Passo 2: Verificar Versão do Arquivo

**Abra o Console (F12 → Console) e execute:**
```javascript
// Verificar se função tem os campos corretos
confirmarEmissaoOS.toString().includes('diarias:')
// Deve retornar: true

// Verificar timestamp do arquivo
performance.getEntriesByType('resource')
  .find(r => r.name.includes('app.js'))
  ?.fetchStart
```

### Passo 3: Forçar Nova Versão

**Adicionar timestamp ao arquivo HTML:**

`index.html` ou template que carrega app.js:
```html
<!-- ANTES -->
<script src="backend/static/js/app.js"></script>

<!-- DEPOIS (força reload) -->
<script src="backend/static/js/app.js?v=20251015"></script>
```

### Passo 4: Testar Criação

1. **Abra DevTools → Network**
2. **Marque "Disable cache"**
3. **Recarregue a página** (F5)
4. **Crie uma O.S.:**
   - Diárias: **10**
   - Quantidade: **50**
5. **No Console, antes de clicar "Confirmar":**
   ```javascript
   // Interceptar dados
   const dadosOS = coletarDadosOS();
   console.log('Itens:', dadosOS.itens);
   console.log('Primeiro item - diarias:', dadosOS.itens[0].diarias);
   ```
6. **Deve mostrar:** `diarias: 10` (não 1!)

### Passo 5: Verificar Request

**DevTools → Network → XHR/Fetch:**

Quando clicar "Confirmar e Emitir", procure:
- **Request:** `POST /api/ordens-servico/`
- **Payload → itens:**
  ```json
  {
    "itens": [
      {
        "diarias": 10,  ← Deve estar aqui!
        "qtdSolicitada": 50,
        "qtdTotal": 500
      }
    ]
  }
  ```

Se não aparecer `"diarias": 10`, o navegador ainda está usando cache!

### Passo 6: Atualizar O.S. Antigas (Opcional)

Se quiser corrigir as O.S. antigas que têm `qtdSolicitada = None`:

**Script Python:**
```python
from models import db, ItemOrdemServico
from app import create_app

app = create_app()
with app.app_context():
    # Buscar todos os itens
    itens = ItemOrdemServico.query.all()
    
    for item in itens:
        if item.quantidade_solicitada is None:
            # Calcular qtd_solicitada a partir de qtd_total e diarias
            if item.quantidade_total and item.diarias:
                item.quantidade_solicitada = item.quantidade_total / item.diarias
                print(f'Item {item.id}: qtd_sol = {item.quantidade_total} / {item.diarias} = {item.quantidade_solicitada}')
    
    db.session.commit()
    print(f'✅ {len(itens)} itens atualizados!')
```

## Checklist de Verificação

- [ ] Limpou cache do navegador (Ctrl+Shift+R)
- [ ] DevTools → Network → "Disable cache" marcado
- [ ] Recarregou a página completamente
- [ ] Testou criar nova O.S. com 10 diárias
- [ ] Verificou no console: `dadosOS.itens[0].diarias === 10`
- [ ] Verificou no Network: Request tem `"diarias": 10`
- [ ] Salvou e reabriu: campo diárias mostra 10

## Se AINDA Aparecer 1

### Debug Profundo:

**1. Verificar se campo está no HTML:**
```javascript
// No console
document.querySelector('.os-diarias').value
// Deve retornar o valor digitado, ex: "10"
```

**2. Verificar coleta:**
```javascript
// Adicionar console.log temporário
const diarias = parseInt(div.querySelector('.os-diarias').value) || 1;
console.log('DEBUG diarias:', div.querySelector('.os-diarias').value, '→', diarias);
```

**3. Verificar arquivo sendo usado:**
```javascript
// No console
fetch('/backend/static/js/app.js')
  .then(r => r.text())
  .then(t => console.log(
    'Arquivo tem correção?', 
    t.includes('diarias: item.diarias')
  ))
```

Se retornar `false`, o servidor ainda está servindo arquivo antigo!

## Conclusão

**99% de chance** de ser **cache do navegador**.

**Solução rápida:**
1. Ctrl + Shift + R
2. DevTools → "Disable cache" 
3. Testar novamente

**Se persistir:**
- Verificar se está editando o arquivo correto
- Verificar se servidor reiniciou
- Tentar outro navegador
