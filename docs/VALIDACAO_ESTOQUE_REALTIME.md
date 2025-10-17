# 📊 Validação de Estoque em Tempo Real - O.S.

## 🎯 Objetivo

Implementar validação automática de estoque **durante o preenchimento** da Ordem de Serviço, mostrando ao usuário em tempo real se há estoque disponível para cada item selecionado.

## ✅ Funcionalidade Implementada

### **Indicador Visual de Estoque**

Ao selecionar um item e informar a quantidade, o sistema **automaticamente**:

1. ✅ Identifica a região do estoque baseada no **Grupo** informado
2. ✅ Consulta o estoque disponível daquele item naquela região
3. ✅ Calcula se a quantidade solicitada pode ser atendida
4. ✅ Mostra alerta visual colorido com informações detalhadas

---

## 🎨 Tipos de Alertas

### 1. ✅ **Estoque OK** (Verde)
**Quando:** Quantidade disponível é suficiente e sobra mais de 20%

```
✅ Estoque Suficiente na Região 5
📦 Disponível: 5.000,00 Un | 📋 Será usado: 400,00 Un (8.0%) | 📈 Restará: 4.600,00 Un
```

**Visual:**
- Fundo: Verde claro (#d4edda)
- Borda: Verde (#28a745)
- Ícone: ✅

---

### 2. ⚠️ **Atenção - Estoque Baixo** (Amarelo)
**Quando:** Quantidade solicitada consome mais de 80% do disponível

```
⚠️ ATENÇÃO - Estoque ficará baixo na Região 5
📦 Disponível: 500,00 Un | 📋 Será usado: 450,00 Un | 📉 Restará: 50,00 Un
```

**Visual:**
- Fundo: Amarelo claro (#fff3cd)
- Borda: Laranja (#ff9800)
- Ícone: ⚠️

**Significado:** A O.S. pode ser emitida, mas o estoque ficará muito baixo. Planeje reabastecimento!

---

### 3. ❌ **Estoque Insuficiente** (Vermelho)
**Quando:** Quantidade solicitada é MAIOR que o disponível

```
❌ ESTOQUE INSUFICIENTE na Região 5
📦 Disponível: 200,00 Un | 📋 Necessário: 400,00 Un | ⚠️ Faltam: 200,00 Un
```

**Visual:**
- Fundo: Vermelho claro (#f8d7da)
- Borda: Vermelho (#dc3545)
- Ícone: ❌

**Ação necessária:** **NÃO É POSSÍVEL EMITIR** esta O.S. até cadastrar mais estoque!

---

### 4. ❌ **Estoque Zerado** (Vermelho Crítico)
**Quando:** Não há nenhum estoque cadastrado na região

```
❌ ESTOQUE ZERADO na Região 5
Não é possível emitir esta O.S. Cadastre estoque primeiro.
```

**Visual:**
- Fundo: Vermelho claro (#f8d7da)
- Borda: Vermelho (#dc3545)
- Ícone: ❌

**Ação necessária:** Cadastre o estoque inicial antes de emitir a O.S.

---

### 5. ⚠️ **Selecione o Grupo** (Amarelo)
**Quando:** Usuário não informou o Grupo ainda

```
⚠️ Selecione o grupo primeiro para verificar o estoque disponível
```

**Ação necessária:** Preencha o campo "Grupo" primeiro.

---

### 6. ❌ **Sem Estoque Cadastrado** (Vermelho)
**Quando:** Item não tem registro de estoque na região

```
❌ Sem estoque cadastrado na Região 5
```

**Ação necessária:** Acesse "🍽️ Itens do Coffee" → Editar item → Cadastrar estoque para a região.

---

## 🔄 Atualização Automática

A validação acontece automaticamente quando:

1. ✅ Usuário **seleciona um item** diferente
2. ✅ Usuário **altera a quantidade** solicitada
3. ✅ Usuário **altera as diárias**
4. ✅ Usuário **muda o grupo** (atualiza TODOS os itens da O.S.)

---

## 📝 Como Usar

### **Passo a Passo:**

1. **Preencha o Grupo** primeiro (ex: "5")
   - O grupo define qual região do estoque será usada
   - Grupo 1 = Região 1, Grupo 2 = Região 2, etc.

2. **Adicione um item** à O.S.:
   - Selecione a **Categoria**
   - Selecione o **Item**
   - Informe as **Diárias** (padrão: 1)
   - Informe a **Quantidade**

3. **Aguarde o alerta aparecer**:
   - O sistema verifica automaticamente
   - Aparece um card colorido abaixo do item
   - Leia as informações do estoque

4. **Interprete o resultado**:
   - 🟢 **Verde** → OK, pode continuar
   - 🟡 **Amarelo** → Atenção, estoque ficará baixo
   - 🔴 **Vermelho** → BLOQUEADO, precisa adicionar estoque

5. **Se estoque insuficiente**:
   - Opção 1: Reduzir a quantidade solicitada
   - Opção 2: Cadastrar mais estoque na região
   - Opção 3: Mudar para outro grupo/região

---

## 🛠️ Soluções para Problemas Comuns

### ❌ "Estoque Insuficiente"

**Solução 1 - Adicionar Estoque:**
```
1. Abra a aba "🍽️ Itens do Coffee"
2. Localize o item
3. Clique em "Editar"
4. Na região correspondente, aumente a "Quantidade Inicial"
5. Salve
6. Volte para emitir a O.S.
```

**Solução 2 - Reduzir Quantidade:**
```
1. Ajuste a quantidade solicitada para um valor menor
2. O alerta atualizará automaticamente
3. Continue quando ficar verde
```

---

### ⚠️ "Selecione o grupo primeiro"

**Solução:**
```
1. Volte ao campo "Grupo" no topo do formulário
2. Informe o número do grupo (1 a 6)
3. Os alertas aparecerão automaticamente
```

---

### ❌ "Sem estoque cadastrado na Região X"

**Solução:**
```
1. O item existe, mas não tem estoque nessa região
2. Acesse "🍽️ Itens do Coffee"
3. Edite o item
4. Cadastre estoque inicial para a região desejada
5. Salve e retorne
```

---

## 💡 Dicas de Uso

### **1. Preencha o Grupo Primeiro**
Sempre informe o grupo ANTES de adicionar itens. Isso permite que a validação funcione desde o primeiro item.

### **2. Monitore Estoques Baixos**
Alertas amarelos (⚠️) são avisos para planejar reabastecimento. Não impedem a O.S., mas indicam que o estoque está acabando.

### **3. Múltiplos Itens**
Se adicionar vários itens, cada um terá seu próprio alerta. Confira TODOS antes de emitir a O.S.

### **4. Mudança de Grupo**
Se mudar o grupo após adicionar itens, TODOS os alertas serão atualizados automaticamente para a nova região.

### **5. Diárias x Quantidade**
Lembre-se: **Quantidade Total = Diárias × Quantidade**
- Diárias: 2
- Quantidade: 100
- **Total usado: 200** ← Este é o valor verificado no estoque!

---

## 🎯 Benefícios

✅ **Previne erros** antes de emitir a O.S.  
✅ **Transparência total** do estoque disponível  
✅ **Economia de tempo** - evita tentar emitir O.S. que falharia  
✅ **Planejamento** - alertas amarelos permitem planejar reabastecimento  
✅ **Visibilidade** - sabe exatamente quanto sobrará após a O.S.

---

## 📊 Informações Exibidas

Para cada item, o alerta mostra:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **Região** | Qual região do estoque está sendo consultada | Região 5 |
| **Disponível** | Quantidade atual disponível | 5.000,00 Un |
| **Será usado** | Quantidade que será consumida (diárias × qtd) | 400,00 Un |
| **Percentual** | % do estoque que será consumido | 8.0% |
| **Restará** | Quanto sobrará após a O.S. | 4.600,00 Un |
| **Faltam** | Quanto falta (se insuficiente) | 200,00 Un |

---

## 🔧 Atualização da Versão

**Versão:** 1.3  
**Data:** 16/10/2025  
**Cache:** Limpe o cache do navegador (`Ctrl + Shift + R`)

---

## 📱 Responsividade

✅ Funciona em **desktop**, **tablet** e **mobile**  
✅ Alertas se adaptam ao tamanho da tela  
✅ Informações sempre visíveis e legíveis

---

## ✅ Checklist de Uso

Antes de emitir uma O.S., certifique-se:

- [ ] Grupo foi informado
- [ ] Todos os itens têm alertas **verdes** ou **amarelos**
- [ ] Nenhum alerta **vermelho** bloqueando
- [ ] Conferiu as quantidades que restarão
- [ ] Planeja reabastecer itens com alerta amarelo

---

## 🎉 Pronto para Usar!

O sistema agora valida o estoque automaticamente e te avisa antes de qualquer problema. Use as cores dos alertas como guia e emita suas O.S. com segurança! 🚀
