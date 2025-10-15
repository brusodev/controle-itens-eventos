# 🐛 Correção: Erro ao Visualizar/Gerar PDF de O.S.

## Problemas Identificados

### 1. Erro ao Visualizar
```
Cannot read properties of undefined (reading 'toFixed')
at app.js:640:57
```

**Causa:** Os dados vindos da API têm estrutura diferente dos dados originais do formulário.

### 2. Erro ao Gerar PDF
```
Incomplete or corrupt PNG file
Cannot read properties of undefined (reading 'target')
```

**Causa:** Funções não normalizavam dados antes de gerar preview e código duplicado na função.

## Diferenças entre Dados do Formulário vs. API

| Campo Formulário | Campo API | Presente no DB |
|-----------------|-----------|----------------|
| `contratoNum` | `contrato` | ✅ |
| `gestor` | `gestorContrato` | ✅ |
| `fiscal` | `fiscalContrato` | ✅ |
| `dataEvento` | `data` | ✅ |
| `dataEmissao` | `dataEmissaoCompleta` | ✅ |
| `valorUnit` | - | ❌ **NÃO** |
| `diarias` | - | ❌ **NÃO** |
| `itemBec` | - | ❌ **NÃO** |
| `qtdSolicitada` | - | ❌ **NÃO** |
| `num` | - | ❌ **NÃO** |

### Campos de Itens no Banco

O modelo `ItemOrdemServico` armazena apenas:
- `item_id` (FK para tabela itens)
- `categoria`
- `item_codigo`
- `descricao`
- `unidade`
- `quantidade_total`

**Campos NÃO armazenados:**
- `valorUnit` (preço unitário)
- `diarias`
- `itemBec` (natureza da despesa)
- `qtdSolicitada`
- `num` (número sequencial)

## Correções Aplicadas

### 1. ✅ Função `normalizarDadosOS()`

Criada para converter dados da API para formato esperado pelo preview:

```javascript
function normalizarDadosOS(os) {
    // Normaliza os dados da O.S. para o formato esperado pelo preview
    return {
        numeroOS: os.numeroOS,
        contratoNum: os.contrato || os.contratoNum,
        detentora: os.detentora,
        cnpj: os.cnpj,
        evento: os.evento,
        dataEvento: os.data || os.dataEvento,
        local: os.local,
        justificativa: os.justificativa,
        gestor: os.gestorContrato || os.gestor,
        fiscal: os.fiscalContrato || os.fiscal,
        dataEmissao: os.dataEmissaoCompleta || os.dataEmissao || new Date().toLocaleDateString('pt-BR'),
        // Campos opcionais do template
        dataAssinatura: os.dataAssinatura || '',
        prazoVigencia: os.prazoVigencia || '',
        servico: os.servico || 'Alimentação',
        grupo: os.grupo || '',
        itens: (os.itens || []).map((item, index) => ({
            num: item.num || index + 1,
            descricao: item.descricao,
            itemBec: item.itemBec || '',
            diarias: item.diarias || 1,
            qtdSolicitada: item.qtdSolicitada || item.qtdTotal,
            qtdTotal: item.qtdTotal,
            valorUnit: item.valorUnit || 0,  // ⚠️ Padrão: R$ 0,00
            unidade: item.unidade
        }))
    };
}
```

### 2. ✅ Atualização das Funções

**visualizarOSEmitida():**
```javascript
function visualizarOSEmitida(osId) {
    const os = ordensServico.find(o => o.id === osId);
    if (!os) return;
    
    const dadosNormalizados = normalizarDadosOS(os);  // ✨ Normaliza
    const preview = gerarPreviewOS(dadosNormalizados);
    document.getElementById('preview-os').innerHTML = preview;
    // ...
}
```

**imprimirOS():**
```javascript
function imprimirOS(osId) {
    const os = ordensServico.find(o => o.id === osId);
    if (!os) return;
    
    const dadosNormalizados = normalizarDadosOS(os);  // ✨ Normaliza
    const preview = gerarPreviewOS(dadosNormalizados);
    // ...
}
```

**baixarPDFOS():**
```javascript
async function baixarPDFOS(osId) {
    const os = ordensServico.find(o => o.id === osId);
    if (!os) return;
    
    try {
        const btn = event && event.target ? event.target : null;  // ✨ Proteção
        // ...
        
        const dadosNormalizados = normalizarDadosOS(os);  // ✨ Normaliza
        const preview = gerarPreviewOS(dadosNormalizados);
        
        // Criar elemento temporário para renderizar
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '210mm';
        tempDiv.innerHTML = `<div class="os-preview">${preview}</div>`;
        document.body.appendChild(tempDiv);
        
        const previewElement = tempDiv.querySelector('.os-preview');
        
        // Aguardar renderização
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // html2canvas...
        const canvas = await html2canvas(previewElement, {...});
        
        // Remover elemento temporário
        document.body.removeChild(tempDiv);  // ✨ Limpar
        
        // Gerar PDF...
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Erro ao gerar PDF. Tente novamente.');
        
        // Restaurar botão em caso de erro
        if (event && event.target) {
            event.target.innerHTML = '📥 Baixar PDF';
            event.target.disabled = false;
        }
    }
}
```

## ⚠️ Limitação Conhecida

**Valores monetários não são armazenados no banco de dados!**

Quando uma O.S. é carregada da API, o campo `valorUnit` será sempre **R$ 0,00**.

### Por que isso acontece?

O modelo `ItemOrdemServico` não tem campo para armazenar preço unitário. Foi projetado apenas para registrar **QUANTIDADES**.

### Soluções Possíveis

#### Opção 1: Adicionar campo valor_unitario ao modelo

```python
# backend/models.py
class ItemOrdemServico(db.Model):
    # ... campos existentes
    valor_unitario = db.Column(db.Float, default=0.0)
```

**Prós:**
- Mantém histórico de preços
- Valores corretos no PDF

**Contras:**
- Requer migração do banco de dados
- Dados históricos perderão valores

#### Opção 2: Não exibir valores monetários

Remover colunas de valor do preview:

```javascript
// Remover estas linhas do template
<td>R$ ${item.valorUnit.toFixed(2)}</td>
<td>R$ ${(item.valorUnit * item.qtdTotal).toFixed(2)}</td>
// ... VALOR TOTAL
```

**Prós:**
- Não requer alteração no banco
- Sistema funciona para controle de estoque

**Contras:**
- Perde informação de custo na O.S.

#### Opção 3: Adicionar tabela de preços

Criar tabela `precos_itens` com histórico:

```python
class PrecoItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('itens.id'))
    valor_unitario = db.Column(db.Float)
    data_vigencia = db.Column(db.DateTime)
    ativo = db.Column(db.Boolean, default=True)
```

**Prós:**
- Mantém histórico completo de preços
- Permite consultar valor na data da O.S.

**Contras:**
- Mais complexo de implementar
- Requer interface para gerenciar preços

## Status

✅ **Problemas de Visualização Resolvidos!**

- Função `normalizarDadosOS()` criada ✅
- `visualizarOSEmitida()` normaliza dados ✅
- `imprimirOS()` normaliza dados ✅
- `baixarPDFOS()` normaliza dados e protege contra erros ✅
- Elemento temporário criado para PDF ✅
- Código duplicado removido ✅
- Arquivo `timbrado.png` copiado para `backend/static/` ✅

⚠️ **Limitação:** Valores monetários aparecem como R$ 0,00 em O.S. carregadas do banco (campo não existe no modelo).

## Testando

1. **Criar nova O.S.** - Valores aparecerão corretamente (dados do formulário)
2. **Visualizar O.S. criada** - Valores aparecerão como R$ 0,00 (dados do banco)
3. **Gerar PDF** - Deve funcionar sem erros, mas valores serão R$ 0,00

## Próximos Passos (Opcional)

Se precisar dos valores monetários no histórico, escolha uma das opções acima e implemente.
