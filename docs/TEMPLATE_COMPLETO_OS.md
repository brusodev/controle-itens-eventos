# 📋 Template Completo da Ordem de Serviço

## Alterações Implementadas

### ✅ Todos os Campos do PDF Oficial Incluídos

O template agora contém **TODOS** os campos presentes no documento oficial:

#### 1. Cabeçalho

```
[LOGO]    GOVERNO DO ESTADO DE SÃO PAULO       ┌────────────────────┐
          SECRETARIA DE ESTADO DA EDUCAÇÃO     │ DATA DE EMISSÃO:   │
          DEPARTAMENTO DE ADMINISTRAÇÃO        │ 13/10/2025         │
          ORDEM DE SERVIÇO                     │ NÚMERO:            │
                                                │ 09/2025            │
                                                └────────────────────┘
```

#### 2. Informações do Contrato (Seção 1)

| Campo | Obrigatório | Exemplo |
|-------|-------------|---------|
| **CONTRATO Nº** | ✅ | 014/DA/2024 |
| **DATA DA ASSINATURA** | ✅ | 15/01/2024 |
| **PRAZO DE VIGÊNCIA** | ✅ | 12 MESES |
| **NOME DA DETENTORA** | ✅ | AMBP PROMOÇÕES E EVENTOS EMPRESARIAIS LTDA-EPP |
| **SERVIÇO** | ✅ | COFFEE BREAK |
| **CNPJ** | ✅ | 08.472.572/0001-85 |
| **GRUPO** | ⬜ | 1 |

#### 3. Informações do Evento (Seção 2)

| Campo | Obrigatório | Exemplo |
|-------|-------------|---------|
| **EVENTO** | ✅ | Orientação Técnica e Formação de Supervisores |
| **DATA** | ✅ | 22/01/2025 |
| **HORÁRIO DO EVENTO** | ✅ | 14:00 |
| **LOCAL DO EVENTO** | ✅ | CGRH – Largo do Arouche, 302 - 5º Andar - Centro - São Paulo |

#### 4. Tabela de Itens

| Coluna | Descrição |
|--------|-----------|
| **Nº** | Número sequencial do item |
| **DESCRIÇÃO** | Nome completo do item/serviço |
| **UNIDADE** | Unidade de medida (Pessoa, Unidade, etc.) |
| **QTD** | Quantidade total solicitada |
| **VALOR UNIT.** | Preço unitário em R$ |
| **TOTAL** | Valor total (QTD × VALOR UNIT.) |

#### 5. Justificativa

Texto livre explicando a necessidade dos itens/serviços.

#### 6. Rodapé

```
São Paulo, 13 de outubro de 2025.

_______________________              _______________________
Nome do Gestor                       Nome do Fiscal
Gestor do Contrato                   Fiscal do Contrato
```

## Estrutura HTML Gerada

### Seção do Contrato

```html
<div class="os-section">
    <table class="os-table">
        <tr>
            <td style="width: 30%;"><strong>CONTRATO Nº:</strong></td>
            <td colspan="3">014/DA/2024</td>
        </tr>
        <tr>
            <td><strong>DATA DA ASSINATURA:</strong></td>
            <td>15/01/2024</td>
            <td style="width: 30%;"><strong>PRAZO DE VIGÊNCIA:</strong></td>
            <td>12 MESES</td>
        </tr>
        <tr>
            <td><strong>NOME DA DETENTORA:</strong></td>
            <td colspan="3">AMBP PROMOÇÕES E EVENTOS EMPRESARIAIS LTDA-EPP</td>
        </tr>
        <tr>
            <td><strong>SERVIÇO:</strong></td>
            <td>COFFEE BREAK</td>
            <td><strong>CNPJ:</strong></td>
            <td>08.472.572/0001-85</td>
        </tr>
        <tr>
            <td colspan="3"></td>
            <td><strong>GRUPO:</strong> 1</td>
        </tr>
    </table>
</div>
```

### Seção do Evento

```html
<div class="os-section">
    <table class="os-table">
        <tr>
            <td style="width: 30%;"><strong>EVENTO:</strong></td>
            <td colspan="3">Orientação Técnica e Formação de Supervisores</td>
        </tr>
        <tr>
            <td><strong>DATA:</strong></td>
            <td>22/01/2025</td>
            <td style="width: 30%;"><strong>HORÁRIO DO EVENTO:</strong></td>
            <td>14:00</td>
        </tr>
        <tr>
            <td><strong>LOCAL DO EVENTO:</strong></td>
            <td colspan="3">CGRH – Largo do Arouche, 302 - 5º Andar - Centro - São Paulo</td>
        </tr>
    </table>
</div>
```

## Campos do Formulário

### Dados do Contrato
- ✅ Contrato Nº (text)
- ✅ Data da Assinatura (date)
- ✅ Prazo de Vigência (text)
- ✅ Nome da Detentora (text)
- ✅ CNPJ (text)
- ✅ Serviço (text) - Padrão: "COFFEE BREAK"
- ⬜ Grupo (text) - Opcional

### Dados do Evento
- ✅ Evento (text)
- ✅ Data do Evento (text) - Ex: "25 à 28/08/2025"
- ✅ Horário do Evento (time)
- ✅ Local do Evento (textarea)

### Itens
- ✅ Categoria (select)
- ✅ Item (select)
- ✅ Diárias (number)
- ✅ Quantidade (number)

### Justificativa
- ✅ Justificativa (textarea)

### Responsáveis
- ✅ Gestor do Contrato (text)
- ✅ Fiscal do Contrato (text)

## Mapeamento de Dados

### Frontend → API

| Campo Formulário | Campo API | Campo DB |
|------------------|-----------|----------|
| `os-contrato-num` | `contrato` | `contrato` |
| `os-data-assinatura` | *(não salvo)* | - |
| `os-prazo-vigencia` | *(não salvo)* | - |
| `os-detentora` | `detentora` | `detentora` |
| `os-cnpj` | `cnpj` | `cnpj` |
| `os-servico` | *(não salvo)* | - |
| `os-grupo` | *(não salvo)* | - |
| `os-evento` | `evento` | `evento` |
| `os-data-evento` | `data` | `data` |
| `os-horario` | *(não salvo)* | - |
| `os-local` | `local` | `local` |
| `os-justificativa` | `justificativa` | `justificativa` |
| `os-gestor` | `gestorContrato` | `gestor_contrato` |
| `os-fiscal` | `fiscalContrato` | `fiscal_contrato` |

### ⚠️ Campos NÃO Salvos no Banco

Os seguintes campos aparecem no formulário e no preview/PDF, mas **NÃO são salvos no banco de dados**:

- `dataAssinatura` - Data da assinatura do contrato
- `prazoVigencia` - Prazo de vigência (ex: "12 MESES")
- `servico` - Tipo de serviço (ex: "COFFEE BREAK")
- `grupo` - Grupo do contrato
- `horario` - Horário do evento

**Consequência:** Quando uma O.S. é carregada do banco, esses campos aparecerão vazios.

### Solução (Se necessário)

Para manter esses campos no histórico, é necessário:

1. **Adicionar colunas ao modelo `OrdemServico`:**

```python
# backend/models.py
class OrdemServico(db.Model):
    # ... campos existentes
    data_assinatura = db.Column(db.String(100))
    prazo_vigencia = db.Column(db.String(100))
    servico = db.Column(db.String(200))
    grupo = db.Column(db.String(50))
    horario = db.Column(db.String(50))
```

2. **Atualizar `to_dict()` no modelo:**

```python
def to_dict(self, incluir_itens=True):
    data = {
        # ... campos existentes
        'dataAssinatura': self.data_assinatura,
        'prazoVigencia': self.prazo_vigencia,
        'servico': self.servico,
        'grupo': self.grupo,
        'horario': self.horario
    }
```

3. **Atualizar a rota de criação:**

```python
# backend/routes/os_routes.py
os = OrdemServico(
    # ... campos existentes
    data_assinatura=dados.get('dataAssinatura'),
    prazo_vigencia=dados.get('prazoVigencia'),
    servico=dados.get('servico'),
    grupo=dados.get('grupo'),
    horario=dados.get('horario')
)
```

4. **Migrar o banco de dados:**

```bash
# Opção 1: Recriar banco (perde dados)
rm instance/controle_itens.db
python migrate_data.py

# Opção 2: Adicionar colunas manualmente via SQL
```

## Comparação: Antes vs Depois

### ANTES (Incompleto)

```
┌─────────────────────────────────────┐
│ CONTRATO Nº: 014/DA/2024            │
│ DETENTORA: AMBP...                  │
│ CNPJ: 08.472.572/0001-85            │
│ EVENTO: Orientação Técnica...       │
├─────────────────────────────────────┤
│ DATA DO EVENTO: 22/01/2025          │
│ LOCAL: CGRH...                      │
└─────────────────────────────────────┘
```

**Campos faltando:**
- ❌ Data da Assinatura
- ❌ Prazo de Vigência
- ❌ Serviço
- ❌ Grupo
- ❌ Horário do Evento

### DEPOIS (Completo)

```
┌──────────────────────────────────────────────────────────┐
│ CONTRATO Nº: 014/DA/2024                                 │
│ DATA DA ASSINATURA: 15/01/2024  PRAZO DE VIGÊNCIA: 12 M │
│ NOME DA DETENTORA: AMBP PROMOÇÕES E EVENTOS...          │
│ SERVIÇO: COFFEE BREAK           CNPJ: 08.472.572/0001-85│
│                                        GRUPO: 1          │
├──────────────────────────────────────────────────────────┤
│ EVENTO: Orientação Técnica e Formação de Supervisores   │
│ DATA: 22/01/2025                HORÁRIO: 14:00          │
│ LOCAL DO EVENTO: CGRH – Largo do Arouche, 302...        │
└──────────────────────────────────────────────────────────┘
```

**Todos os campos presentes:**
- ✅ Data da Assinatura
- ✅ Prazo de Vigência
- ✅ Serviço
- ✅ Grupo
- ✅ Horário do Evento

## Estilos CSS Ajustados

### Caixa de Informações (Topo Direito)

```css
.os-info-box {
    border: 2px solid #000;    /* Borda mais destacada */
    padding: 6px 10px;
    text-align: center;        /* Centralizado */
    font-size: 9px;
    min-width: 100px;
}
```

### Tabelas

```css
.os-table td {
    padding: 4px 6px;
    border: 1px solid #000;
    font-size: 10px;
}
```

## Testando

1. **Atualizar página** (F5)
2. **Preencher formulário completo:**
   - Todos os campos de Dados do Contrato
   - Todos os campos de Dados do Evento
   - Adicionar pelo menos 1 item
   - Preencher Justificativa
   - Informar Gestor e Fiscal
3. **Clicar em "👁️ Visualizar O.S."**
4. **Verificar:**
   - ✅ Todos os campos aparecem
   - ✅ Layout similar ao PDF oficial
   - ✅ Tabelas bem formatadas
   - ✅ Caixa de DATA/NÚMERO destacada

## Status

✅ **Template Completo Implementado!**

- Cabeçalho com logo e títulos ✅
- Seção de Contrato (7 campos) ✅
- Seção de Evento (4 campos) ✅
- Tabela de Itens (6 colunas) ✅
- Justificativa ✅
- Assinaturas (Gestor e Fiscal) ✅
- Rodapé com data por extenso ✅

⚠️ **Atenção:** 5 campos não são salvos no banco (ver seção "Campos NÃO Salvos")
