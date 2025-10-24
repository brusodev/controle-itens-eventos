# 🔐 Sistema de Autenticação e Gerenciamento de Usuários

## 📋 Visão Geral

Sistema completo de login e controle de usuários para o Controle de Itens de Eventos com:
- ✅ Autenticação com email e senha (hash seguro)
- ✅ Gerenciamento de usuários no banco de dados
- ✅ Controle de sessão
- ✅ Auditoria (último acesso, data de criação)
- ✅ Papéis/Cargos de usuários
- ✅ Status ativo/inativo

## 🗄️ Modelo de Dados - Tabela `usuarios`

```sql
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    cargo VARCHAR(100),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso DATETIME NULL
);
```

### Campos:
- **id**: Identificador único
- **nome**: Nome completo do usuário
- **email**: Email único para login
- **senha_hash**: Senha criptografada (PBKDF2:SHA256)
- **cargo**: Função do usuário (ex: Gestor, Operador, Fiscal)
- **ativo**: Se o usuário pode acessar o sistema
- **criado_em**: Timestamp de criação
- **atualizado_em**: Timestamp da última atualização
- **ultimo_acesso**: Timestamp do último login

## 🚀 Configuração Inicial

### 1. Criar o Primeiro Usuário Admin

Execute na pasta `backend/`:

```bash
python criar_admin.py
```

Este script irá:
1. Solicitar nome completo
2. Solicitar email
3. Solicitar senha (com confirmação)
4. Criar o usuário no banco de dados

Exemplo de execução:
```
==================================================
  Criando Novo Usuário Admin
==================================================

Nome completo: Bruno Vargas
Email: bruno@empresa.com
Senha (mínimo 6 caracteres): ••••••
Confirme a senha: ••••••
Cargo (pressione Enter para pular): Gestor

==================================================
  ✅ Usuário Criado com Sucesso!
==================================================
Nome: Bruno Vargas
Email: bruno@empresa.com
Cargo: Gestor
ID: 1
```

### 2. Acessar o Sistema

1. Acesse: `http://127.0.0.1:5100/auth/login`
2. Insira email e senha
3. Sistema redireciona para home se login for bem-sucedido

## 🔗 Rotas de Autenticação

### Autenticação

#### `POST /auth/login`
Faz login do usuário

**Request:**
```json
{
    "email": "bruno@empresa.com",
    "senha": "minhasenha123"
}
```

**Response (Sucesso - 200):**
```json
{
    "sucesso": true,
    "usuario": {
        "id": 1,
        "nome": "Bruno Vargas",
        "email": "bruno@empresa.com",
        "cargo": "Gestor",
        "ativo": true,
        "criadoEm": "2025-10-21T10:30:00",
        "ultimoAcesso": "2025-10-21T14:45:00"
    }
}
```

**Response (Erro - 401/403):**
```json
{
    "erro": "Email ou senha incorretos"
}
```

---

#### `GET /auth/logout`
Faz logout do usuário (limpa sessão)

**Response:**
Redireciona para página de login

---

#### `GET /auth/login`
Exibe página de login (GET)

---

### Gerenciamento de Usuários

#### `GET /api/usuarios`
Lista todos os usuários (requer autenticação)

**Response:**
```json
[
    {
        "id": 1,
        "nome": "Bruno Vargas",
        "email": "bruno@empresa.com",
        "cargo": "Gestor",
        "ativo": true,
        "criadoEm": "2025-10-21T10:30:00",
        "ultimoAcesso": "2025-10-21T14:45:00"
    },
    ...
]
```

---

#### `GET /api/usuarios/<id>`
Obtém dados de um usuário específico

---

#### `GET /api/me`
Obtém dados do usuário logado

**Response:**
```json
{
    "id": 1,
    "nome": "Bruno Vargas",
    "email": "bruno@empresa.com",
    "cargo": "Gestor",
    "ativo": true,
    "criadoEm": "2025-10-21T10:30:00",
    "ultimoAcesso": "2025-10-21T14:45:00"
}
```

---

#### `PUT /api/usuarios/<id>`
Atualiza dados de um usuário

**Request:**
```json
{
    "nome": "Bruno Silva Vargas",
    "cargo": "Diretor",
    "ativo": true,
    "senha": "novaSenha123"
}
```

**Response:**
```json
{
    "sucesso": true,
    "usuario": {
        "id": 1,
        "nome": "Bruno Silva Vargas",
        "email": "bruno@empresa.com",
        "cargo": "Diretor",
        "ativo": true,
        "criadoEm": "2025-10-21T10:30:00",
        "ultimoAcesso": "2025-10-21T14:45:00"
    }
}
```

---

#### `DELETE /api/usuarios/<id>`
Deleta um usuário

**Response:**
```json
{
    "sucesso": true,
    "mensagem": "Usuário deletado com sucesso"
}
```

---

#### `POST /api/alterar-senha`
Altera a senha do usuário logado

**Request:**
```json
{
    "senhaAtual": "senhaAntiga123",
    "senhaNova": "novaSenha456"
}
```

**Response:**
```json
{
    "sucesso": true,
    "mensagem": "Senha alterada com sucesso"
}
```

---

#### `POST /auth/registro`
Cria novo usuário

**Request:**
```json
{
    "nome": "João Silva",
    "email": "joao@empresa.com",
    "senha": "senha123",
    "cargo": "Operador"
}
```

**Response (201):**
```json
{
    "sucesso": true,
    "mensagem": "Usuário criado com sucesso",
    "usuario": {
        "id": 2,
        "nome": "João Silva",
        "email": "joao@empresa.com",
        "cargo": "Operador",
        "ativo": true,
        "criadoEm": "2025-10-21T15:00:00",
        "ultimoAcesso": null
    }
}
```

## 🔒 Segurança

### Implementações de Segurança

1. **Hash de Senha**: PBKDF2 com SHA256
   - Método seguro recomendado pelo OWASP
   - Senhas nunca são armazenadas em texto plano

2. **Sessão Segura**
   - Baseada em cookies HTTP
   - Requer SECRET_KEY configurado
   - Validação de autenticação em cada requisição

3. **Validações**
   - Email único no banco
   - Senha mínima de 6 caracteres
   - Email deve ser válido

4. **Decorador `@login_requerido`**
   - Protege rotas que exigem autenticação
   - Redireciona para login se não autenticado

## 📝 Arquivo: `models.py`

Modelo de usuário:
```python
class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    senha_hash = db.Column(db.String(255), nullable=False)
    cargo = db.Column(db.String(100), nullable=True)
    ativo = db.Column(db.Boolean, default=True)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    atualizado_em = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ultimo_acesso = db.Column(db.DateTime, nullable=True)
    
    def set_senha(self, senha):
        """Define a senha com hash"""
        self.senha_hash = generate_password_hash(senha, method='pbkdf2:sha256')
    
    def verificar_senha(self, senha):
        """Verifica se a senha está correta"""
        return check_password_hash(self.senha_hash, senha)
```

## 📁 Arquivo: `routes/auth_routes.py`

Contém:
- Rotas de autenticação (login, logout, registro)
- Rotas de gerenciamento de usuários
- Decorador `@login_requerido` para proteção de rotas

## 🎨 Arquivo: `templates/login.html`

- Página de login responsiva
- Design moderno com gradiente
- Validação frontend
- "Lembrar-me" com localStorage
- Feedback visual (loading, erros, sucesso)

## 💾 Arquivo: `criar_admin.py`

Script para criar o primeiro usuário admin:
```bash
python criar_admin.py
```

## 🔄 Integração com Rotas Existentes

### Proteger Rotas

Para proteger uma rota existente, adicione o decorador:

```python
from routes.auth_routes import login_requerido

@app.route('/minhaRota')
@login_requerido
def minha_funcao():
    usuario_id = session['usuario_id']
    usuario = Usuario.query.get(usuario_id)
    return render_template('template.html', usuario=usuario)
```

### Acessar Dados do Usuário Logado

```python
from flask import session

# Dentro de uma rota
usuario_id = session.get('usuario_id')
usuario_nome = session.get('usuario_nome')
usuario_email = session.get('usuario_email')
usuario_cargo = session.get('usuario_cargo')
```

### Verificar Autenticação no Template

```html
{% if session.usuario_id %}
    <p>Olá, {{ session.usuario_nome }}!</p>
    <a href="/auth/logout">Sair</a>
{% else %}
    <a href="/auth/login">Login</a>
{% endif %}
```

## 🐛 Troubleshooting

### "Email já cadastrado"
O email inserido já existe no banco. Use outro email ou use `/api/usuarios/<id>` para atualizar.

### "Senha deve ter no mínimo 6 caracteres"
A senha é muito curta. Mínimo 6 caracteres.

### "Você não pode deletar sua própria conta"
Não é possível deletar o próprio usuário. Peça a outro admin para deletar.

### "Usuário inativo"
O usuário foi desativado. Um admin precisa ativar usando `PUT /api/usuarios/<id>`.

## 📊 Próximas Melhorias (Futuro)

- [ ] Autenticação com 2FA (Google Authenticator)
- [ ] OAuth2/SSO (Google, Microsoft)
- [ ] Permissões granulares por role
- [ ] Auditoria detalhada de ações
- [ ] API para gerenciar grupos de usuários
- [ ] Recuperação de senha por email
- [ ] Bloqueio de conta após tentativas falhas

---

**Versão**: 1.0
**Data**: Outubro 2025
**Status**: ✅ Pronto para Produção (com ajustes de segurança)
