# 🎨 Melhorias no Layout da Ordem de Serviço

## Alterações Implementadas

### 1. ✅ Logo Timbrado.png na Lateral Esquerda

**Antes:** Emoji 🏛️ centralizado no topo

**Depois:** Imagem `timbrado.png` posicionada na lateral esquerda

```javascript
// app.js - gerarPreviewOS()
<div class="os-header">
    <img src="/static/timbrado.png" alt="Logo" class="os-logo-img">
    <div class="os-title">
        <h2>GOVERNO DO ESTADO DE SÃO PAULO</h2>
        // ...
    </div>
</div>
```

```css
/* styles.css */
.os-header {
    display: flex;              /* Layout flexível */
    align-items: flex-start;
    gap: 15px;
}

.os-logo-img {
    width: 80px;
    height: auto;
    flex-shrink: 0;             /* Não encolhe */
}

.os-title {
    flex-grow: 1;               /* Ocupa espaço disponível */
    text-align: center;
}
```

### 2. ✅ Justificativa Corrigida (Campo Vazio)

**Problema:** `dados.justificativa.replace()` falhava quando justificativa era `undefined`

**Solução:** Proteção com valor padrão vazio

```javascript
// ANTES
<div class="os-justificativa">${dados.justificativa.replace(/\n/g, '<br>')}</div>

// DEPOIS
<div class="os-justificativa">${(dados.justificativa || '').replace(/\n/g, '<br>')}</div>
```

Agora aceita:
- `dados.justificativa` = texto normal ✅
- `dados.justificativa` = `undefined` ✅ (exibe vazio)
- `dados.justificativa` = `null` ✅ (exibe vazio)
- `dados.justificativa` = `""` ✅ (exibe vazio)

### 3. ✅ Layout Reduzido e Otimizado

#### Reduções de Tamanho

| Elemento | Antes | Depois | Redução |
|----------|-------|--------|---------|
| Fonte base | 14px | 11px | -21% |
| Tabela de itens | 8px padding | 4px padding | -50% |
| Cabeçalho título | 16px | 14px | -12% |
| Justificativa | 0.85em | 10px | -15% |
| Espaçamentos | 30px | 10-20px | -33% |
| Assinaturas | width: 300px | width: 250px | -17% |

#### Tabela de Itens Simplificada

**Antes:** 8 colunas
- Nº, DESCRIÇÃO, ITEM BEC, DIÁRIAS, QTD SOLICITADA, QTD TOTAL, VALOR UNIT., VALOR

**Depois:** 6 colunas
- Nº (5%), DESCRIÇÃO (40%), UNIDADE (10%), QTD (15%), VALOR UNIT. (15%), TOTAL (15%)

```javascript
<thead>
    <tr>
        <th style="width: 5%;">Nº</th>
        <th style="width: 40%;">DESCRIÇÃO</th>
        <th style="width: 10%;">UNIDADE</th>
        <th style="width: 15%;">QTD</th>
        <th style="width: 15%;">VALOR UNIT.</th>
        <th style="width: 15%;">TOTAL</th>
    </tr>
</thead>
```

**Colunas removidas:**
- ❌ ITEM BEC - Não armazenado no banco
- ❌ DIÁRIAS - Não armazenado no banco
- ❌ QTD SOLICITADA - Redundante (igual a QTD TOTAL)

#### Informações do Contrato Simplificadas

**Antes:** Tabela grande com 5 linhas
- CONTRATO Nº, DATA DA ASSINATURA, PRAZO DE VIGÊNCIA, DETENTORA, SERVIÇO, CNPJ, GRUPO

**Depois:** Tabela compacta com 3 linhas
```javascript
<table class="os-table">
    <tr>
        <td style="width: 25%;"><strong>CONTRATO Nº:</strong></td>
        <td colspan="3">${dados.contratoNum || ''}</td>
    </tr>
    <tr>
        <td><strong>DETENTORA:</strong></td>
        <td colspan="3">${dados.detentora}</td>
    </tr>
    <tr>
        <td><strong>CNPJ:</strong></td>
        <td>${dados.cnpj}</td>
        <td style="width: 25%;"><strong>EVENTO:</strong></td>
        <td>${dados.evento}</td>
    </tr>
</table>
```

### 4. ✅ Melhorias Visuais

#### Justificativa com Fundo

```css
.os-justificativa {
    border: 1px solid #ddd;
    background-color: #f9f9f9;  /* Fundo cinza claro */
    min-height: 60px;           /* Altura mínima */
    padding: 8px;
}
```

#### Cabeçalho da Tabela Destacado

```css
.os-items-table thead {
    background-color: #e0e0e0;  /* Cinza mais escuro */
    font-weight: bold;
}
```

#### Nomes em Negrito nas Assinaturas

```javascript
<p><strong>${dados.gestor}</strong></p>
<p>Gestor do Contrato</p>
```

#### Caixa de Informações Mais Discreta

```css
.os-info-box {
    border: 1px solid #000;     /* Antes: 2px */
    padding: 5px 8px;           /* Antes: 10px */
    font-size: 10px;            /* Reduzido */
}
```

### 5. ✅ Modal Ajustado

```css
.modal-large {
    max-width: 850px;           /* Antes: 900px */
}

.os-preview {
    max-height: 75vh;           /* Mais espaço vertical */
    overflow-y: auto;
    padding: 10px;
}
```

## Comparação Visual

### Cabeçalho

**ANTES:**
```
                    🏛️
    GOVERNO DO ESTADO DE SÃO PAULO
  SECRETARIA DE ESTADO DA EDUCAÇÃO
     DEPARTAMENTO DE ADMINISTRAÇÃO
         ORDEM DE SERVIÇO
                                    ┌─────────────────────┐
                                    │ DATA DE EMISSÃO:... │
                                    │ NÚMERO: 001/2025    │
                                    └─────────────────────┘
```

**DEPOIS:**
```
[LOGO]  GOVERNO DO ESTADO DE SÃO PAULO        ┌──────────────┐
        SECRETARIA DE ESTADO DA EDUCAÇÃO      │ DATA: ...    │
        DEPARTAMENTO DE ADMINISTRAÇÃO         │ Nº: 001/2025 │
        ORDEM DE SERVIÇO                      └──────────────┘
```

### Documento Completo

**Redução estimada de páginas:** ~30%
- Fontes menores
- Espaçamentos reduzidos
- Informações consolidadas
- Tabela mais compacta

## Benefícios

✅ **Mais Profissional** - Logo oficial no lugar de emoji
✅ **Mais Compacto** - Cabe melhor em uma página A4
✅ **Mais Legível** - Layout organizado com hierarquia visual
✅ **Sem Erros** - Justificativa protegida contra valores vazios
✅ **Mais Rápido** - Menos dados para renderizar e converter em PDF

## Arquivos Modificados

1. **backend/static/js/app.js**
   - `gerarPreviewOS()` - HTML do documento
   - Adicionada imagem `<img src="/static/timbrado.png">`
   - Tabela simplificada (8 → 6 colunas)
   - Proteção justificativa: `(dados.justificativa || '')`
   - Informações do contrato consolidadas

2. **backend/static/css/styles.css**
   - `.os-header` - flex layout para logo lateral
   - `.os-logo-img` - tamanho da imagem (80px)
   - `.os-document` - fonte base 11px
   - `.os-items-table` - fonte 9px, padding reduzido
   - `.os-justificativa` - fundo cinza, borda
   - `.os-section` - margens reduzidas
   - `.modal-large` - 850px (antes 900px)
   - `.os-preview` - altura 75vh com scroll

3. **backend/static/timbrado.png**
   - Copiado da raiz do projeto para `backend/static/`

## Testando

1. **Atualizar página** (F5 ou Ctrl+R)
2. **Criar ou visualizar uma O.S.**
3. **Verificar:**
   - ✅ Logo aparece na lateral esquerda
   - ✅ Justificativa não dá erro (mesmo vazia)
   - ✅ Documento mais compacto
   - ✅ Tabela com 6 colunas
   - ✅ Layout cabe melhor na tela

## Próximas Melhorias (Opcionais)

- [ ] Adicionar quebra de página automática no PDF
- [ ] Permitir upload de logo personalizado
- [ ] Opção de exportar em tamanho A4 exato
- [ ] Visualização em modo impressão antes de gerar PDF
