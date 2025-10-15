# 🔄 Como Recuperar suas O.S. Antigas

## Problema

Após migrar para o sistema Flask + SQLite, suas Ordens de Serviço antigas que estavam salvas no **localStorage** do navegador não aparecem mais no sistema.

## ✅ Solução Rápida

Criamos uma **ferramenta automática de importação** que migra todas as suas O.S. antigas para o novo banco de dados.

### Passo a Passo:

1. **Certifique-se que o backend está rodando:**
   ```powershell
   cd backend
   .\venv\Scripts\python.exe app.py
   ```
   > Deve mostrar: `Running on http://127.0.0.1:5100`

2. **Abra a ferramenta de importação:**
   - Clique no link **"🔄 Importar O.S. Antigas"** no topo do sistema
   - OU abra diretamente: `importar-os-antigas.html`

3. **Clique em "Verificar e Importar O.S."**
   - A ferramenta irá:
     - ✅ Verificar quantas O.S. existem no localStorage
     - ✅ Importar cada uma para o banco de dados
     - ✅ Mostrar o progresso em tempo real
     - ✅ Perguntar se deseja limpar os dados antigos

4. **Pronto!**
   - Suas O.S. estarão disponíveis na aba **"📋 Ordens de Serviço"**

## 🛡️ Segurança

- ✅ A ferramenta **não duplica** O.S. que já existem no banco
- ✅ Mostra log detalhado de cada operação
- ✅ Mantém os dados antigos até você confirmar a exclusão
- ✅ Permite rodar múltiplas vezes sem problemas

## 📊 Exemplo de Uso

```
🔍 Encontradas 15 O.S. para importar

[17:30:15] Importando O.S. 1/2025...
[17:30:16] ✅ O.S. 1/2025 importada com sucesso!
[17:30:16] Importando O.S. 2/2025...
[17:30:17] ✅ O.S. 2/2025 importada com sucesso!
...

✅ Importação concluída com sucesso! 15 O.S. importadas.
```

## ❓ Perguntas Frequentes

### Minhas O.S. antigas ainda existem?
Sim! Elas estão salvas no **localStorage do navegador**. Use a ferramenta de importação para migrá-las.

### Posso importar várias vezes?
Sim! A ferramenta verifica se a O.S. já existe antes de importar, evitando duplicatas.

### E se eu limpar o localStorage?
⚠️ **CUIDADO!** Só limpe após confirmar que todas as O.S. foram importadas com sucesso.

### Onde ficam as O.S. agora?
No arquivo `backend/controle_itens.db` (banco SQLite). Faça backup regular deste arquivo!

## 🔧 Verificação Manual

Se preferir verificar manualmente no navegador:

1. Abra o **DevTools** (F12)
2. Vá na aba **Application** > **Local Storage**
3. Procure por `ordensServico`
4. Você verá todas as O.S. salvas em formato JSON

## 📞 Suporte

Se encontrar algum problema:
1. Verifique se o backend está rodando
2. Abra o console do navegador (F12) e veja se há erros
3. Verifique os logs da ferramenta de importação
