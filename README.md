# 📋 Controle de Itens de Eventos

Sistema web para emissão e gestão de **Ordens de Serviço (O.S.)**, **controle de estoque por região** e **gestão de detentoras de contrato**, com **auditoria completa** e **portal para empresas contratadas**.

> **Última atualização**: Agosto de 2026

## 🎯 Visão Geral

O sistema é **multi-módulo**: cada módulo representa um tipo de contrato, com seus próprios itens, categorias, detentoras e terminologia. O módulo ativo é escolhido no painel inicial e fica guardado no navegador (`localStorage.modulo_atual`), sendo enviado a cada requisição.

| Módulo | Descrição |
|---|---|
| ☕ **Coffee Break** | Itens de alimentação para eventos |
| 📋 **Organização** | Montagem, RH, TI e gráfica de eventos |
| 🛏️ **Hospedagem** | Diárias e serviços de hospedagem |
| 🚚 **Transporte** | Trajetos, com origem/destino e setor solicitante |
| 🏆 **Troféus** | Premiações e placas |
| 🖨️ **Serviços Gráficos** | Pedidos pontuais (não vinculados a eventos) |

Cada módulo define rótulos próprios (grupo/região, código do item — BEC, CATSERV, CATSER), se usa diárias e se usa trajeto.

## ✨ Funcionalidades

### 📦 Estoque
- Cadastro de itens com código da natureza da despesa
- Controle de quantidade **inicial** e **gasta** por região/grupo
- Baixa automática de estoque na emissão da O.S.
- Histórico de movimentações
- Auditoria de alterações

### 📋 Ordens de Serviço
- Numeração sequencial por módulo e grupo
- Vínculo com detentora, evento e itens
- Diárias e quantidades por item, com validação contra o estoque disponível
- Campos específicos por módulo (setor solicitante, trajeto, pessoas atendidas, datas de pedido/entrega)
- Geração de **PDF** e **PNG** da O.S.
- Ciclo de vida completo com 8 estados:
  `emitida → enviada_empresa → em_revisao → aceita → em_execucao → executada`, além de `recusada` e `cancelada`
- Controle de pagamento (vencimento e baixa)
- Registro de motivo em exclusões

### 🏢 Detentoras
- Cadastro por contrato, CNPJ, vigência e grupo
- Vínculo com módulo e região
- Status ativo/inativo

### 🌐 Portal da Detentora *(opcional)*
Área separada onde a empresa contratada acompanha suas O.S.:
- Aceite com assinatura e evidência
- Solicitação de revisão e comentários
- Atualização de status de execução

> Desativado por padrão. Ative com `PORTAL_DETENTORA_ATIVO=true` no `.env`.

### 📊 Relatórios
Todos com filtros próprios e exportação:

| Relatório | Exportação |
|---|---|
| Ordens de Serviço | Excel |
| Posição de Estoque | PDF |
| Movimentações de Estoque | — |
| Consumo por Categoria | — |
| Itens Mais Utilizados | Excel |
| Controle de Pagamentos | Excel |
| Eventos — Organização *(só no módulo Organização)* | Excel |
| Transporte por Setor Solicitante *(só no módulo Transporte)* | Excel |

O relatório de O.S. traz uma linha por item (`Nº O.S. / Data Emissão / Solicitante / Data do Evento / Evento / Tipo / Quantidade / Valor`) e aplica o **mês vigente** como período padrão, evitando varredura desnecessária do banco.

### 🔍 Auditoria
- Registro de CREATE, UPDATE e DELETE em itens, estoque, O.S. e detentoras
- Captura usuário, data/hora, IP, user-agent e comparação **antes/depois**
- Filtros por usuário, módulo, ação e data
- Restrito a administradores

### 👥 Usuários
Três perfis:
- **admin** — acesso total, incluindo auditoria e gestão de usuários
- **comum** — operação do sistema
- **empresa** — acesso exclusivo ao portal da detentora (vinculado a uma detentora)

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────┐
│  Frontend — HTML + CSS + JavaScript puro    │
│  Templates Jinja2, sem framework SPA        │
└──────────────────┬──────────────────────────┘
                   │ HTTP / REST (JSON)
┌──────────────────▼──────────────────────────┐
│  Backend — Flask                            │
│  ├─ 10 blueprints de rotas                  │
│  ├─ SQLAlchemy ORM                          │
│  ├─ ReportLab (PDF) / openpyxl (Excel)      │
│  ├─ Flask-Limiter (rate limiting)           │
│  └─ Auditoria automática                    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Banco — SQLite (dev) / PostgreSQL (prod)   │
│  13 tabelas                                 │
└─────────────────────────────────────────────┘
```

### Tabelas

`categorias` · `itens` · `estoque_regional` · `detentoras` · `ordens_servico` · `itens_ordem_servico` · `movimentacoes_estoque` · `usuarios` · `auditoria` · `aceites_empresa` · `revisoes_empresa` · `comentarios_empresa` · `assinaturas_internas`

## 📋 Requisitos

- **Python 3.8+** (desenvolvido em 3.12)
- **pip**
- **SQLite** (desenvolvimento) ou **PostgreSQL** (produção)
- Navegador moderno

## 🚀 Instalação

```bash
# 1. Entrar na pasta backend
cd backend

# 2. Criar e ativar ambiente virtual
python -m venv .venv
.venv\Scripts\Activate.ps1      # Windows
source .venv/bin/activate       # Linux/Mac

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Inicializar o banco
python init_db.py

# 5. Criar usuário administrador
python scripts/admin/criar_admin.py

# 6. Iniciar o servidor
python app.py
```

Acesse **http://localhost:5100**

### Variáveis de ambiente

Crie um `.env` na pasta `backend/`:

```bash
SECRET_KEY=<chave-aleatoria-forte>     # obrigatório em produção
PORTAL_DETENTORA_ATIVO=false           # true habilita o portal da empresa
CORS_ORIGIN=http://localhost:5100      # origens permitidas (separadas por vírgula)
```

> Sem `SECRET_KEY`, o sistema usa uma chave temporária e as sessões se perdem a cada reinício.

## 🗂️ Estrutura

```
controle-itens-eventos/
├── backend/
│   ├── app.py                      # Factory da aplicação (create_app)
│   ├── models.py                   # Modelos SQLAlchemy (13 tabelas)
│   ├── extensions.py               # Flask-Limiter
│   ├── pdf_generator.py            # Geração de PDF da O.S.
│   ├── init_db.py                  # Criação do schema
│   ├── requirements.txt
│   │
│   ├── routes/
│   │   ├── auth_routes.py          # Login, usuários, decorators de acesso
│   │   ├── views_routes.py         # Páginas (renderiza templates)
│   │   ├── os_routes.py            # Ordens de Serviço
│   │   ├── itens_routes.py         # Itens
│   │   ├── categorias_routes.py    # Categorias
│   │   ├── alimentacao_routes.py   # Itens e estoque por módulo
│   │   ├── detentoras_routes.py    # Detentoras
│   │   ├── detentora_portal_routes.py  # Portal da empresa
│   │   ├── relatorios_routes.py    # Relatórios e exportações
│   │   └── auditoria_routes.py     # Auditoria
│   │
│   ├── templates/                  # Jinja2 (base.html + páginas)
│   ├── static/
│   │   ├── css/
│   │   └── js/                     # Um arquivo por área funcional
│   ├── utils/auditoria.py          # Helper de registro de auditoria
│   ├── migrations/                 # Scripts de migração de schema
│   ├── scripts/                    # admin, seed, diagnóstico, migração
│   └── tests/                      # Testes pytest
│
├── docs/                           # Documentação e histórico
└── README.md
```

> O frontend é servido pelo próprio Flask — não há pasta `frontend/` separada nem build step.

## 🔑 Principais Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|---|---|---|
| GET, POST | `/auth/login` | Login |
| GET | `/auth/logout` | Logout |
| GET | `/auth/api/me` | Usuário da sessão |
| GET | `/auth/api/usuarios` | Listar usuários *(admin)* |
| POST | `/auth/api/alterar-senha` | Trocar senha |

### Ordens de Serviço
| Método | Endpoint | Descrição |
|---|---|---|
| GET, POST | `/api/ordens-servico/` | Listar / criar |
| GET, PUT, DELETE | `/api/ordens-servico/<id>` | Obter / editar / excluir |
| GET | `/api/ordens-servico/<id>/pdf` | PDF da O.S. |
| GET | `/api/ordens-servico/<id>/png` | Imagem da O.S. |
| POST | `/api/ordens-servico/<id>/enviar-empresa` | Enviar ao portal |
| POST | `/api/ordens-servico/<id>/cancelar` | Cancelar |
| PUT | `/api/ordens-servico/<id>/pagamento` | Registrar pagamento |
| GET | `/api/ordens-servico/proximo-numero` | Próximo número disponível |

### Itens, Categorias e Estoque
| Método | Endpoint | Descrição |
|---|---|---|
| GET, POST | `/api/itens/` | Listar / criar itens |
| GET, PUT, DELETE | `/api/itens/<id>` | Operações no item |
| GET, POST | `/api/categorias/` | Categorias |
| GET | `/api/alimentacao/` | Itens do módulo com estoque |
| PUT | `/api/alimentacao/item/<id>/estoque` | Atualizar estoque |

### Detentoras
| Método | Endpoint | Descrição |
|---|---|---|
| GET, POST | `/api/detentoras/` | Listar / criar |
| GET, PUT, DELETE | `/api/detentoras/<id>` | Operações |
| GET | `/api/detentoras/grupos` | Grupos disponíveis |

### Relatórios
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/relatorios/ordens-servico` | Relatório de O.S. |
| GET | `/api/relatorios/ordens-servico/excel` | Exportar em Excel |
| GET | `/api/relatorios/estoque-posicao` | Posição de estoque |
| GET | `/api/relatorios/pdf/estoque` | Estoque em PDF |
| GET | `/api/relatorios/movimentacoes` | Movimentações |
| GET | `/api/relatorios/pagamentos` · `/excel` | Controle de pagamentos |
| GET | `/api/relatorios/organizacao/eventos` · `/excel` | Eventos (Organização) |
| GET | `/api/relatorios/transporte/setores` · `/excel` | Por setor (Transporte) |
| GET | `/api/relatorios/setores-solicitantes` | Setores já usados no módulo |

### Auditoria *(admin)*
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/auditoria/` | Registros paginados |
| GET | `/api/auditoria/estatisticas` | Estatísticas |

> Todas as rotas de API exigem sessão autenticada.

## 🧪 Testes

```bash
cd backend
.venv/Scripts/python.exe -m pytest tests/ -q
```

Os testes usam SQLite em memória, sem depender do banco local.

> ⚠️ Alguns arquivos em `tests/` (`test_api_list.py`, `test_put.py`, `test_criar_os_api.py`, entre outros) dependem de `requests` e de um servidor rodando — são scripts manuais, não testes unitários. Para rodar só a suíte automatizada, use `--ignore` nesses arquivos.

## 🔒 Segurança

| Item | Implementação |
|---|---|
| Senhas | `pbkdf2:sha256` via Werkzeug |
| Sessões | Cookie Flask com `SameSite=Lax` |
| SQL Injection | Prevenido pelo SQLAlchemy ORM (queries parametrizadas) |
| Rate limiting | Flask-Limiter no login |
| Autenticação | Obrigatória em todas as rotas de API |
| Autorização | Decorators `@admin_requerido`, `@empresa_requerido` |
| Excel injection | Valores de texto sanitizados na exportação |

### Pontos de atenção conhecidos

- Vários pontos do frontend montam HTML via `innerHTML` sem escapar o conteúdo. A tabela do relatório de O.S. já usa `escaparHtml()` (em `static/js/utils.js`); os demais ainda não.
- Os endpoints de relatório exigem login, mas não restringem por perfil.
- Erros de parâmetro malformado (data ou região inválida) retornam HTTP 500 com a mensagem da exceção.

### Banco de dados

O banco **não é versionado** (`.gitignore` cobre `instance/`, `*.db`, `*.sqlite`). Faça backup do arquivo `instance/controle_itens.db` antes de qualquer atualização em produção, e prefira aplicar migrações pelos scripts em `backend/migrations/`.

## 🛠️ Scripts Úteis

```bash
# Criar usuário admin
python backend/scripts/admin/criar_admin.py

# Popular dados iniciais de um módulo
ls backend/scripts/seed/

# Diagnóstico do banco
python backend/scripts/check_database.py

# Migrações de schema
ls backend/migrations/
```

## 🐛 Problemas Comuns

**Porta 5100 em uso**
```bash
# Windows
netstat -ano | findstr :5100
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5100 && kill -9 <PID>
```

**`ModuleNotFoundError`** — confirme que o ambiente virtual está ativo e rode `pip install -r requirements.txt`.

**Alterações no JavaScript não aparecem** — os scripts são carregados com versão (`?v=2.8`) em `templates/index.html`. Ao editar um `.js`, incremente esse número, senão o navegador serve o arquivo do cache.

**Coluna inexistente no banco local** — o banco de desenvolvimento pode estar defasado em relação ao modelo. Rode a migração correspondente em `backend/migrations/`.

**`UnicodeEncodeError` ao rodar scripts no Windows** — evite `print()` com emoji; o console usa cp1252. Use `logging` ou reconfigure a saída para UTF-8.

## 📚 Documentação

A pasta `docs/` reúne guias e o histórico de implementações. Destaques:

| Documento | Conteúdo |
|---|---|
| [docs/API.md](./docs/API.md) | Detalhamento dos endpoints |
| [docs/DATABASE.md](./docs/DATABASE.md) | Schema do banco |
| [docs/AUDITORIA.md](./docs/AUDITORIA.md) | Sistema de auditoria |
| [docs/SETUP.md](./docs/SETUP.md) | Instalação detalhada |
| [docs/PLANO_PORTAL_DETENTORA_SPRINTS.md](./docs/PLANO_PORTAL_DETENTORA_SPRINTS.md) | Portal da detentora |
| [docs/DEPLOY_VPS.md](./docs/DEPLOY_VPS.md) | Deploy em VPS |

> Boa parte dos arquivos em `docs/` é histórico de correções pontuais e pode estar desatualizada em relação ao código atual.

## 📜 Licença

Propriedade privada.

Desenvolvido com ❤️ por Bruno Vargas.
