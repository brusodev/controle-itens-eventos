# 🔧 Implementação: Campo DIÁRIAS na Ordem de Serviço

## Objetivo

Adicionar a coluna **DIÁRIAS** (multiplicador) na tabela de itens da O.S. para exibição no PDF.

---

## Mudanças Implementadas

### 1. ✅ Migration do Banco de Dados

**Arquivo:** `backend/migrate_add_diarias.py`

Criado script de migração para adicionar a coluna `diarias` na tabela `itens_ordem_servico`:

```python
# Adiciona coluna diarias (INTEGER, padrão 1)
ALTER TABLE itens_ordem_servico ADD COLUMN diarias INTEGER DEFAULT 1

# Atualiza registros existentes
UPDATE itens_ordem_servico SET diarias = 1 WHERE diarias IS NULL
```

**Status:** ✅ Executada com sucesso

```
============================================================
MIGRAÇÃO: Adicionar diarias em itens_ordem_servico
============================================================
✅ Coluna 'diarias' adicionada com sucesso!
   - Tipo: INTEGER
   - Valor padrão: 1
✅ Registros existentes atualizados com diarias = 1
============================================================
```

---

### 2. ✅ Atualização do Modelo

**Arquivo:** `backend/models.py`

**Classe:** `ItemOrdemServico`

#### Adicionada Coluna:
```python
class ItemOrdemServico(db.Model):
    __tablename__ = 'itens_ordem_servico'
    
    id = db.Column(db.Integer, primary_key=True)
    ordem_servico_id = db.Column(db.Integer, db.ForeignKey('ordens_servico.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('itens.id'), nullable=False)
    
    categoria = db.Column(db.String(100))
    item_codigo = db.Column(db.String(20))
    item_bec = db.Column(db.String(50))
    descricao = db.Column(db.String(200))
    unidade = db.Column(db.String(50))
    diarias = db.Column(db.Integer, default=1)  # ✅ NOVA COLUNA
    quantidade_total = db.Column(db.Float)
```

#### Atualizado Método `to_dict()`:
```python
def to_dict(self):
    return {
        'id': self.id,
        'categoria': self.categoria,
        'itemId': self.item_codigo,
        'itemBec': self.item_bec,
        'descricao': self.descricao,
        'unidade': self.unidade,
        'diarias': self.diarias or 1,  # ✅ ADICIONADO
        'qtdTotal': self.quantidade_total
    }
```

---

### 3. ✅ Atualização da API

**Arquivo:** `backend/routes/os_routes.py`

#### Rota POST `/api/ordens-servico` (Criar O.S.):
```python
item_os = ItemOrdemServico(
    ordem_servico_id=os.id,
    item_id=item.id,
    categoria=item_os_data['categoria'],
    item_codigo=item_os_data['itemId'],
    item_bec=item_os_data.get('itemBec', ''),
    descricao=item_os_data['descricao'],
    unidade=item_os_data.get('unidade', 'Unidade'),
    diarias=item_os_data.get('diarias', 1),  # ✅ ADICIONADO
    quantidade_total=item_os_data['qtdTotal']
)
```

#### Rota PUT `/api/ordens-servico/{id}` (Editar O.S.):
```python
item_os = ItemOrdemServico(
    ordem_servico_id=os.id,
    item_id=item.id,
    categoria=item_os_data['categoria'],
    item_codigo=item_os_data['itemId'],
    item_bec=item_os_data.get('itemBec', ''),
    descricao=item_os_data['descricao'],
    unidade=item_os_data.get('unidade', 'Unidade'),
    diarias=item_os_data.get('diarias', 1),  # ✅ ADICIONADO
    quantidade_total=item_os_data['qtdTotal']
)
```

---

### 4. ✅ Atualização do Gerador de PDF

**Arquivo:** `backend/pdf_generator.py`

#### Cabeçalho da Tabela (Adicionada coluna DIÁRIAS):

**ANTES:**
```python
header = [
    Paragraph('<b>Nº</b>', self.styles['CustomLabel']),
    Paragraph('<b>ITEM BEC</b>', self.styles['CustomLabel']),
    Paragraph('<b>DESCRIÇÃO</b>', self.styles['CustomLabel']),
    Paragraph('<b>UNIDADE</b>', self.styles['CustomLabel']),
    Paragraph('<b>QTD</b>', self.styles['CustomLabel']),
    Paragraph('<b>VALOR UNIT.</b>', self.styles['CustomLabel']),
    Paragraph('<b>TOTAL</b>', self.styles['CustomLabel'])
]
```

**DEPOIS:**
```python
header = [
    Paragraph('<b>Nº</b>', self.styles['CustomLabel']),
    Paragraph('<b>ITEM BEC</b>', self.styles['CustomLabel']),
    Paragraph('<b>DESCRIÇÃO</b>', self.styles['CustomLabel']),
    Paragraph('<b>UNIDADE</b>', self.styles['CustomLabel']),
    Paragraph('<b>DIÁRIAS</b>', self.styles['CustomLabel']),  # ✅ ADICIONADO
    Paragraph('<b>QTD</b>', self.styles['CustomLabel']),
    Paragraph('<b>VALOR UNIT.</b>', self.styles['CustomLabel']),
    Paragraph('<b>TOTAL</b>', self.styles['CustomLabel'])
]
```

#### Linhas da Tabela (Adicionado valor de diárias):

**ANTES:**
```python
for idx, item in enumerate(dados.get('itens', []), 1):
    qtd = float(item.get('qtdTotal', 0))
    valor_unit = 25.60
    total_item = qtd * valor_unit
    valor_total += total_item
    
    row = [
        Paragraph(str(idx), self.styles['CustomNormal']),
        Paragraph(str(item.get('itemBec', '')), self.styles['CustomNormal']),
        Paragraph(item.get('descricao', ''), self.styles['CustomNormal']),
        Paragraph(item.get('unidade', ''), self.styles['CustomNormal']),
        Paragraph(str(qtd), self.styles['CustomNormal']),
        Paragraph(f'R$ {valor_unit:.2f}', self.styles['CustomNormal']),
        Paragraph(f'R$ {total_item:.2f}', self.styles['CustomNormal'])
    ]
```

**DEPOIS:**
```python
for idx, item in enumerate(dados.get('itens', []), 1):
    diarias = int(item.get('diarias', 1))  # ✅ ADICIONADO
    qtd = float(item.get('qtdTotal', 0))
    valor_unit = 25.60
    total_item = qtd * valor_unit
    valor_total += total_item
    
    row = [
        Paragraph(str(idx), self.styles['CustomNormal']),
        Paragraph(str(item.get('itemBec', '')), self.styles['CustomNormal']),
        Paragraph(item.get('descricao', ''), self.styles['CustomNormal']),
        Paragraph(item.get('unidade', ''), self.styles['CustomNormal']),
        Paragraph(str(diarias), self.styles['CustomNormal']),  # ✅ ADICIONADO
        Paragraph(str(qtd), self.styles['CustomNormal']),
        Paragraph(f'R$ {valor_unit:.2f}', self.styles['CustomNormal']),
        Paragraph(f'R$ {total_item:.2f}', self.styles['CustomNormal'])
    ]
```

#### Largura das Colunas (Ajustada para 8 colunas):

**ANTES:**
```python
table = Table(data, colWidths=[10*mm, 20*mm, 60*mm, 20*mm, 15*mm, 25*mm, 25*mm])
```

**DEPOIS:**
```python
table = Table(data, colWidths=[10*mm, 20*mm, 55*mm, 18*mm, 15*mm, 15*mm, 25*mm, 25*mm])
```

**Ajustes:**
- Nº: 10mm (mantido)
- ITEM BEC: 20mm (mantido)
- DESCRIÇÃO: 60mm → **55mm** (reduzido 5mm)
- UNIDADE: 20mm → **18mm** (reduzido 2mm)
- **DIÁRIAS: 15mm** (nova coluna)
- QTD: 15mm (mantido)
- VALOR UNIT.: 25mm (mantido)
- TOTAL: 25mm (mantido)

#### Linha de Total (Ajustada para 8 colunas):

**ANTES:**
```python
total_row = [
    '', '', '', '', '',
    Paragraph('<b>VALOR TOTAL:</b>', self.styles['CustomLabel']),
    Paragraph(f'<b>R$ {valor_total:.2f}</b>', self.styles['CustomLabel'])
]
```

**DEPOIS:**
```python
total_row = [
    '', '', '', '', '', '',  # ✅ Mais uma célula vazia
    Paragraph('<b>VALOR TOTAL:</b>', self.styles['CustomLabel']),
    Paragraph(f'<b>R$ {valor_total:.2f}</b>', self.styles['CustomLabel'])
]
```

---

### 5. ✅ Frontend (Já Implementado)

**Arquivo:** `backend/static/js/app.js`

O frontend **já estava enviando** o campo `diarias` corretamente:

#### HTML do Input:
```javascript
// Linha 467
<input type="number" class="os-diarias flex-1" placeholder="Diárias" min="1" value="1">
```

#### Captura do Valor:
```javascript
// Linha 542
const diarias = div.querySelector('.os-diarias').value;
```

#### Inclusão no Objeto de Item:
```javascript
// Linha 551
itensOS.push({
    num: index + 1,
    descricao: item.descricao,
    unidade: item.unidade,
    itemBec: dadosAlimentacao[categoria].natureza,
    diarias: diarias || 1,  // ✅ Já enviava!
    qtdSolicitada: quantidade,
    qtdTotal: (diarias || 1) * quantidade,
    valorUnit: 25.60,
    categoria,
    itemId
});
```

**Conclusão:** O frontend já estava preparado, só faltava o backend salvar e o PDF exibir!

---

## Fluxo de Dados Completo

### 1. Preenchimento do Formulário
```
Usuário preenche:
- Item: "Kit Lanche"
- Diárias: 3
- Quantidade: 50

JavaScript calcula:
qtdTotal = diarias * quantidade = 3 * 50 = 150
```

### 2. Envio para API
```json
{
  "itens": [
    {
      "categoria": "coffee_break_bebidas_quentes",
      "itemId": "336030",
      "descricao": "Kit Lanche",
      "unidade": "Pessoa",
      "itemBec": "5",
      "diarias": 3,
      "qtdSolicitada": 50,
      "qtdTotal": 150
    }
  ]
}
```

### 3. Salvamento no Banco
```sql
INSERT INTO itens_ordem_servico (
    ordem_servico_id, item_id, categoria, item_codigo, 
    item_bec, descricao, unidade, diarias, quantidade_total
) VALUES (
    1, 42, 'coffee_break_bebidas_quentes', '336030',
    '5', 'Kit Lanche', 'Pessoa', 3, 150
)
```

### 4. Geração do PDF
```
Tabela de Itens:
┌────┬──────────┬─────────────┬─────────┬─────────┬─────┬──────────────┬─────────┐
│ Nº │ ITEM BEC │ DESCRIÇÃO   │ UNIDADE │ DIÁRIAS │ QTD │ VALOR UNIT.  │ TOTAL   │
├────┼──────────┼─────────────┼─────────┼─────────┼─────┼──────────────┼─────────┤
│ 1  │ 5        │ Kit Lanche  │ Pessoa  │ 3       │ 150 │ R$ 25,60     │ R$ 3.840│
└────┴──────────┴─────────────┴─────────┴─────────┴─────┴──────────────┴─────────┘
```

---

## Validação

### Checklist de Testes:

#### ✅ Teste 1: Criar Nova O.S.
- [ ] Preencher formulário de O.S.
- [ ] Adicionar item com diárias = 3
- [ ] Salvar O.S.
- [ ] Gerar PDF
- [ ] **Verificar:** Coluna DIÁRIAS aparece com valor 3

#### ✅ Teste 2: Editar O.S. Existente
- [ ] Abrir O.S. antiga (criada antes da migration)
- [ ] Verificar que diárias = 1 (valor padrão)
- [ ] Editar e alterar diárias para 2
- [ ] Salvar
- [ ] Gerar PDF
- [ ] **Verificar:** Coluna DIÁRIAS aparece com valor 2

#### ✅ Teste 3: Visualização
- [ ] Criar O.S. com diárias variadas (1, 2, 3)
- [ ] Clicar em "👁️ Visualizar"
- [ ] **Verificar:** Modal mostra todas as informações (incluindo diárias, se exibido)
- [ ] Gerar PDF
- [ ] **Verificar:** PDF mostra coluna DIÁRIAS corretamente

#### ✅ Teste 4: Múltiplos Itens
- [ ] Criar O.S. com 3+ itens
- [ ] Item 1: diárias = 1
- [ ] Item 2: diárias = 2
- [ ] Item 3: diárias = 5
- [ ] Salvar e gerar PDF
- [ ] **Verificar:** Cada item mostra sua diária corretamente

---

## Resultado Esperado no PDF

### Antes (7 colunas):
```
┌────┬──────────┬──────────────────┬─────────┬─────┬──────────────┬─────────┐
│ Nº │ ITEM BEC │ DESCRIÇÃO        │ UNIDADE │ QTD │ VALOR UNIT.  │ TOTAL   │
├────┼──────────┼──────────────────┼─────────┼─────┼──────────────┼─────────┤
│ 1  │ 336030   │ Kit Lanche       │ Pessoa  │ 80  │ R$ 0,00      │ R$ 0,00 │
│ 2  │ 336030   │ Água mineral     │ Unidade │ 80  │ R$ 0,00      │ R$ 0,00 │
└────┴──────────┴──────────────────┴─────────┴─────┴──────────────┴─────────┘
```

### Depois (8 colunas):
```
┌────┬──────────┬──────────────────┬─────────┬─────────┬─────┬──────────────┬─────────┐
│ Nº │ ITEM BEC │ DESCRIÇÃO        │ UNIDADE │ DIÁRIAS │ QTD │ VALOR UNIT.  │ TOTAL   │
├────┼──────────┼──────────────────┼─────────┼─────────┼─────┼──────────────┼─────────┤
│ 1  │ 336030   │ Kit Lanche       │ Pessoa  │ 1       │ 80  │ R$ 0,00      │ R$ 0,00 │
│ 2  │ 336030   │ Água mineral     │ Unidade │ 1       │ 80  │ R$ 0,00      │ R$ 0,00 │
└────┴──────────┴──────────────────┴─────────┴─────────┴─────┴──────────────┴─────────┘
                                                  ↑
                                         NOVA COLUNA
```

---

## Arquivos Modificados

### Backend:
1. ✅ `backend/models.py` - Adicionada coluna `diarias`
2. ✅ `backend/routes/os_routes.py` - Salvamento do campo `diarias`
3. ✅ `backend/pdf_generator.py` - Exibição da coluna DIÁRIAS no PDF
4. ✅ `backend/migrate_add_diarias.py` - Script de migration (NOVO)

### Frontend:
- ✅ `backend/static/js/app.js` - **Já implementado** (sem alterações necessárias)

---

## Compatibilidade com Dados Antigos

### O.S. criadas ANTES da migration:
- ✅ Migration define `diarias = 1` como padrão
- ✅ Todas as O.S. antigas terão `diarias = 1`
- ✅ PDF mostrará "1" na coluna DIÁRIAS
- ✅ Comportamento idêntico ao anterior (1 × qtd = qtd)

### O.S. criadas DEPOIS da migration:
- ✅ Campo `diarias` vem do formulário
- ✅ Salvamento no banco funcional
- ✅ PDF mostra valor real (1, 2, 3, etc.)

---

## Observações Técnicas

### Tipo de Dado:
- **Backend:** `INTEGER` (banco SQLite)
- **Python:** `int` (conversão automática)
- **JavaScript:** `number` (input type="number")

### Valor Padrão:
- **Banco:** `DEFAULT 1`
- **Frontend:** `value="1"` (input)
- **Backend:** `.get('diarias', 1)` (fallback)

### Cálculo da Quantidade Total:
```javascript
// Frontend (app.js, linha 556)
qtdTotal: (diarias || 1) * quantidade

// Exemplo:
// diarias = 3, quantidade = 50
// qtdTotal = 3 * 50 = 150
```

**Importante:** O campo `qtdTotal` é o que será usado no cálculo de estoque e valores. A coluna DIÁRIAS no PDF é apenas **informativa** para mostrar o multiplicador usado.

---

## Status Final

### ✅ Implementação Completa:
- [x] Coluna adicionada no banco de dados
- [x] Modelo atualizado
- [x] API salvando campo `diarias`
- [x] PDF exibindo coluna DIÁRIAS
- [x] Migration executada com sucesso
- [x] Registros antigos atualizados (diarias = 1)
- [x] Frontend já estava preparado

### 🎯 Pronto para Uso!

Reinicie o servidor Flask e teste criando/editando uma O.S. com valores diferentes de diárias! 🚀
