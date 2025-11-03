# 🏢 Integração: Detentoras com Formulário de O.S.

## 📋 Resumo

O sistema agora integra o cadastro de **Detentoras** (empresas contratadas) com o formulário de **Emissão de Ordens de Serviço**, permitindo que todos os dados do contrato sejam preenchidos automaticamente ao selecionar o Grupo/Região.

---

## 🎯 Funcionalidade

### Fluxo de Trabalho

1. **Cadastrar Detentora** (Tela: 🏢 Detentoras)
   - Acessar menu lateral → 🏢 Detentoras
   - Clicar em "➕ Nova Detentora" (somente Admin)
   - Preencher:
     - **Grupo**: Selecionar de 1 a 10 (corresponde à Região do estoque)
     - **Contrato Nº**: Número do contrato (ex: 014/DA/2024)
     - **Data de Assinatura**: Data da assinatura do contrato
     - **Prazo de Vigência**: Prazo em meses (ex: 12 MESES)
     - **Nome da Detentora**: Razão social completa
     - **CNPJ**: Com formatação automática (00.000.000/0000-00)
     - **Serviço**: Tipo de serviço (padrão: COFFEE BREAK)
   - Salvar

2. **Emitir O.S. com Auto-Preenchimento** (Tela: 📝 Emitir O.S.)
   - Acessar menu lateral → 📝 Emitir O.S.
   - **Selecionar o Grupo/Região** (campo no topo do formulário)
   - ✅ **Todos os dados do contrato são preenchidos automaticamente**:
     - Contrato Nº
     - Data da Assinatura
     - Prazo de Vigência
     - Nome da Detentora
     - CNPJ
     - Serviço
     - Grupo (para vinculação ao estoque)
   - Preencher apenas os dados específicos do evento
   - Emitir O.S.

---

## 🔧 Alterações Técnicas

### Frontend (index.html)

**Antes:**
```html
<form id="form-emitir-os" class="form-card">
    <h3>Dados do Contrato</h3>
    <div class="form-row">
        <div class="form-group flex-1">
            <label for="os-contrato-num">Contrato Nº *</label>
            <input type="text" id="os-contrato-num" required>
        </div>
        ...
    </div>
</form>
```

**Depois:**
```html
<form id="form-emitir-os" class="form-card">
    <!-- Seletor de Grupo (carrega dados da Detentora) -->
    <div class="form-group" style="background: #f8f9fa; padding: 15px;">
        <label for="os-grupo-select">
            🏢 Selecione o Grupo/Região *
            <small>Os dados do contrato serão preenchidos automaticamente</small>
        </label>
        <select id="os-grupo-select" required onchange="carregarDadosDetentora()">
            <option value="">-- Selecione o Grupo --</option>
            <option value="1">Grupo 1</option>
            ...
            <option value="10">Grupo 10</option>
        </select>
    </div>

    <h3>Dados do Contrato</h3>
    <div class="form-row">
        <div class="form-group flex-1">
            <label for="os-contrato-num">Contrato Nº *</label>
            <input type="text" id="os-contrato-num" required readonly style="background-color: #e9ecef;">
        </div>
        ...
    </div>
</form>
```

**Mudanças:**
- ✅ Adicionado seletor de Grupo no topo do formulário
- ✅ Campos de contrato agora são `readonly` (preenchidos automaticamente)
- ✅ Background cinza claro (`#e9ecef`) indica campos não editáveis

---

### JavaScript (app.js)

**Nova Função: `carregarDadosDetentora()`**

```javascript
async function carregarDadosDetentora() {
    const grupoSelect = document.getElementById('os-grupo-select');
    const grupo = grupoSelect.value;
    
    if (!grupo) {
        limparCamposDetentora();
        return;
    }
    
    try {
        // Buscar detentora pelo grupo via API
        const detentora = await APIClient.obterDetentoraByGrupo(grupo);
        
        if (!detentora) {
            alert(`⚠️ Nenhuma Detentora cadastrada para o Grupo ${grupo}.`);
            grupoSelect.value = '';
            limparCamposDetentora();
            return;
        }
        
        // Preencher campos automaticamente
        document.getElementById('os-contrato-num').value = detentora.contratoNum || '';
        document.getElementById('os-data-assinatura').value = detentora.dataAssinatura || '';
        document.getElementById('os-prazo-vigencia').value = detentora.prazoVigencia || '';
        document.getElementById('os-detentora').value = detentora.nome || '';
        document.getElementById('os-cnpj').value = detentora.cnpj || '';
        document.getElementById('os-servico').value = detentora.servico || 'COFFEE BREAK';
        document.getElementById('os-grupo').value = grupo;
        
        // Atualizar estoques baseado no grupo
        atualizarTodosEstoques();
        
        // Feedback visual
        grupoSelect.style.borderColor = '#28a745';
        setTimeout(() => { grupoSelect.style.borderColor = ''; }, 2000);
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados da Detentora:', error);
        alert('Erro ao carregar dados da Detentora.');
    }
}

function limparCamposDetentora() {
    document.getElementById('os-contrato-num').value = '';
    document.getElementById('os-data-assinatura').value = '';
    document.getElementById('os-prazo-vigencia').value = '';
    document.getElementById('os-detentora').value = '';
    document.getElementById('os-cnpj').value = '';
    document.getElementById('os-servico').value = '';
    document.getElementById('os-grupo').value = '';
}
```

**Atualização em `restaurarOSParaEdicao()`**

Ao editar uma O.S., o sistema agora também preenche o seletor de Grupo:

```javascript
// Preencher seletor de grupo primeiro (se existir)
const grupoSelect = document.getElementById('os-grupo-select');
if (grupoSelect && os.grupo) {
    grupoSelect.value = os.grupo;
    console.log('✅ Grupo selecionado na edição:', os.grupo);
}
```

**Limpeza de Formulário**

Todas as funções que resetam o formulário agora também chamam `limparCamposDetentora()`:
- Após emitir O.S. com sucesso
- Após salvar e fechar
- Ao cancelar edição

---

## 🗄️ Migração de Banco de Dados

### Script: `migrar_detentoras.py`

**Executar ANTES de usar o sistema:**

```powershell
cd backend
python migrar_detentoras.py
```

**O que faz:**
1. ✅ Cria tabela `detentoras` com campos:
   - id, contrato_num, data_assinatura, prazo_vigencia
   - nome, cnpj, servico, grupo
   - criado_em, atualizado_em, ativo
2. ✅ Adiciona coluna `detentora_id` na tabela `ordens_servico`
3. ✅ Cria índice na coluna `grupo` para performance

---

## 📊 Relacionamento entre Grupo e Região

| **Grupo** | **Região do Estoque** | **Descrição** |
|-----------|----------------------|---------------|
| 1         | Região 1            | Mesma área geográfica |
| 2         | Região 2            | Mesma área geográfica |
| 3         | Região 3            | Mesma área geográfica |
| 4         | Região 4            | Mesma área geográfica |
| 5         | Região 5            | Mesma área geográfica |
| 6         | Região 6            | Mesma área geográfica |

**Importante:**
- Cada **Grupo** deve ter **apenas UMA Detentora ativa**
- Ao selecionar o Grupo na O.S., o sistema:
  1. Busca a Detentora cadastrada para aquele Grupo
  2. Preenche os dados do contrato automaticamente
  3. Define o campo `os-grupo` para vincular ao estoque correto

---

## 🎨 Melhorias de UX

### Visual

1. **Seletor de Grupo destacado**
   - Background cinza claro (`#f8f9fa`)
   - Padding de 15px
   - Texto de ajuda: "Os dados do contrato serão preenchidos automaticamente"

2. **Campos readonly**
   - Background `#e9ecef` (cinza claro)
   - Indicação visual de que não podem ser editados manualmente

3. **Feedback ao selecionar Grupo**
   - Borda verde (`#28a745`) por 2 segundos quando dados carregados
   - Alert se não houver Detentora para o Grupo

### Comportamento

1. **Auto-limpeza**
   - Limpar Grupo → limpa todos os campos de contrato
   - Reset de formulário → limpa Grupo e campos de contrato

2. **Validação**
   - Campo Grupo é obrigatório (`required`)
   - Não permite emitir O.S. sem selecionar Grupo válido
   - Alert explicativo se Grupo não tem Detentora cadastrada

---

## 🧪 Fluxo de Teste

### 1. Cadastrar Detentora de Teste

1. Login como Admin
2. Ir em **🏢 Detentoras**
3. Clicar "➕ Nova Detentora"
4. Preencher:
   - Grupo: **1**
   - Contrato Nº: **014/DA/2024**
   - Data de Assinatura: **01/01/2024**
   - Prazo de Vigência: **12 MESES**
   - Nome: **AMBP PROMOÇÕES E EVENTOS EMPRESARIAIS LTDA-EPP**
   - CNPJ: **08.472.572/0001-85** (formatação automática)
   - Serviço: **COFFEE BREAK**
5. Salvar

### 2. Testar Auto-Preenchimento

1. Ir em **📝 Emitir O.S.**
2. No topo do formulário, selecionar **Grupo 1**
3. ✅ Verificar que todos os campos de contrato foram preenchidos:
   - Contrato Nº: 014/DA/2024
   - Data de Assinatura: 01/01/2024
   - Prazo de Vigência: 12 MESES
   - Nome da Detentora: AMBP PROMOÇÕES E EVENTOS...
   - CNPJ: 08.472.572/0001-85
   - Serviço: COFFEE BREAK
   - Grupo: 1
4. Preencher dados do evento (Data, Horário, Local, etc.)
5. Adicionar itens
6. Emitir O.S.

### 3. Testar Edição de O.S.

1. Ir em **📋 Ordens de Serviço**
2. Clicar "✏️ Editar" em uma O.S. existente
3. ✅ Verificar que o Grupo foi carregado no seletor
4. ✅ Verificar que os campos de contrato estão preenchidos
5. Modificar dados do evento
6. Salvar

---

## ⚠️ Validações e Regras

### Restrições

1. **Grupo Obrigatório**: Não é possível emitir O.S. sem selecionar Grupo
2. **Detentora Única por Grupo**: Idealmente, cada Grupo deve ter apenas 1 Detentora ativa
3. **Campos Readonly**: Dados do contrato não podem ser editados no formulário de O.S. (apenas via cadastro de Detentoras)

### Mensagens de Erro

| **Situação** | **Mensagem** |
|--------------|--------------|
| Grupo não selecionado | *(Validação HTML5 required)* |
| Grupo sem Detentora | "⚠️ Nenhuma Detentora cadastrada para o Grupo X." |
| Erro na API | "Erro ao carregar dados da Detentora." |

---

## 🔐 Permissões

### Detentoras (CRUD)

| **Ação** | **Admin** | **Comum** |
|----------|-----------|-----------|
| Listar   | ✅        | ✅        |
| Criar    | ✅        | ❌        |
| Editar   | ✅        | ❌        |
| Deletar  | ✅        | ❌        |

### O.S. (Usar Detentoras)

| **Ação** | **Admin** | **Comum** |
|----------|-----------|-----------|
| Selecionar Grupo e carregar dados | ✅ | ✅ |
| Emitir O.S. com Detentora | ✅ | ✅ |

**Observação:** Usuários comuns **podem** emitir O.S. usando Detentoras cadastradas, mas **não podem** criar/editar/deletar Detentoras.

---

## 📦 Arquivos Modificados

### Backend

- ✅ `backend/models.py` - Adicionado model `Detentora` e FK em `OrdemServico`
- ✅ `backend/routes/detentoras_routes.py` - CRUD completo de Detentoras
- ✅ `backend/app.py` - Registrado blueprint `detentoras_bp`
- ✅ `backend/routes/views_routes.py` - Adicionada rota `/detentoras`
- ✅ `backend/migrar_detentoras.py` - Script de migração

### Frontend

- ✅ `backend/templates/gerenciar-detentoras.html` - Tela de CRUD
- ✅ `backend/templates/index.html` - Formulário de O.S. integrado
- ✅ `backend/static/js/api-client.js` - Métodos de API para Detentoras
- ✅ `backend/static/js/app.js` - Funções de carregamento e limpeza

---

## 📝 Conclusão

A integração entre **Detentoras** e **O.S.** automatiza o preenchimento de dados contratuais, reduzindo erros de digitação e aumentando a produtividade. Agora, ao emitir uma O.S., basta selecionar o Grupo/Região, e todos os dados da empresa contratada são carregados instantaneamente!

**Benefícios:**
- ✅ **Menos digitação**: Dados preenchidos automaticamente
- ✅ **Menos erros**: Dados vêm diretamente do cadastro
- ✅ **Padronização**: Todos usam os mesmos dados da Detentora
- ✅ **Rastreabilidade**: Vínculo entre O.S. e Detentora no banco de dados
- ✅ **Simplicidade**: Um clique para carregar todos os dados

---

**Versão:** 1.0  
**Data:** 2024  
**Autor:** Sistema de Controle de Itens - Eventos
