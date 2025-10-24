# ✅ Guia Rápido de Inicialização

## Passo 1: Inicializar Projeto

Na pasta raiz, execute:
```powershell
.\init.ps1
```

Espere até completar (pode levar alguns minutos na primeira vez)

## Passo 2: Criar Usuário Admin

Navegue para a pasta backend:
```powershell
cd backend
python criar_admin.py
```

Siga as instruções na tela:
- **Nome completo**: ex. "Bruno Vargas"
- **Email**: ex. "bruno@empresa.com"  
- **Senha**: mínimo 6 caracteres (ex. "Senha123")
- **Cargo** (opcional): ex. "Gestor" (pressione Enter para pular)

Exemplo:
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

Você pode fazer login com essas credenciais
```

## Passo 3: Voltar para Raiz e Iniciar Servidor

```powershell
cd ..
.\start.ps1
```

A aplicação estará disponível em:
```
http://127.0.0.1:5100
```

## Passo 4: Fazer Login

Na página de login, insira:
- **Email**: o email que você configurou
- **Senha**: a senha que você criou

Clique em "Entrar"

---

## 🔄 Próximas Vezes

Basta executar:
```powershell
.\start.ps1
```

E acessar: http://127.0.0.1:5100

---

## ❌ Se Algo Der Errado

### Erro ao iniciar o servidor?
Verifique se a porta 5100 está disponível. Se estiver ocupada, edite `backend/app.py`:
```python
app.run(debug=True, port=5101)  # Mude para outra porta
```

### Esqueceu a senha?

1. Delete o arquivo `backend/instance/controle_itens.db`
2. Execute `.\clean.ps1` para limpar tudo
3. Execute `.\init.ps1` novamente
4. Crie novo usuário com `python criar_admin.py`

### Módulos não encontrados?
Certifique-se de que o venv está ativado. Se não:
```powershell
.\backend\venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

---

## 📞 Suporte

Se precisar de ajuda, consulte:
- `SETUP.md` - Documentação completa
- `SISTEMA_AUTENTICACAO.md` - Sistema de login
- `README.md` - Informações do projeto
