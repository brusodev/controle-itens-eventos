# 🚀 Guia de Instalação Detalhado

**Versão**: 2.0.0  
**Data**: Novembro 2025  
**Plataformas**: Windows, Linux, macOS

## 📋 Pré-requisitos

### Obrigatórios
- **Python 3.8+** ([Download](https://www.python.org/downloads/))
- **pip** (gerenciador de pacotes - incluso com Python)
- **Git** (opcional, para clonar repositório)

### Recomendado
- **Visual Studio Code** ou outro editor
- **1GB RAM mínimo**
- **100MB espaço em disco**

### Verificar Instalação

```bash
# Verificar Python
python --version
# Esperado: Python 3.8.x ou superior

# Verificar pip
pip --version
# Esperado: pip 21.x ou superior
```

## 🔧 Instalação Passo a Passo

### 1️⃣ Clonar ou Baixar Projeto

#### Opção A: Via Git (recomendado)
```bash
git clone <URL_DO_REPOSITORIO>
cd controle-itens-eventos
```

#### Opção B: Download manual
1. Baixar ZIP do repositório
2. Extrair em pasta desejada
3. Abrir terminal na pasta

### 2️⃣ Criar Ambiente Virtual

Ambiente virtual isola as dependências do projeto.

#### Windows (PowerShell)
```powershell
# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
.\venv\Scripts\Activate.ps1

# Verificar ativação (deve aparecer (venv) no terminal)
```

#### Windows (Command Prompt)
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

#### Linux/macOS (Bash)
```bash
python3 -m venv venv
source venv/bin/activate
```

✅ **Sucesso**: Terminal mostra `(venv)` no início da linha

### 3️⃣ Instalar Dependências

```bash
# Entrar na pasta backend
cd backend

# Instalar requirements
pip install -r requirements.txt

# Verificar instalação
pip list
```

**Tempo esperado**: 2-5 minutos

**Dependências principais**:
```
Flask==2.3.2
Flask-SQLAlchemy==3.0.5
Flask-Login==0.6.2
ReportLab==4.0.7
```

### 4️⃣ Inicializar Banco de Dados

```bash
# Ainda dentro de /backend com (venv) ativo
python init_db.py
```

**Saída esperada**:
```
Banco de dados criado com sucesso!
Tabelas criadas: usuario, categoria, itens, ...
```

**Arquivo criado**: `instance/controle_items.db` (~500KB)

### 5️⃣ Criar Usuário Admin

```bash
# Dentro de /backend com (venv) ativo
python -c "from app import app, db, Usuario; app.app_context().push(); u = Usuario(email='admin@example.com', perfil='ADMIN'); u.set_senha('admin123'); db.session.add(u); db.session.commit(); print('Admin criado: admin@example.com / admin123')"
```

**Alternativa (mais fácil)**:
```bash
python scripts/admin/criar_admin.py
```

**Saída esperada**:
```
Admin criado com sucesso!
Email: admin@example.com
Senha: admin123
```

### 6️⃣ Iniciar Servidor

```bash
# Ainda dentro de /backend com (venv) ativo
python app.py
```

**Saída esperada**:
```
 * Running on http://127.0.0.1:5100
 * Debug mode: on
 * WARNING in werkzeug: Do not use the development server in a production deployment
```

✅ **Sucesso**: Servidor rodando em `http://localhost:5100`

### 7️⃣ Acessar Sistema

1. Abrir navegador
2. Ir para `http://localhost:5100`
3. Login com:
   - Email: `admin@example.com`
   - Senha: `admin123`

## 🐛 Troubleshooting

### ❌ Erro: "ModuleNotFoundError: No module named 'flask'"

**Causa**: Ambiente virtual não ativado

**Solução**:
```bash
# Windows
.\venv\Scripts\Activate.ps1

# Linux/Mac
source venv/bin/activate

# Verificar (venv) no terminal
```

### ❌ Erro: "Port 5100 already in use"

**Causa**: Porta já está sendo usada

**Solução Windows**:
```powershell
# Encontrar processo usando porta 5100
netstat -ano | findstr :5100

# Fechar processo (substitua PID)
taskkill /PID 12345 /F

# Ou mudar porta no app.py
```

**Solução Linux/Mac**:
```bash
# Encontrar processo
lsof -i :5100

# Fechar processo
kill -9 <PID>
```

### ❌ Erro: "FileNotFoundError: instance/controle_items.db"

**Causa**: Banco não foi inicializado

**Solução**:
```bash
# Certifique-se de estar em /backend
pwd  # Linux/Mac: deve estar em .../controle-itens-eventos/backend

# Rodar init_db.py
python init_db.py
```

### ❌ Erro: "No module named 'utils.auditoria'"

**Causa**: Arquivo auditoria.py não existe

**Solução**:
```bash
# Verificar se arquivo existe
ls backend/utils/auditoria.py  # Linux/Mac
dir backend\utils\auditoria.py  # Windows

# Se não existir, copiar do backup
cp docs/backup/auditoria.py backend/utils/auditoria.py
```

### ❌ Erro: "Database locked"

**Causa**: Múltiplas instâncias acessando banco

**Solução**:
```bash
# Fechar todas as abas/instâncias do navegador
# Fechar servidor (Ctrl+C)
# Remover banco antigo
rm instance/controle_items.db

# Reinicializar
python init_db.py
python app.py
```

## 🔐 Segurança (Importante!)

### Antes de Colocar em Produção

1. **Mudar senha padrão**
```bash
python
>>> from app import app, db, Usuario
>>> app.app_context().push()
>>> u = Usuario.query.filter_by(email='admin@example.com').first()
>>> u.set_senha('NOVA_SENHA_SUPER_SEGURA')
>>> db.session.commit()
>>> exit()
```

2. **Gerar SECRET_KEY segura**
```bash
python
>>> import secrets
>>> secrets.token_hex(32)
'abc123def456...'
>>> exit()
```

3. **Atualizar `app.py`**
```python
app.config['SECRET_KEY'] = 'YOUR_GENERATED_SECRET_KEY'
```

4. **Desabilitar DEBUG em produção**
```python
# Em app.py, antes de app.run()
# if __name__ == '__main__':
#     app.run(debug=False)  # ← Mudar para False
```

## 📊 Configuração Avançada

### Usar PostgreSQL em Produção

1. **Instalar PostgreSQL** e criar banco

```bash
createdb controle_items
```

2. **Instalar driver PostgreSQL**

```bash
pip install psycopg2-binary
```

3. **Atualizar `app.py`**

```python
# Antes:
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/controle_items.db'

# Depois:
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://usuario:senha@localhost:5432/controle_items'
```

4. **Reinicializar banco**

```bash
python init_db.py
```

### Variáveis de Ambiente

Criar arquivo `.env` na raiz:

```bash
# .env
FLASK_ENV=production
FLASK_DEBUG=0
SECRET_KEY=seu_secret_key_seguro
DATABASE_URL=sqlite:///instance/controle_items.db
# ou para PostgreSQL:
# DATABASE_URL=postgresql://user:pass@localhost/db
```

Atualizar `app.py`:
```python
import os
from dotenv import load_dotenv

load_dotenv()

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
```

Instalar dotenv:
```bash
pip install python-dotenv
```

## 📈 Executar em Background (Produção)

### Windows - NSSM (Non-Sucking Service Manager)

```bash
# Download NSSM
# https://nssm.cc/download

# Instalar serviço
nssm install controle-itens C:\path\to\venv\Scripts\python.exe C:\path\to\app.py

# Iniciar
nssm start controle-itens

# Parar
nssm stop controle-itens
```

### Linux - Systemd

Criar `/etc/systemd/system/controle-itens.service`:

```ini
[Unit]
Description=Controle de Itens de Eventos
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/user/controle-itens-eventos/backend
ExecStart=/home/user/controle-itens-eventos/venv/bin/python app.py
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Executar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable controle-itens
sudo systemctl start controle-itens
sudo systemctl status controle-itens
```

### Linux - Supervisor

Instalar:
```bash
pip install supervisor
```

Criar `/etc/supervisor/conf.d/controle-itens.conf`:

```ini
[program:controle-itens]
command=/home/user/controle-itens-eventos/venv/bin/python /home/user/controle-itens-eventos/backend/app.py
directory=/home/user/controle-itens-eventos/backend
user=www-data
autostart=true
autorestart=true
```

## 🔄 Atualizações

### Atualizar Código

```bash
# Dentro da pasta do projeto
git pull origin main

# Atualizar dependências (se houver)
pip install -r backend/requirements.txt

# Migrar banco (se houver alterações)
python backend/init_db.py
```

### Backup Antes de Atualizar

```bash
# Fazer backup do banco
cp backend/instance/controle_items.db backend/instance/controle_items_backup_$(date +%Y%m%d).db
```

## 📞 Suporte

### Problema durante instalação?

1. Verificar Python: `python --version`
2. Verificar pip: `pip --version`
3. Verificar ambiente virtual: `(venv)` deve aparecer
4. Verificar dependências: `pip list | grep Flask`
5. Verificar banco: `ls backend/instance/`

### Logs detalhados

Editar `app.py`:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Executar e procurar por erros no console

## ✅ Checklist de Sucesso

- [x] Python 3.8+ instalado
- [x] pip funcionando
- [x] Ambiente virtual criado e ativado
- [x] Dependências instaladas
- [x] Banco de dados inicializado
- [x] Admin criado
- [x] Servidor rodando em localhost:5100
- [x] Login funcionando
- [x] Auditoria acessível (admin)
- [x] Items podem ser criados
- [x] O.S. podem ser emitidas
- [x] PDFs gerados corretamente

---

**Pronto para começar!** 🎉

Próximos passos:
1. Criar alguns itens de estoque
2. Criar uma O.S. de teste
3. Gerar PDF
4. Verificar auditoria
5. Explorar as funcionalidades

Dúvidas? Consulte [README.md](../README.md) e [docs/API.md](./API.md)

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
