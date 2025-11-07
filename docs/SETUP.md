# 🚀 Controle de Itens de Eventos - Guia de Inicialização

## 📋 Pré-requisitos

- **Python 3.8+** instalado ([Baixar Python](https://www.python.org/downloads/))
- **Windows PowerShell** 5.0+
- Permissão para executar scripts PowerShell

## 🔧 Configuração Rápida

### 1️⃣ Primeira Vez (Inicialização Completa)

Abra o **PowerShell** na pasta raiz do projeto e execute:

```powershell
.\init.ps1
```

Este script irá:
- ✅ Verificar se Python está instalado
- ✅ Criar ambiente virtual Python (venv)
- ✅ Instalar todas as dependências
- ✅ Inicializar o banco de dados SQLite

### 2️⃣ Criar Usuário Admin

Após a inicialização, navegue até a pasta backend e crie um usuário:

```powershell
cd backend
python criar_admin.py
cd ..
```

Siga as instruções na tela e forneça:
- Nome completo
- Email
- Senha (mínimo 6 caracteres)
- Cargo (opcional)

### 3️⃣ Iniciar o Servidor

Volte para a pasta raiz e execute:

```powershell
.\start.ps1
```

O servidor estará disponível em: **http://127.0.0.1:5100**

## 📁 Estrutura de Scripts

| Script | Função | Comando |
|--------|--------|---------|
| `init.ps1` | Inicialização completa do projeto | `.\init.ps1` |
| `start.ps1` | Inicia o servidor Flask | `.\start.ps1` |
| `clean.ps1` | Remove venv, cache e banco de dados | `.\clean.ps1` |

## 🗂️ Estrutura do Projeto

```
controle-itens-eventos/
├── backend/                    # Aplicação Python/Flask
│   ├── venv/                  # Ambiente virtual (criado por init.ps1)
│   ├── app.py                 # Aplicação principal
│   ├── models.py              # Modelos de banco de dados
│   ├── requirements.txt        # Dependências Python
│   ├── routes/                # Rotas da API
│   ├── static/                # CSS, JS, imagens
│   ├── templates/             # HTML (Jinja2)
│   └── instance/              # Banco de dados SQLite
├── init.ps1                   # Script de inicialização
├── start.ps1                  # Script para iniciar servidor
├── clean.ps1                  # Script para limpar ambiente
└── README.md                  # Este arquivo
```

## 🔄 Workflow Diário

```bash
# Dia 1 - Primeira vez
.\init.ps1          # Inicializa tudo
cd backend
python criar_admin.py  # Cria usuário admin
cd ..

# Dias seguintes
.\start.ps1         # Inicia o servidor

# Se precisar resetar
.\clean.ps1         # Remove ambiente
.\init.ps1          # Reinicializa
cd backend
python criar_admin.py  # Cria novo admin
cd ..
```

## 🐛 Solução de Problemas

### ❌ "Python não encontrado"
- Instale Python 3.8+ de https://www.python.org/downloads/
- Marque "Add Python to PATH" durante a instalação
- Reinicie o PowerShell

### ❌ "Erro ao executar script PowerShell"
Execute primeiro:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### ❌ "Porta 5100 já em uso"
Mude a porta em `backend/app.py`:
```python
app.run(debug=True, port=5101)  # Altere para outra porta
```

### ❌ "Banco de dados com erro"
Execute para resetar:
```powershell
.\clean.ps1    # Remove tudo
.\init.ps1     # Reinicializa
```

## 📊 Dependências Instaladas

| Pacote | Versão | Função |
|--------|--------|--------|
| Flask | 3.0.0 | Framework web |
| Flask-SQLAlchemy | 3.1.1 | ORM para banco de dados |
| Flask-CORS | 4.0.0 | Suporte CORS |
| python-dotenv | 1.0.0 | Variáveis de ambiente |
| reportlab | 4.0.7 | Geração de PDF |
| openpyxl | 3.1.2 | Manipulação de Excel |

## 🌐 Acessando a Aplicação

Após iniciar com `.\start.ps1`, acesse:

- **Interface Web**: http://127.0.0.1:5100
- **API Base**: http://127.0.0.1:5100/api

## 📝 Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/` para configurações locais:

```env
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=sqlite:///controle_itens.db
```

## ✨ Funcionalidades Principais

- 📦 Gestão de Estoque
- 🍽️ Controle de Coffee Break
- 📄 Emissão de Ordens de Serviço
- 📊 Relatórios e Análises
- 📥 Exportação de dados (PDF/Excel)

## 🤝 Suporte

Em caso de problemas:
1. Verifique os logs no terminal
2. Limpe o ambiente com `.\clean.ps1`
3. Reinicialize com `.\init.ps1`

## 📄 Licença

Projeto interno - Todos os direitos reservados
