# 📝 INSTRUÇÕES PARA SUBSTITUIR os_routes.py

## ✅ Arquivo Criado: `os_routes_novo.py`

O novo arquivo está completo e funcional com:
- ✅ Sistema de controle de estoque integrado
- ✅ Validações rigorosas de disponibilidade
- ✅ Rastreamento completo de movimentações
- ✅ Reversão automática ao editar/deletar
- ✅ Endpoint de relatório de estoque por região
- ✅ Código limpo e bem documentado

---

## 🔧 PASSOS PARA SUBSTITUIR

### **OPÇÃO 1: Substituição Simples (Recomendado)**

```powershell
# 1. Parar a aplicação se estiver rodando
# Ctrl+C no terminal onde o Flask está rodando

# 2. Fazer backup do arquivo antigo (já existe backup)
cd C:\Users\bruno.vargas\Desktop\PROJETOS\controle-itens-eventos\backend\routes

# 3. Renomear o arquivo antigo
Move-Item os_routes.py os_routes_old.py -Force

# 4. Renomear o novo arquivo
Move-Item os_routes_novo.py os_routes.py

# 5. Pronto! Agora iniciar a aplicação
cd ..
& "..\venv\Scripts\python.exe" app.py
```

### **OPÇÃO 2: Substituição Manual (Mais Segura)**

```powershell
# 1. Parar a aplicação

# 2. Abrir os dois arquivos lado a lado no VS Code
code routes\os_routes.py
code routes\os_routes_novo.py

# 3. Copiar TODO o conteúdo de os_routes_novo.py

# 4. Colar em os_routes.py (substituir tudo)

# 5. Salvar e iniciar a aplicação
```

---

## 🧪 TESTES APÓS SUBSTITUIÇÃO

### 1. Verificar se a aplicação inicia sem erros

```powershell
cd backend
& "..\venv\Scripts\python.exe" app.py
```

**Esperado**: Aplicação inicia sem erros
```
* Running on http://127.0.0.1:5100
```

### 2. Testar criação de O.S. com estoque suficiente

**Endpoint**: `POST http://127.0.0.1:5100/ordens-servico/`

**Body (exemplo)**:
```json
{
  "grupo": "1",
  "contrato": "001/2025",
  "detentora": "Empresa Teste",
  "evento": "Teste de Estoque",
  "itens": [
    {
      "categoria": "coffee_break",
      "itemId": "1",
      "descricao": "Café",
      "qtdTotal": 10
    }
  ]
}
```

**Esperado**: 
- ✅ O.S. criada com sucesso (status 201)
- ✅ Console mostra: "✅ N movimentações de estoque registradas"

### 3. Testar criação de O.S. SEM estoque suficiente

**Body**: Mesmo do teste 2, mas com `qtdTotal` muito alto (ex: 99999)

**Esperado**:
- ❌ Erro 400 (Bad Request)
- ❌ Mensagem detalhada: "Estoque insuficiente para..."

### 4. Verificar relatório de estoque

**Endpoint**: `GET http://127.0.0.1:5100/ordens-servico/estoque/regiao/1`

**Esperado**:
- ✅ JSON com lista de itens da região 1
- ✅ Mostra: inicial, gasto, disponível, percentual_usado, status

### 5. Verificar banco de dados

```powershell
sqlite3 instance\database.db
```

```sql
-- Ver tabela de movimentações
SELECT * FROM movimentacoes_estoque;

-- Ver O.S. com região
SELECT numero_os, grupo, regiao_estoque FROM ordens_servico;

-- Sair
.quit
```

**Esperado**:
- ✅ Tabela `movimentacoes_estoque` existe e tem dados
- ✅ Campo `regiao_estoque` preenchido nas O.S.

---

## 📊 NOVOS ENDPOINTS DISPONÍVEIS

### 1. Relatório de Estoque por Região
```
GET /ordens-servico/estoque/regiao/{regiao}
```

**Exemplo**: `GET /ordens-servico/estoque/regiao/3`

**Resposta**:
```json
{
  "regiao": 3,
  "itens": [
    {
      "item_descricao": "Café",
      "inicial": "1.000,00",
      "gasto": "250,50",
      "disponivel": "749,50",
      "percentual_usado": 25.05,
      "status": "OK"
    }
  ]
}
```

---

## 🔍 LOGS NO CONSOLE

Após substituir, você verá logs detalhados no console:

```
============================================================
📥 DADOS RECEBIDOS NA API - POST /ordens-servico/
============================================================
Grupo: 3
Itens recebidos: 2
...
🔢 Número da O.S. gerado automaticamente: 5/2025
🗺️  Região do estoque: 3

📦 Processando baixas de estoque para região 3...
✅ 2 movimentações de estoque registradas com sucesso!
✅ O.S. 5/2025 criada com sucesso!
```

---

## ⚠️ POSSÍVEIS ERROS E SOLUÇÕES

### Erro: "ModuleNotFoundError: No module named 'controle_estoque'"

**Solução**: Verificar se o arquivo `utils/controle_estoque.py` existe

```powershell
Test-Path backend\utils\controle_estoque.py
```

Se não existir, o arquivo foi criado anteriormente. Deve estar lá!

### Erro: "ErroEstoqueInsuficiente is not defined"

**Solução**: Verificar imports no início do arquivo

### Erro ao criar O.S.: "Grupo inválido"

**Solução**: Garantir que o campo `grupo` seja um número entre 1 e 6

---

## 📋 CHECKLIST FINAL

Antes de substituir:
- [ ] Migração executada com sucesso
- [ ] Arquivo `utils/controle_estoque.py` existe
- [ ] Aplicação parada

Após substituir:
- [ ] Aplicação inicia sem erros
- [ ] Teste de criação de O.S. funciona
- [ ] Teste de estoque insuficiente rejeita corretamente
- [ ] Relatório de estoque por região funciona
- [ ] Banco de dados tem dados de movimentações

---

## 🎉 PRONTO!

Após seguir esses passos, seu sistema estará 100% funcional com:
- ✅ Controle total de estoque
- ✅ Validações rigorosas
- ✅ Rastreamento completo
- ✅ Impossível ultrapassar estoque inicial
- ✅ Histórico de auditoria

---

**Sucesso! 🚀**
