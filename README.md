# ☕ Controle de Itens de Eventos

Sistema web para gerenciamento de **Ordens de Serviço (O.S.)**, **estoque de itens de Coffee Break** e **detentoras de contrato** com **auditoria completa**.

> **Versão**: 2.0.0 com Sistema de Auditoria  
> **Última atualização**: Novembro 2025

## 🎯 Funcionalidades Principais

### 📦 Gerenciamento de Estoque
- ✅ Cadastro de itens com código BEC (natureza da despesa)
- ✅ Controle de quantidade por região (1-6)
- ✅ Atualização de quantidades iniciais e gastas
- ✅ **Auditoria automática de mudanças de estoque**
- ✅ Histórico de movimentações

### 📋 Ordens de Serviço (O.S.)
- ✅ Emissão automática de número sequencial
- ✅ Associação com detentora e evento
- ✅ Adição de itens com controle de estoque
- ✅ Geração de PDF pronto para imprimir
- ✅ Cálculo automático de valores
- ✅ **Auditoria de criação/edição/deleção**

### 🏢 Gerenciamento de Detentoras
- ✅ Cadastro de empresas fornecedoras
- ✅ Contratos e vigência (formato DD/MM/YYYY)
- ✅ CNPJ e dados de contato
- ✅ Associação com grupos/regiões
- ✅ Status ativo/inativo
- ✅ **Auditoria de todas as operações**

### 📊 Auditoria e Relatórios
- ✅ Registro de todas as ações (CREATE, UPDATE, DELETE)
- ✅ Rastreamento de quem fez o quê e quando
- ✅ **Comparação antes/depois** para alterações
- ✅ Filtros por usuário, módulo, ação e data
- ✅ Estatísticas (total, últimas 24h, por módulo)
- ✅ Acesso restrito a administradores
- ✅ Interface intuitiva com modal de detalhes

### 👥 Gerenciamento de Usuários
- ✅ Autenticação com email/senha
- ✅ Perfis: Admin (total) e Usuário (consulta)
- ✅ Login com sessão segura
- ✅ Troca de senha

## 🏗️ Arquitetura

```
┌────────────────────────────────────────┐
│     Frontend (Navegador)                │
│  HTML5 + CSS3 + JavaScript (Vanilla)   │
└────────────────┬───────────────────────┘
                 │ HTTP/REST API
┌────────────────▼───────────────────────┐
│        Backend (Flask)                  │
│  ├─ 7 Blueprints de Rotas              │
│  ├─ SQLAlchemy ORM                     │
│  ├─ PDF Generator (ReportLab)          │
│  └─ Auditoria Automática                │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│   Database (SQLite/PostgreSQL)          │
│  9 tabelas principais:                  │
│  ├─ Usuários                           │
│  ├─ Items                              │
│  ├─ Estoques Regionais                 │
│  ├─ Ordens de Serviço                  │
│  ├─ Items O.S.                         │
│  ├─ Movimentações                      │
│  ├─ Detentoras                         │
│  ├─ Categorias                         │
│  └─ Auditoria ⭐ (NOVO)                │
└────────────────────────────────────────┘
```

## 📋 Requisitos

- **Python 3.8+**
- **pip** (gerenciador de pacotes)
- **SQLite** ou **PostgreSQL**
- **Navegador moderno** (Chrome, Firefox, Edge, Safari)
- **1GB RAM mínimo**

## 🚀 Instalação Rápida

```bash
# 1. Entrar na pasta backend
cd backend

# 2. Ativar ambiente virtual
.\venv\Scripts\Activate.ps1  # Windows
# ou
source venv/bin/activate     # Linux/Mac

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Inicializar banco
python init_db.py

# 5. Criar admin
python scripts/admin/criar_admin.py

# 6. Iniciar servidor
python app.py

# 7. Acessar em http://localhost:5100
```

**Credenciais padrão:**
- Email: `admin@example.com`
- Senha: `admin123`

## 📚 Documentação Completa

| Documento | Descrição |
|-----------|-----------|
| [STRUCTURE.md](./STRUCTURE.md) | Estrutura de pastas e organização |
| [docs/API.md](./docs/API.md) | Endpoints REST e exemplos |
| [docs/DATABASE.md](./docs/DATABASE.md) | Schema do banco de dados |
| [docs/AUDITORIA.md](./docs/AUDITORIA.md) | Sistema de auditoria ⭐ NOVO |
| [docs/SETUP.md](./docs/SETUP.md) | Guia de instalação detalhado |

## 🗂️ Estrutura do Projeto

```
controle-itens-eventos/
├── backend/
│   ├── app.py                    # Aplicação principal
│   ├── models.py                 # Modelos (9 tabelas)
│   ├── pdf_generator.py          # Gerador de PDF
│   ├── requirements.txt
│   │
│   ├── routes/
│   │   ├── auth_routes.py        # Login/Logout
│   │   ├── alimentacao_routes.py # Items de estoque ⭐ COM AUDITORIA
│   │   ├── os_routes.py          # Ordens de Serviço ⭐ COM AUDITORIA
│   │   ├── detentoras_routes.py  # Detentoras ⭐ COM AUDITORIA
│   │   ├── usuarios_routes.py    # Gerencio de Usuários
│   │   ├── relatorios_routes.py  # Relatórios
│   │   └── auditoria_routes.py   # Auditoria ⭐ NOVO
│   │
│   ├── templates/
│   │   ├── base.html             # Layout base
│   │   ├── index.html            # Dashboard
│   │   ├── login.html            # Login
│   │   ├── gerenciar-detentoras.html
│   │   └── auditoria.html        # ⭐ NOVO
│   │
│   ├── static/
│   │   ├── css/styles.css
│   │   ├── js/app.js
│   │   └── images/timbrado.png
│   │
│   ├── utils/
│   │   └── auditoria.py          # ⭐ NOVO - Helper de auditoria
│   │
│   └── scripts/
│       ├── admin/criar_admin.py
│       ├── diagnostico/
│       ├── migracao/
│       └── testes/
│
├── docs/
│   ├── README.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── AUDITORIA.md              # ⭐ NOVO
│   └── ...
│
├── STRUCTURE.md                  # ⭐ NOVO
└── README.md                     # Este arquivo
```

## 🔑 Endpoints Principais

### 🔐 Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/login` | Login de usuário |
| POST | `/logout` | Logout |
| GET | `/api/usuario/perfil` | Dados do usuário logado |

### 📦 Items/Estoque
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/itens` | Listar todos os itens |
| POST | `/api/itens` | Criar novo item ⭐ COM AUDITORIA |
| GET | `/api/itens/<id>` | Obter item específico |
| PUT | `/api/itens/<id>` | Atualizar item ⭐ COM AUDITORIA |
| DELETE | `/api/itens/<id>` | Deletar item ⭐ COM AUDITORIA |
| PUT | `/api/alimentacao/item/<id>/estoque` | Atualizar estoque ⭐ COM AUDITORIA |

### 📋 Ordens de Serviço
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/os` | Listar todas O.S. |
| POST | `/api/os` | Criar nova O.S. ⭐ COM AUDITORIA |
| GET | `/api/os/<id>` | Obter O.S. específica |
| PUT | `/api/os/<id>` | Editar O.S. ⭐ COM AUDITORIA |
| DELETE | `/api/os/<id>` | Deletar O.S. ⭐ COM AUDITORIA |
| GET | `/api/os/<id>/pdf` | Gerar PDF da O.S. |

### 🏢 Detentoras
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/detentoras` | Listar detentoras |
| POST | `/api/detentoras` | Criar detentora ⭐ COM AUDITORIA |
| PUT | `/api/detentoras/<id>` | Atualizar detentora ⭐ COM AUDITORIA |
| DELETE | `/api/detentoras/<id>` | Deletar detentora ⭐ COM AUDITORIA |

### 📊 Auditoria (Admin Only)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/auditoria/` | Listar registros (paginado) |
| GET | `/api/auditoria/view` | Interface web |
| GET | `/api/auditoria/usuarios` | Usuários que fizeram ações |
| GET | `/api/auditoria/estatisticas` | Estatísticas de auditoria |

> 📌 **Mais detalhes em [docs/API.md](./docs/API.md)**

## ⭐ Sistema de Auditoria

### O que é rastreado?

✅ **Items**: CREATE, UPDATE, DELETE  
✅ **Estoque**: UPDATE (quantidade por região)  
✅ **Ordens de Serviço**: CREATE, UPDATE, DELETE  
✅ **Detentoras**: CREATE, UPDATE, DELETE  

### Informações capturadas

Para cada ação:
- 👤 **Usuário** que realizou a ação
- ⏰ **Data/Hora** exata
- 🌐 **IP** da requisição
- 📱 **User-Agent** (navegador)
- 📝 **Descrição** da ação
- 📊 **Dados Antes** (para UPDATE/DELETE)
- 📊 **Dados Depois** (para CREATE/UPDATE)

### Exemplo de Auditoria

```json
{
  "id": 42,
  "usuario": "admin@example.com",
  "acao": "UPDATE",
  "modulo": "ITEM",
  "descricao": "Atualizou estoques do item: Água 1.5L",
  "dados_antes": {
    "id": 15,
    "descricao": "Água 1.5L",
    "estoques": {
      "Região 1": 100,
      "Região 2": 50
    }
  },
  "dados_depois": {
    "id": 15,
    "descricao": "Água 1.5L",
    "estoques": {
      "Região 1": 600,
      "Região 2": 50
    }
  },
  "data_hora": "2025-11-15 14:30:45",
  "ip_address": "192.168.1.100"
}
```

### Acessar Auditoria

1. ✔️ Faça login como **Admin**
2. ✔️ Clique em **Auditoria** no menu
3. ✔️ Visualize e filtre registros
4. ✔️ Clique no botão **Detalhes** para ver comparação antes/depois

> 📌 **Acesso restrito a administradores!**

## 🛠️ Ferramentas e Scripts

O projeto inclui vários scripts utilitários para diagnóstico e manutenção:

```bash
# Diagnosticar problemas
python scripts/diagnostico/diagnostico_completo.py

# Verificar dados específicos
python scripts/diagnostico/verificar_estoque_wafer.py
python scripts/diagnostico/verificar_os_banco.py

# Criar usuário admin
python scripts/admin/criar_admin.py

# Testes
python scripts/testes/teste_completo_itens.py
python scripts/testes/teste_api_usuario.py
```

## 🐛 Troubleshooting

### Erro: "Port 5100 is already in use"
```bash
# Windows
netstat -ano | findstr :5100
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5100
kill -9 <PID>
```

### Erro: "ModuleNotFoundError"
```bash
# Reinstalar dependências
pip install --force-reinstall -r requirements.txt
```

### Erro: "Database locked"
```bash
# Remover banco de dados e reinicializar
rm instance/controle_items.db
python init_db.py
```

### Dados não aparecem em Auditoria
1. Verificar se o usuário é **Admin**
2. Verificar logs do Flask (porta 5100)
3. Confirmar que a ação foi realizada (items, O.S., detentoras)
4. Atualizar página (F5)

## 📈 Performance e Escalabilidade

### Banco de Dados
- **SQLite** para desenvolvimento (recomendado)
- **PostgreSQL** para produção (recomendado para 5000+ registros)

### Otimizações
- Índices em campos de busca frequentes
- Paginação automática (50 registros/página)
- Cache de dados do usuário

### Limites Conhecidos
- Máximo 10.000 O.S. por ano (recomendado arquivo)
- Máximo 1.000 itens de estoque
- Máximo 100 detentoras

## 📦 Dependências Principais

```
Flask==2.3.2
Flask-SQLAlchemy==3.0.5
Flask-Login==0.6.2
ReportLab==4.0.7
psycopg2-binary==2.9.6  # PostgreSQL only
```

Para lista completa: [requirements.txt](./backend/requirements.txt)

## 🔒 Segurança

✅ **Senhas**: Hash SHA-256 + salt  
✅ **Sessões**: Flask Session segura  
✅ **CSRF**: Proteção (quando habilitada)  
✅ **SQL Injection**: SQLAlchemy ORM previne  
✅ **Autenticação**: Obrigatória para todas rotas  
✅ **Autorização**: Admin vs Usuário (auditoria admin-only)  

## 📞 Suporte

### Encontrou um bug?
Verifique em [docs/GUIA_DIAGNOSTICO_OS.md](./docs/) ou crie um issue.

### Dúvidas sobre uso?
Leia [STRUCTURE.md](./STRUCTURE.md) para entender a arquitetura.

### Quer contribuir?
Faça um fork, crie uma branch e envie um pull request!

## 📜 Licença

Propriedade Privada - 2024-2025

## 👨‍💻 Autor

Desenvolvido para gestão de eventos e ordens de serviço.

---

**Última atualização**: Novembro 2025  
**Status**: ✅ Em produção com sistema de auditoria  
**Versão**: 2.0.0

5. **Acesse no navegador:**
   ```
   http://127.0.0.1:5100
   ```

## 📋 Funcionalidades

- ✅ Controle de ordens de serviço
- ✅ Gestão de estoque por região
- ✅ Geração de PDFs com layout profissional
- ✅ Sistema de diárias e quantidades
- ✅ Campo de observações nas O.S.
- ✅ Tipos de fiscal (Contrato/Técnico)
- ✅ Impressão direta do navegador

## 🛠️ Desenvolvimento

### Estrutura de Pastas

- **`backend/`**: Contém toda a lógica do servidor Flask
  - **`migrations/`**: Scripts para migração e atualização do banco de dados
  - **`tests/`**: Arquivos de teste automatizados
  - **`utils/`**: Scripts utilitários para manutenção e diagnóstico
- **`docs/`**: Documentação completa do projeto e correções
- **`frontend/`**: Arquivos estáticos do frontend (HTML, CSS, JS)
- **`scripts/`**: Scripts auxiliares e de importação de dados

### Principais Arquivos

- `backend/app.py`: Ponto de entrada da aplicação
- `backend/models.py`: Definições do banco de dados
- `frontend/index.html`: Interface principal
- `frontend/app.js`: Lógica do frontend
- `docs/README.md`: Documentação detalhada

## 📖 Documentação

Toda a documentação está organizada na pasta `docs/`:
- Guias de diagnóstico e solução de problemas
- Histórico de correções implementadas
- Guias de migração e atualização

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é propriedade da equipe de desenvolvimento.</content>
<parameter name="filePath">c:\Users\bruno.vargas\Desktop\PROJETOS\controle-itens-eventos\README.md