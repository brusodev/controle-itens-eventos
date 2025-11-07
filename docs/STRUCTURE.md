# 📋 Estrutura do Projeto - Controle de Itens de Eventos

## 🏗️ Organização Geral

```
controle-itens-eventos/
├── backend/                    # Servidor Flask (API + Templates)
│   ├── app.py                 # Aplicação principal
│   ├── models.py              # Modelos de banco de dados
│   ├── requirements.txt       # Dependências Python
│   ├── .env.example           # Exemplo de variáveis de ambiente
│   ├── .gitignore            # Arquivos ignorados pelo Git
│   │
│   ├── routes/               # Rotas da API
│   │   ├── auth_routes.py         # Autenticação e login
│   │   ├── alimentacao_routes.py  # Items de Coffee Break (Estoque)
│   │   ├── os_routes.py           # Ordens de Serviço
│   │   ├── detentoras_routes.py   # Gerenciamento de Detentoras
│   │   ├── usuarios_routes.py     # Gerenciamento de Usuários
│   │   ├── relatorios_routes.py   # Relatórios e exportação
│   │   └── auditoria_routes.py    # Sistema de Auditoria
│   │
│   ├── templates/            # Templates HTML
│   │   ├── base.html              # Layout base (sidebar + navbar)
│   │   ├── index.html             # Dashboard principal
│   │   ├── login.html             # Página de login
│   │   ├── gerenciar-detentoras.html  # Gerenciamento de detentoras
│   │   ├── auditoria.html         # Visualização de auditoria
│   │   └── ...                    # Outros templates
│   │
│   ├── static/               # Arquivos estáticos
│   │   ├── css/
│   │   │   ├── styles.css          # Estilos principais
│   │   │   ├── detentoras.css      # Estilos do gerenciador de detentoras
│   │   │   └── auditoria.css       # Estilos da auditoria
│   │   ├── js/
│   │   │   ├── app.js              # JavaScript principal
│   │   │   ├── api-client.js       # Cliente de API
│   │   │   └── ...
│   │   ├── images/
│   │   │   └── timbrado.png        # Logo para PDF
│   │   └── uploads/                # Uploads de usuários
│   │
│   ├── utils/                # Utilitários
│   │   ├── auditoria.py           # Helper de auditoria
│   │   └── ...
│   │
│   ├── scripts/              # Scripts de utilitários/testes/migração
│   │   ├── admin/
│   │   │   └── criar_admin.py      # Criar usuário admin
│   │   ├── diagnostico/
│   │   │   ├── diagnosticar_detentoras.py
│   │   │   ├── diagnosticar_movimentacoes.py
│   │   │   └── ...
│   │   ├── migracao/
│   │   │   ├── migrar_detentoras.py
│   │   │   ├── migrar_perfil.py
│   │   │   └── ...
│   │   └── testes/
│   │       ├── teste_api_alimentacao.py
│   │       ├── teste_api_usuario.py
│   │       └── ...
│   │
│   ├── migrations/           # Migrações de banco de dados
│   ├── instance/            # Banco de dados local (sqlite)
│   ├── tests/               # Testes unitários
│   │
│   ├── pdf_generator.py     # Gerador de PDF para O.S.
│   └── venv/                # Ambiente virtual Python
│
├── frontend/                # Aplicação Vue.js (se houver)
│
├── docs/                    # Documentação
│   ├── README.md           # Instruções de uso
│   ├── STRUCTURE.md        # Este arquivo
│   ├── API.md              # Documentação da API
│   ├── SETUP.md            # Guia de instalação
│   └── ...
│
├── scripts/                 # Scripts raiz do projeto
│   ├── start.ps1           # Iniciar servidor (PowerShell)
│   ├── backup.sh           # Backup do projeto
│   ├── clean.ps1           # Limpeza
│   └── deploy.sh           # Deploy
│
└── README.md               # Documentação principal
```

## 📚 Descrição dos Componentes

### Backend (`/backend`)

#### **Arquivo Principal**
- **app.py**: Factory da aplicação Flask, registra blueprints, gerencia contexto de aplicação

#### **Modelos** (`models.py`)
- `Usuario`: Usuários do sistema com autenticação
- `Categoria`: Categorias de itens (Coffee Break, etc)
- `Item`: Items de estoque com código BEC
- `EstoqueRegional`: Quantidade por região (1-6)
- `OrdemServico`: Ordens de serviço (O.S.)
- `ItemOrdemServico`: Itens utilizados em cada O.S.
- `Movimentacao`: Histórico de movimentações de estoque
- `Detentora`: Empresas fornecedoras de serviços
- `Auditoria`: Registros de auditoria de ações do sistema

#### **Rotas** (`/routes`)

| Arquivo | Responsabilidade |
|---------|------------------|
| `auth_routes.py` | Login, logout, autenticação |
| `alimentacao_routes.py` | CRUD de itens de estoque + atualização de estoques |
| `os_routes.py` | CRUD de Ordens de Serviço + emissão de PDF |
| `detentoras_routes.py` | CRUD de Detentoras (empresas fornecedoras) |
| `usuarios_routes.py` | Gerenciamento de usuários |
| `relatorios_routes.py` | Relatórios, exportação, gráficos |
| `auditoria_routes.py` | Registros de auditoria do sistema |

#### **Templates** (`/templates`)
- **base.html**: Layout com navbar e sidebar para todas as páginas
- **index.html**: Dashboard com abas (Estoque, O.S., Relatórios, etc)
- **auditoria.html**: Interface de visualização de auditoria com filtros
- Outros templates para formulários e listagens

#### **Estáticos** (`/static`)
- **CSS**: Estilos responsivos para desktop e mobile
- **JS**: Lógica cliente (fetch de API, manipulação DOM, eventos)
- **Images**: Logo, ícones, timbrado para PDF

#### **Scripts Utilitários** (`/scripts`)
Organizados em subpastas:
- **admin/**: Criar usuários admin, gerenciamento inicial
- **diagnostico/**: Verificar integridade de dados
- **migracao/**: Migrar dados entre estruturas
- **testes/**: Testar endpoints e funcionalidades

### Frontend
Se implementado, conterá aplicação Vue.js/React com componentes reutilizáveis.

### Documentação (`/docs`)
- Guias de instalação, uso, API
- Diagramas e fluxos
- Troubleshooting

### Scripts Raiz
Scripts PowerShell e Bash para gerenciar todo o projeto:
- `start.ps1`: Inicia o servidor
- `clean.ps1`: Limpa cache/temp
- `backup.sh`: Faz backup

## 🔄 Fluxo de Dados

```
1. Usuário acessa http://localhost:5100
   ↓
2. Flask renderiza login.html (auth_routes.py)
   ↓
3. Credenciais validadas → Sessão criada
   ↓
4. Acessa index.html → Carrega dados via API
   ↓
5. JavaScript chama endpoints REST:
   - GET /api/alimentacao/
   - GET /api/ordens-servico/
   - POST /api/detentoras/
   etc...
   ↓
6. Cada operação registrada em Auditoria
   ↓
7. Dados salvos no banco (SQLite/PostgreSQL)
```

## 🔐 Autenticação & Permissões

```
Decoradores utilizados:
- @login_requerido: Verifica se usuário está autenticado
- @admin_requerido: Verifica se é administrador

Perfis de usuário:
- admin: Acesso total ao sistema e auditoria
- usuario: Acesso limitado (apenas consulta)
```

## 📊 Sistema de Auditoria

Registra automaticamente:
- **Ações**: CREATE, UPDATE, DELETE, LOGIN, LOGOUT
- **Módulos**: OS, ITEM, DETENTORA, USUARIO, AUTH
- **Dados**: Antes/Depois da mudança (para UPDATE)
- **Metadados**: Usuário, IP, User-Agent, Data/Hora

Acessível apenas para administradores em `/api/auditoria/view`

## 🗄️ Banco de Dados

- **Desenvolvimento**: SQLite (instance/app.db)
- **Produção**: PostgreSQL (configurável via .env)
- **Migrações**: Alembic (pasta /migrations)

## 📝 Variáveis de Ambiente (.env)

```
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=sqlite:///instance/app.db
SECRET_KEY=sua-chave-secreta
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=senha-admin
```

## 🚀 Como Executar

```bash
# 1. Ativar ambiente virtual
cd backend
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate     # Linux/Mac

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Inicializar banco de dados
python init_db.py

# 4. Criar admin
python scripts/admin/criar_admin.py

# 5. Iniciar servidor
python app.py

# 6. Acessar
# http://localhost:5100
```

## 📦 Dependências Principais

- **Flask**: Framework web
- **SQLAlchemy**: ORM para banco de dados
- **ReportLab**: Geração de PDF
- **Werkzeug**: Segurança e validação
- **Python-dotenv**: Gerenciamento de .env

## 🧪 Testes

```bash
# Executar testes
pytest tests/

# Com cobertura
pytest --cov=routes tests/
```

## 📈 Escalabilidade

Para produção:
- Migrar de SQLite para PostgreSQL
- Usar Gunicorn em vez de Flask dev server
- Configurar Nginx como reverse proxy
- SSL/TLS com certificado
- Redis para cache/sessions
- Celery para tasks assíncronas

## 📞 Suporte

Para dúvidas sobre a estrutura, consulte:
- `docs/API.md` - Endpoints disponíveis
- `docs/SETUP.md` - Instalação e configuração
- Commentários no código (docstrings)
