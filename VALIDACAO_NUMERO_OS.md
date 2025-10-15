# 🧪 TESTE DE VALIDAÇÃO - CORREÇÃO DO NÚMERO DA O.S.

## ❌ Problema Identificado
O sistema estava mostrando número de O.S. que já existe (1/2025) ao tentar emitir uma nova ordem.

## ✅ Correção Aplicada

### O que foi corrigido:

1. **Função `visualizarOS()` modificada** (app.js linha ~491):
   - Agora é `async function`
   - Busca o próximo número disponível do backend ANTES de gerar o preview
   - Só busca número novo se NÃO estiver editando (evita mudar número de O.S. existente)

2. **Código antes:**
```javascript
function visualizarOS() {
    const dadosOS = coletarDadosOS();
    const preview = gerarPreviewOS(dadosOS);  // Usava proximoIdOS=1 fixo
}
```

3. **Código depois:**
```javascript
async function visualizarOS() {
    const dadosOS = coletarDadosOS();
    
    // 🔢 Buscar próximo número do backend se for nova O.S.
    if (!osEditandoId) {
        const response = await fetch('http://localhost:5100/api/ordens-servico/proximo-numero');
        const data = await response.json();
        dadosOS.numeroOS = data.proximoNumero;  // ✅ Número correto do backend
    }
    
    const preview = gerarPreviewOS(dadosOS);
}
```

## 📋 Como Testar

### Teste 1: Verificar Próximo Número via API
```powershell
Invoke-WebRequest -Uri "http://localhost:5100/api/ordens-servico/proximo-numero" | Select-Object -ExpandProperty Content
```
**Resultado Esperado:**
```json
{
  "proximoNumero": "2/2025"
}
```

### Teste 2: Criar Nova O.S. pelo Sistema

#### Passo 1: Abrir o Sistema
- Navegue para: http://localhost:5100
- Clique na aba "Emitir Ordem de Serviço"

#### Passo 2: Preencher Formulário (dados mínimos)
- **Contrato Nº:** 014/DA/2024
- **Data Assinatura:** 15/01/2024
- **Prazo Vigência:** 31/12/2025
- **Detentora:** Empresa Teste
- **CNPJ:** 12.345.678/0001-99
- **Serviço:** Fornecimento de Alimentação
- **Grupo:** Alimentação Escolar
- **Evento:** TESTE VALIDAÇÃO NUMERO
- **Data Evento:** 14/10/2025
- **Horário:** 10:00
- **Local:** Sala de Testes
- **Justificativa:** Teste de validação
- **Gestor:** João Silva
- **Fiscal:** Maria Santos

#### Passo 3: Adicionar Item
- Clique em "➕ Adicionar Item"
- **Categoria:** Kit Lanche
- **Item:** Kit Lanche
- **Quantidade:** 30

#### Passo 4: Visualizar Preview
- Clique em "👁️ Visualizar O.S."
- **✅ VERIFICAR:** O número mostrado deve ser **"2/2025"** (NÃO "1/2025")
- **Localização:** Canto superior direito do preview, abaixo de "DATA DE EMISSÃO"

#### Passo 5: Confirmar Criação
- Clique em "Confirmar e Emitir"
- Aguarde mensagem de sucesso
- **✅ VERIFICAR:** Sistema deve mudar automaticamente para aba "Ordens de Serviço Emitidas"
- **✅ VERIFICAR:** Nova O.S. "2/2025" deve aparecer na lista

#### Passo 6: Verificar no Banco
```powershell
cd backend
.\venv\Scripts\python.exe verificar_os_banco.py
```

**Resultado Esperado:**
```
📊 Total de O.S. no banco: 2

🆔 ID: 1
📄 Número O.S.: 1/2025
📅 Evento: EDIÇÃO INTERFACE - 1760366380
...

🆔 ID: 2
📄 Número O.S.: 2/2025
📅 Evento: TESTE VALIDAÇÃO NUMERO
...
```

### Teste 3: Criar Terceira O.S.
- Repita passos 2-6 com dados diferentes
- **✅ VERIFICAR:** Número no preview deve ser **"3/2025"**
- **✅ VERIFICAR:** Após criação, banco deve ter 3 O.S. (1/2025, 2/2025, 3/2025)

### Teste 4: Editar O.S. Existente (garantir que número não muda)
- Na aba "Ordens de Serviço Emitidas"
- Clique em "✏️" de uma O.S. existente (ex: 1/2025)
- Modifique algum campo (ex: Local)
- Clique em "👁️ Visualizar"
- **✅ VERIFICAR:** Número deve continuar sendo **"1/2025"** (não deve mudar)
- Clique em "💾 Salvar e Fechar"
- **✅ VERIFICAR:** Número da O.S. permanece inalterado

## 🔍 Pontos de Atenção

### Console do Navegador (F12)
Durante o teste, verifique no console:

```
🔢 Próximo número obtido do backend: 2/2025
```

Se aparecer erro:
```
❌ Erro ao buscar próximo número: ...
```
**Solução:** Verificar se servidor Flask está rodando em http://localhost:5100

### Logs do Servidor Flask
No terminal onde Flask está rodando, você deve ver:

```
🔢 Número da O.S. gerado automaticamente: 2/2025
📊 O.S. criada com sucesso! ID: 2
```

## ✅ Checklist de Validação

- [ ] Endpoint `/proximo-numero` retorna "2/2025"
- [ ] Preview de nova O.S. mostra "2/2025" (não "1/2025")
- [ ] Nova O.S. é criada com sucesso (sem erro UNIQUE)
- [ ] Sistema muda para aba "Ordens de Serviço Emitidas"
- [ ] Nova O.S. aparece na lista
- [ ] Banco de dados mostra 2 O.S. (1/2025 e 2/2025)
- [ ] Terceira O.S. criada mostra "3/2025"
- [ ] Editar O.S. existente mantém o número original

## 🐛 Se Algo Der Errado

### Erro: "UNIQUE constraint failed"
- **Causa:** Servidor Flask não foi reiniciado
- **Solução:** 
  ```powershell
  # Terminal do Flask: Ctrl+C para parar
  cd backend
  .\venv\Scripts\python.exe app.py
  ```

### Erro: Preview ainda mostra "1/2025"
- **Causa:** Cache do navegador
- **Solução:** Ctrl+Shift+R (reload forçado) ou limpar cache

### Erro: "Erro ao buscar próximo número"
- **Causa:** Servidor não está acessível
- **Solução:** Verificar se Flask rodando em http://localhost:5100

### Número não incrementa
- **Causa:** Banco não está salvando
- **Solução:** Verificar logs do Flask no terminal

## 📊 Estado Atual do Sistema

### Banco de Dados
- **Total de O.S.:** 1
- **Número existente:** 1/2025
- **Próximo disponível:** 2/2025

### Arquivos Modificados
1. `backend/static/js/app.js` (linha ~491)
   - Função `visualizarOS()` agora busca número do backend

2. `backend/routes/os_routes.py` 
   - Função `gerar_proximo_numero_os()` (auto-increment)
   - Endpoint GET `/proximo-numero`
   - POST `/` modificado para gerar número automaticamente

### Servidor
- **URL:** http://127.0.0.1:5100
- **Status:** 🟢 Rodando
- **Debug:** Ativado

## 📝 Notas Importantes

1. **O número NÃO vem mais do frontend** - Frontend apenas busca o próximo número para mostrar no preview, mas o backend ignora qualquer valor enviado e gera automaticamente.

2. **Reset anual** - Em 2026, a contagem recomeça (1/2026, 2/2026...).

3. **Edição preserva número** - Ao editar O.S. existente, o `if (!osEditandoId)` garante que não busca novo número.

4. **Concorrência** - Se 2 usuários criarem O.S. simultaneamente, pode haver conflito (solução avançada necessária para produção).

---

**✅ Correção aplicada e servidor reiniciado!**
**🧪 Pronto para testes!**
