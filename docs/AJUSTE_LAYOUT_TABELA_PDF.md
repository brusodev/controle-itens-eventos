# 🎨 Ajuste de Layout: Tabela de Itens do PDF

## Mudanças Realizadas

### 1. ✅ Reordenação das Colunas

**ANTES:**
```
| Nº | ITEM BEC | DESCRIÇÃO | UNIDADE | DIÁRIAS | QTD | VALOR UNIT. | TOTAL |
```

**DEPOIS:**
```
| Nº | DESCRIÇÃO | ITEM BEC | DIÁRIAS | QTDE SOLICITADA | QTDE SOLICITADA TOTAL | VALOR UNIT. | VALOR TOTAL |
```

### 2. ✅ Cabeçalhos com Quebra de Linha

Os cabeçalhos agora usam `<br/>` para melhor formatação:

```python
Paragraph('<b>QTDE<br/>SOLICITADA</b>', self.styles['CustomLabel'])
Paragraph('<b>QTDE<br/>SOLICITADA<br/>TOTAL</b>', self.styles['CustomLabel'])
Paragraph('<b>VALOR<br/>TOTAL</b>', self.styles['CustomLabel'])
```

### 3. ✅ Cores Atualizadas

**Verde claro no cabeçalho e total:**
```python
colors.HexColor('#c6e0b4')  # Verde claro
```

**Verde muito claro nas linhas:**
```python
colors.HexColor('#e2efd9')  # Verde muito claro
```

### 4. ✅ Formatação de Números

**Números com separador de milhares:**
```python
# 2000 → 2.000
qtd_sol_fmt = f"{qtd_solicitada:,.0f}".replace(',', '.')

# R$ 51200.00 → R$ 51.200,00
f'R$ {total_item:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
```

### 5. ✅ Nova Coluna: QTDE SOLICITADA

Agora diferenciamos:
- **QTDE SOLICITADA**: Quantidade por diária (qtdSolicitada)
- **QTDE SOLICITADA TOTAL**: Quantidade total (qtdTotal = diarias × qtdSolicitada)

### 6. ✅ Larguras das Colunas Ajustadas

```python
colWidths=[
    10*mm,  # Nº
    50*mm,  # DESCRIÇÃO (aumentada)
    18*mm,  # ITEM BEC
    15*mm,  # DIÁRIAS
    20*mm,  # QTDE SOLICITADA
    20*mm,  # QTDE SOLICITADA TOTAL
    22*mm,  # VALOR UNIT.
    28*mm   # VALOR TOTAL
]
```

### 7. ✅ Alinhamentos

- **Nº**: Centro
- **DESCRIÇÃO**: Esquerda
- **ITEM BEC**: Centro
- **DIÁRIAS**: Centro
- **QTDE SOLICITADA**: Direita (números)
- **QTDE SOLICITADA TOTAL**: Direita (números)
- **VALOR UNIT.**: Direita
- **VALOR TOTAL**: Direita

---

## Comparação Visual

### ANTES:
```
┌────┬──────────┬──────────────┬─────────┬─────────┬─────┬──────────────┬─────────┐
│ Nº │ ITEM BEC │ DESCRIÇÃO    │ UNIDADE │ DIÁRIAS │ QTD │ VALOR UNIT.  │ TOTAL   │
├────┼──────────┼──────────────┼─────────┼─────────┼─────┼──────────────┼─────────┤
│ 1  │ 260568   │ Coffee Break │ Pessoa  │ 1       │ 80  │ R$ 25,60     │ R$ 2048 │
└────┴──────────┴──────────────┴─────────┴─────────┴─────┴──────────────┴─────────┘
```

### DEPOIS (Como no Print):
```
┌────┬──────────────┬──────────┬─────────┬──────────────┬──────────────────┬──────────────┬──────────────┐
│ Nº │ DESCRIÇÃO    │ ITEM BEC │ DIÁRIAS │ QTDE         │ QTDE             │ VALOR UNIT.  │ VALOR        │
│    │              │          │         │ SOLICITADA   │ SOLICITADA TOTAL │              │ TOTAL        │
├────┼──────────────┼──────────┼─────────┼──────────────┼──────────────────┼──────────────┼──────────────┤
│ 1  │Coffee Break  │ 260568   │ 1       │ 2.000        │ 2.000            │ R$ 25,60     │ R$ 51.200,00 │
│ 2  │Bebidas Qts   │ 260665   │ 1       │ 2.000        │ 2.000            │ R$ 4,50      │ R$ 9.000,00  │
│ 3  │Água Mineral  │ 291480   │ 1       │ 2.000        │ 2.000            │ R$ 5,00      │ R$ 10.000,00 │
├────┴──────────────┴──────────┴─────────┴──────────────┴──────────────────┼──────────────┼──────────────┤
│                                                         VALOR TOTAL:      │              │ R$ 70.200,00 │
└──────────────────────────────────────────────────────────────────────────┴──────────────┴──────────────┘
```

---

## Cálculos

### Exemplo com Diárias = 3:

```
Item: Kit Lanche
Diárias: 3
Quantidade Solicitada: 50

QTDE SOLICITADA = 50
QTDE SOLICITADA TOTAL = 3 × 50 = 150
VALOR UNIT. = R$ 25,60
VALOR TOTAL = 150 × R$ 25,60 = R$ 3.840,00
```

---

## Arquivos Modificados

```
backend/
  └── pdf_generator.py  ✅ Tabela reformatada
```

---

## Como Testar

1. **Recarregue o servidor Flask** (ou aguarde auto-reload)
2. **Gere PDF de uma O.S.**
3. **Verifique:**
   - ✅ Cores verde claro
   - ✅ Coluna DESCRIÇÃO na 2ª posição
   - ✅ Colunas QTDE separadas
   - ✅ Números formatados com pontos (2.000)
   - ✅ Valores monetários com vírgula (R$ 51.200,00)

---

## Status

✅ Layout atualizado conforme print anexado
✅ Cores verde claro aplicadas
✅ Formatação de números brasileira
✅ Cabeçalhos com quebra de linha
✅ Alinhamentos corretos

**Pronto para usar!** 🎉
