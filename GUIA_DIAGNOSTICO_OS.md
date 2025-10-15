# 🔍 Guia de Diagnóstico: O.S. Não Aparece na Lista

## ✅ Passo 1: Verificar se o Servidor Está Rodando

Execute no terminal:
```powershell
cd backend
.\venv\Scripts\python.exe app.py
```

Deve aparecer algo como:
```
* Running on http://127.0.0.1:5100
```

## ✅ Passo 2: Verificar O.S. no Banco de Dados

Execute:
```powershell
cd backend
.\venv\Scripts\python.exe verificar_os_banco.py
```

**Resultado atual**: Apenas 1 O.S. no banco (ID: 1)

## ✅ Passo 3: Testar Criação via Navegador

1. Abra o navegador
2. Pressione **F12** para abrir DevTools
3. Vá para aba **"Console"**
4. Vá para aba **"Emitir O.S."** no sistema
5. Preencha o formulário
6. Clique em "👁️ Visualizar O.S."
7. Clique em "✅ Confirmar e Emitir"

### O que DEVE aparecer no console:

```javascript
🔍 confirmarEmissaoOS - Modo: CRIAÇÃO
📋 osEditandoId: null
📝 Dados coletados do formulário: {...}
🚀 Dados para enviar à API: {...}
📡 Enviando POST para /api/ordens-servico/
✅ Resposta da API: {...}
🔄 Recarregando alimentação...
🔄 Recarregando lista de O.S. do banco...
📡 filtrarOS: API retornou X O.S.
📂 Nova O.S. criada - mudando para aba "Ordens de Serviço"
```

### O que NÃO deve aparecer:

```javascript
❌ Erro ao emitir O.S.: ...
```

## ✅ Passo 4: Verificar Aba Network (Rede)

1. No DevTools, vá para aba **"Network"** (Rede)
2. Tente criar uma nova O.S.
3. Procure pela requisição **POST** para `/api/ordens-servico/`
4. Clique nela
5. Verifique:
   - **Status**: Deve ser **201 Created**
   - **Response**: Deve ter os dados da O.S. criada

### Status possíveis:

- **201 Created** ✅ - O.S. criada com sucesso
- **400 Bad Request** ❌ - Dados inválidos
- **404 Not Found** ❌ - Item não encontrado
- **500 Internal Server Error** ❌ - Erro no servidor

## ✅ Passo 5: Verificar Logs do Servidor Flask

No terminal onde o Flask está rodando, deve aparecer:

```
127.0.0.1 - - [14/Oct/2025 10:30:00] "POST /api/ordens-servico/ HTTP/1.1" 201 -
```

Se aparecer **500**, tem erro no servidor.

## 🐛 Possíveis Problemas

### Problema 1: Erro no JavaScript
**Sintoma**: Console mostra "❌ Erro ao emitir O.S."
**Solução**: Copie o erro exato e me envie

### Problema 2: Requisição não chega ao servidor
**Sintoma**: Network tab não mostra POST
**Solução**: Verifique se servidor está rodando

### Problema 3: Servidor retorna erro 500
**Sintoma**: Status 500 no Network tab
**Solução**: Verifique logs do Flask no terminal

### Problema 4: O.S. criada mas lista não atualiza
**Sintoma**: POST retorna 201, mas lista vazia
**Solução**: Verifique se GET /api/ordens-servico/ está sendo chamado

### Problema 5: Lista atualiza mas não muda de aba
**Sintoma**: O.S. criada, mas permanece em "Emitir O.S."
**Solução**: ✅ JÁ CORRIGIDO! (eraEdicao flag)

## 🧪 Teste Manual Rápido

Execute este comando no console do navegador (F12):

```javascript
// Testar se a API está respondendo
fetch('http://localhost:5100/api/ordens-servico/')
  .then(r => r.json())
  .then(data => console.log('✅ Total de O.S.:', data.length, data))
  .catch(e => console.error('❌ Erro:', e));
```

**Resultado esperado**: Deve mostrar array com as O.S.

## 📋 Checklist

Marque conforme testa:

- [ ] Servidor Flask rodando
- [ ] Console do navegador aberto (F12)
- [ ] Aba Network (Rede) aberta
- [ ] Formulário preenchido
- [ ] Clicou em "Confirmar e Emitir"
- [ ] Verificou mensagens no console
- [ ] Verificou requisição POST no Network
- [ ] Verificou status da resposta (201?)
- [ ] Executou verificar_os_banco.py antes
- [ ] Executou verificar_os_banco.py depois
- [ ] Comparou total de O.S. (aumentou?)

## 🎯 Me Envie

Para eu poder ajudar melhor, me envie:

1. **Mensagens do Console** (copie TUDO que aparece)
2. **Status da requisição POST** (200? 201? 400? 500?)
3. **Resposta da API** (aba Response no Network)
4. **Total de O.S. antes e depois** (execute verificar_os_banco.py)

## 🔧 Scripts de Teste

### Verificar banco antes:
```powershell
cd backend
.\venv\Scripts\python.exe verificar_os_banco.py
```

### Criar O.S. e verificar depois:
1. Crie O.S. pelo navegador
2. Execute novamente:
```powershell
.\venv\Scripts\python.exe verificar_os_banco.py
```

### Comparar resultados:
- **Antes**: 1 O.S.
- **Depois**: Deve ter 2 O.S. (se criou nova)

Se não aumentou = O.S. não foi salva no banco!
