# 📚 Documentação - Sistema Flask Completo

## 🎯 Estrutura do Projeto

```
backend/
├── app.py                          # Aplicação Flask principal
├── models.py                       # Modelos SQLAlchemy (ORM)
├── migrate_data.py                 # Script de migração de dados
├── requirements.txt                # Dependências Python
│
├── routes/                         # Rotas da aplicação
│   ├── views_routes.py            # Rotas para renderizar templates HTML
│   ├── itens_routes.py            # API REST - CRUD de itens
│   ├── alimentacao_routes.py      # API REST - Alimentação
│   └── os_routes.py               # API REST - Ordens de Serviço
│
├── templates/                      # Templates HTML (Jinja2)
│   ├── index.html                 # Página principal do sistema
│   └── importar-os-antigas.html   # Ferramenta de importação
│
├── static/                         # Arquivos estáticos
│   ├── css/
│   │   └── styles.css             # Estilos CSS
│   └── js/
│       ├── api-client.js          # Cliente para APIs
│       └── app.js                 # Lógica do frontend
│
└── controle_itens.db              # Banco de dados SQLite
```

## 🌐 Rotas Disponíveis

### 📄 Rotas de Views (Templates HTML)

| Rota | Descrição | Template |
|------|-----------|----------|
| `GET /` | Página principal do sistema | `index.html` |
| `GET /importar-os` | Ferramenta de importação de O.S. antigas | `importar-os-antigas.html` |

### 🔌 Rotas de API REST

#### Itens
- `GET /api/itens/` - Lista todos os itens
- `GET /api/itens/<id>` - Obtém item específico
- `POST /api/itens/` - Cria novo item
- `PUT /api/itens/<id>` - Atualiza item
- `DELETE /api/itens/<id>` - Deleta item

#### Alimentação
- `GET /api/alimentacao/` - Lista todos os itens de alimentação
- `GET /api/alimentacao/categorias` - Lista categorias
- `POST /api/alimentacao/categorias` - Cria categoria
- `GET /api/alimentacao/filtrar?categoria=&busca=` - Filtra itens
- `PUT /api/alimentacao/item/<id>/estoque` - Atualiza estoque
- `GET /api/alimentacao/resumo?regiao=` - Resumo de estoque

#### Ordens de Serviço
- `GET /api/ordens-servico/` - Lista todas as O.S.
- `GET /api/ordens-servico/<id>` - Obtém O.S. específica
- `POST /api/ordens-servico/` - Cria nova O.S. (atualiza estoque)
- `DELETE /api/ordens-servico/<id>?reverter_estoque=true` - Deleta O.S.
- `GET /api/ordens-servico/estatisticas` - Estatísticas gerais

## 🚀 Como Executar

### 1. Ativar ambiente virtual (se necessário)

```powershell
cd backend
.\venv\Scripts\Activate
```

### 2. Instalar dependências

```powershell
pip install -r requirements.txt
```

### 3. Migrar dados (primeira vez)

```powershell
python migrate_data.py
```

### 4. Executar servidor

```powershell
python app.py
```

### 5. Acessar sistema

Abra no navegador: **http://localhost:5100**

## 🔧 Configuração

### app.py

```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///controle_itens.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_AS_ASCII'] = False

# Porta do servidor
app.run(debug=True, port=5100)
```

### Alterar porta

Edite `app.py`:
```python
app.run(debug=True, port=OUTRA_PORTA)
```

## 📦 Templates HTML com Jinja2

Os templates usam `url_for()` do Flask para gerar URLs corretas:

```html
<!-- CSS -->
<link rel="stylesheet" href="{{ url_for('static', filename='css/styles.css') }}">

<!-- JavaScript -->
<script src="{{ url_for('static', filename='js/api-client.js') }}"></script>
<script src="{{ url_for('static', filename='js/app.js') }}"></script>

<!-- Links internos -->
<a href="{{ url_for('views.importar_os') }}">Importar O.S.</a>
```

## 🔄 Fluxo de Dados

```
┌─────────────────┐
│   Navegador     │
│  (Frontend)     │
└────────┬────────┘
         │
         │ HTTP Request
         ↓
┌─────────────────┐
│   Flask App     │
│  ┌───────────┐  │
│  │  Views    │──┼─→ Renderiza Templates (Jinja2)
│  └───────────┘  │
│  ┌───────────┐  │
│  │  API REST │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │
         ↓
┌─────────────────┐
│  SQLAlchemy     │
│    (ORM)        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  SQLite DB      │
│ controle_itens  │
└─────────────────┘
```

## 🎨 Estrutura do Frontend

### index.html
- Usa template Jinja2
- Carrega CSS/JS via `url_for()`
- Conecta com backend via `api-client.js`

### app.js
- Renderiza interface
- Faz chamadas AJAX via `APIClient`
- Manipula DOM e eventos

### api-client.js
- Abstrai chamadas HTTP
- Usa fetch API
- Retorna Promises

## 📝 Exemplo de Uso da API

### JavaScript (Frontend)

```javascript
// Listar itens de alimentação
const dados = await APIClient.listarAlimentacao();

// Criar Ordem de Serviço
const novaOS = await APIClient.criarOrdemServico({
    numeroOS: "1/2025",
    contrato: "123/2024",
    detentora: "Empresa XYZ",
    evento: "Workshop",
    // ...
    itens: [
        {
            categoria: "coffee_break_bebidas_quentes",
            itemId: "1",
            descricao: "Coffee Break Tipo 1",
            qtdTotal: 50
        }
    ]
});

// Atualizar estoque
await APIClient.atualizarEstoqueItem(1, {
    "1": { inicial: "20000", gasto: "100" },
    "2": { inicial: "800", gasto: "50" }
});
```

### cURL (Testes manuais)

```bash
# Listar alimentação
curl http://localhost:5100/api/alimentacao/

# Criar O.S.
curl -X POST http://localhost:5100/api/ordens-servico/ \
  -H "Content-Type: application/json" \
  -d '{"numeroOS": "1/2025", "evento": "Teste", ...}'
```

## 🛡️ CORS

O Flask está configurado com CORS habilitado para aceitar requisições de qualquer origem durante desenvolvimento:

```python
from flask_cors import CORS
CORS(app)
```

**⚠️ Em produção:** Configure CORS apenas para origens específicas.

## 📊 Banco de Dados

### Backup

```powershell
# Copiar banco de dados
copy backend\controle_itens.db backend\controle_itens_backup.db
```

### Resetar banco

```powershell
# Deletar banco
del backend\controle_itens.db

# Recriar e migrar
cd backend
python migrate_data.py
```

## 🔍 Debug

### Ver logs do servidor
Os logs aparecem no terminal onde você executou `python app.py`

### Ver requisições HTTP
Todas as requisições são logadas no terminal:
```
127.0.0.1 - - [10/Oct/2025 17:54:09] "GET /api/alimentacao/ HTTP/1.1" 200 -
```

### Console do navegador
Abra DevTools (F12) → Console para ver erros JavaScript

## 🚀 Deploy em Produção

### Usando Gunicorn (Linux/Mac)

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5100 app:app
```

### Usando Waitress (Windows)

```powershell
pip install waitress
waitress-serve --port=5100 app:app
```

## 📖 Referências

- [Flask Documentation](https://flask.palletsprojects.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Jinja2 Templates](https://jinja.palletsprojects.com/)
- [Flask-CORS](https://flask-cors.readthedocs.io/)
