# 📊 Guia Rápido de Uso - Sistema de Relatórios

## 🚀 Início Rápido

### 1. Limpar Cache do Navegador (IMPORTANTE!)

Como novos arquivos JavaScript foram adicionados, é **essencial** limpar o cache:

**Opção 1 - Hard Refresh (Recomendado):**
```
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

**Opção 2 - Limpar Cache:**
1. Pressione `Ctrl + Shift + Delete`
2. Marque "Imagens e arquivos em cache"
3. Clique em "Limpar dados"

**Opção 3 - Fechar Navegador:**
1. Feche TODAS as abas do navegador
2. Feche o navegador completamente
3. Abra novamente

### 2. Acessar a Aba de Relatórios

1. Abra o sistema: http://127.0.0.1:5100
2. Clique na aba **"📊 Relatórios"** no menu superior

---

## 📋 Tipos de Relatórios Disponíveis

### 1. 📋 Relatório de Ordens de Serviço

**O que mostra:**
- Lista completa de O.S. emitidas
- Estatísticas de atendimento
- Agrupamento por serviço e contratada

**Filtros:**
- Data início/fim
- Região (1-6)
- Nome da contratada
- Tipo de serviço

**Como usar:**
1. Defina os filtros desejados (opcional)
2. Clique em "📊 Gerar Relatório"
3. Visualize os resultados na tela
4. (Opcional) Clique em "📄 Exportar PDF"

**Estatísticas mostradas:**
- Total de O.S.
- Regiões atendidas
- Tipos de serviço
- Número de contratadas

---

### 2. 📦 Relatório de Posição de Estoque

**O que mostra:**
- Quantidade inicial, gasta e disponível
- Percentual de uso por item
- Alertas visuais de estoque baixo

**Filtros:**
- Categoria de item
- Região (1-6)

**Alertas de cores:**
- 🔴 **Vermelho**: Uso > 80% (crítico - reabastecer urgente!)
- 🟠 **Laranja**: Uso > 50% (atenção - monitorar)
- ⚫ **Preto**: Uso < 50% (normal)

**Como usar:**
1. Selecione a categoria (ou deixe "Todas")
2. Selecione a região (ou deixe "Todas")
3. Clique em "📊 Gerar Relatório"
4. Observe os percentuais de uso
5. (Opcional) Clique em "📄 Exportar PDF"

---

### 3. 🔄 Relatório de Movimentações

**O que mostra:**
- Histórico de entradas e saídas
- Vinculação com O.S.
- Observações de cada movimentação

**Filtros:**
- Data início/fim
- Região (1-6)
- Tipo (Saída/Entrada)
- Item específico

**Como usar:**
1. Defina o período
2. Escolha a região e tipo de movimentação
3. Clique em "📊 Gerar Relatório"
4. Analise as movimentações com badges coloridos:
   - 🔴 SAIDA
   - 🟢 ENTRADA

**Estatísticas mostradas:**
- Total de movimentações
- Total de saídas
- Total de entradas
- Saldo líquido

---

### 4. 📈 Relatório de Consumo por Categoria

**O que mostra:**
- Consumo agrupado por categoria
- Código BEC (natureza da despesa)
- Detalhamento item por item
- Frequência de uso

**Filtros:**
- Data início/fim

**Como usar:**
1. Defina o período de análise
2. Clique em "📊 Gerar Relatório"
3. Visualize o consumo separado por categoria:
   - Coffee Break
   - Água Mineral
   - Kit Lanche
   - Etc.

**Informações por item:**
- Descrição completa
- Unidade de medida
- Quantidade total consumida
- Número de vezes utilizado

---

### 5. 🏆 Relatório de Itens Mais Utilizados

**O que mostra:**
- Ranking dos itens mais consumidos
- Medalhas para Top 3
- Total consumido por item

**Filtros:**
- Data início/fim
- Limite (Top 5, 10, 20, 50)

**Como usar:**
1. Defina o período
2. Escolha quantos itens quer ver (ex: Top 10)
3. Clique em "📊 Gerar Relatório"
4. Veja o ranking com medalhas:
   - 🥇 1º lugar (dourado)
   - 🥈 2º lugar (prateado)
   - 🥉 3º lugar (bronze)

**Útil para:**
- Planejar compras futuras
- Identificar itens mais demandados
- Otimizar estoque

---

## 💡 Dicas de Uso

### Para Análise Mensal
```
Filtros sugeridos:
- Data início: 01/MM/AAAA
- Data fim: 31/MM/AAAA
- Região: Todas
```

### Para Análise por Região
```
Filtros sugeridos:
- Região: [Escolher específica]
- Período: Todo
```

### Para Identificar Itens Críticos
```
Usar: Relatório de Posição de Estoque
Observar: Itens em vermelho (>80% de uso)
Ação: Planejar reabastecimento
```

### Para Planejamento de Compras
```
Usar: Relatório de Itens Mais Utilizados
Limite: Top 20
Período: Últimos 3 meses
```

---

## 📄 Exportação de PDF

### Relatórios com PDF disponível:
✅ Ordens de Serviço  
✅ Posição de Estoque

### Características dos PDFs:
- Formato paisagem (melhor visualização)
- Tamanho A4
- Tabelas formatadas profissionalmente
- Cabeçalho com data de geração
- Totalizadores e resumos

### Como exportar:
1. Gere o relatório primeiro (clique em "📊 Gerar Relatório")
2. Clique no botão "📄 Exportar PDF"
3. O PDF será baixado automaticamente
4. Abra com seu leitor de PDF preferido

---

## 🎯 Casos de Uso Práticos

### Caso 1: Prestação de Contas Mensal
**Objetivo:** Demonstrar uso de recursos no mês

**Passos:**
1. Acesse "📋 Relatório de Ordens de Serviço"
2. Filtre pelo mês desejado
3. Exporte PDF
4. Use "📈 Consumo por Categoria" para detalhamento
5. Anexe ambos PDFs ao relatório

---

### Caso 2: Solicitação de Reabastecimento
**Objetivo:** Identificar itens que precisam ser repostos

**Passos:**
1. Acesse "📦 Posição de Estoque"
2. Não aplique filtros (ver tudo)
3. Gere o relatório
4. Identifique itens em vermelho (>80%)
5. Exporte PDF
6. Encaminhe para setor de compras

---

### Caso 3: Análise de Eficiência
**Objetivo:** Entender quais itens são mais utilizados

**Passos:**
1. Acesse "🏆 Itens Mais Utilizados"
2. Defina período de 3-6 meses
3. Escolha Top 20
4. Gere o relatório
5. Use dados para otimizar estoque inicial

---

### Caso 4: Auditoria de Movimentações
**Objetivo:** Rastrear movimentações específicas

**Passos:**
1. Acesse "🔄 Movimentações"
2. Filtre por período e região
3. Opcionalmente filtre por tipo (SAIDA/ENTRADA)
4. Gere o relatório
5. Verifique observações e O.S. vinculadas

---

## ⚠️ Solução de Problemas

### Relatório não carrega
**Solução:**
1. Verifique se limpou o cache do navegador
2. Pressione F12 e veja o console por erros
3. Verifique se o servidor Flask está rodando

### Nenhum dado aparece
**Solução:**
1. Verifique se existem dados no período filtrado
2. Tente remover alguns filtros
3. Verifique se O.S. foram emitidas

### PDF não abre
**Solução:**
1. Verifique se tem leitor de PDF instalado
2. Tente baixar manualmente clicando com botão direito
3. Verifique bloqueador de pop-ups

### Estatísticas incorretas
**Solução:**
1. Verifique se os filtros estão corretos
2. Confira se as datas estão no formato certo
3. Limpe cache e recarregue a página

---

## 📱 Uso em Dispositivos Móveis

O sistema é totalmente responsivo!

**Mobile:**
- Cards empilhados verticalmente
- Formulários adaptados para toque
- Tabelas com scroll horizontal
- Botões otimizados para dedos

**Tablet:**
- Layout intermediário
- 1-2 colunas dependendo da orientação
- Experiência otimizada

---

## 🔄 Atualização do Sistema

Quando novos relatórios forem adicionados:

1. **Servidor será reiniciado** (você verá no terminal)
2. **Limpe o cache** do navegador
3. **Recarregue** a página
4. **Novos relatórios** aparecerão automaticamente

---

## 📞 Suporte

**Em caso de dúvidas:**

1. Consulte a documentação completa em `docs/SISTEMA_RELATORIOS.md`
2. Verifique o console do navegador (F12)
3. Verifique logs do Flask no terminal
4. Certifique-se que o cache foi limpo

---

## ✅ Checklist de Uso

Antes de usar os relatórios pela primeira vez:

- [ ] Servidor Flask está rodando
- [ ] Cache do navegador foi limpo
- [ ] Página foi recarregada (Ctrl+Shift+R)
- [ ] Aba "📊 Relatórios" está visível
- [ ] Existem O.S. emitidas no sistema
- [ ] Existem itens com estoque cadastrado

---

## 🎉 Pronto para Usar!

O sistema de relatórios está completo e funcional. Explore cada tipo de relatório e use os filtros para obter insights valiosos sobre o uso de recursos!

**Bom uso! 📊✨**
