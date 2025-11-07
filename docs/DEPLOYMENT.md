# 📦 GUIA DE DEPLOYMENT - ATUALIZAÇÕES PARA PRODUÇÃO

**Status**: Pronto para envio ao servidor com banco existente  
**Data**: Novembro 2025  
**Segurança**: ✅ Backup automático, Transações ACID, Rollback disponível

---

## 🎯 O QUE ESTÁ SENDO ENVIADO

### Novos Arquivos
```
✨ Sistema de Auditoria Completo
  ├── models.py (atualizado com Auditoria model)
  ├── routes/auditoria_routes.py (novos endpoints)
  ├── utils/auditoria.py (helper functions)
  ├── templates/auditoria.html (interface web)
  └── static/css/auditoria.css (estilos)

📚 Documentação
  ├── docs/AUDITORIA.md
  ├── docs/API.md
  ├── docs/DATABASE.md
  ├── docs/SETUP.md
  └── ... 5 mais

🛠️ Scripts de Migração
  └── scripts/migracao/migrar_adicionar_auditoria.py

📁 Scripts Reorganizados
  └── scripts/ (51 scripts em 6 categorias)
```

### Arquivo Modificado
```
⚙️ backend/app.py
   └── Registra novo blueprint 'auditoria_routes'
```

---

## ✅ PRÉ-REQUISITOS

- [ ] Você tem **acesso SSH** ao servidor
- [ ] Banco de dados SQLite **sem tabela auditoria**
- [ ] Servidor pode ficar **3-5 minutos indisponível**
- [ ] Você tem **backup do banco** (vamos criar outro)
- [ ] Python 3.8+ no servidor

---

## 🚀 PASSO A PASSO DO DEPLOYMENT

### 1️⃣ PREPARAÇÃO LOCAL (Seu PC)

```powershell
# Vá para raiz do projeto
cd c:\Users\bruno.vargas\Desktop\PROJETOS\controle-itens-eventos

# Prepare tudo para envio
git status  # Veja o que foi alterado

# Adicione as mudanças
git add .

# Committe com mensagem descritiva
git commit -m "feat: add complete audit system with production-ready migration

- Add Auditoria model with full tracking (usuario, acao, modulo, entidade)
- Add auditoria REST API with filtering and statistics
- Add web interface for audit viewing
- Add comprehensive documentation (API, AUDITORIA, DATABASE, SETUP)
- Organize 51 scripts into 6 logical categories
- Add migration script for safe database updates
- Include rollback capability for emergency cases"

# Envie para repositório
git push origin main
```

---

### 2️⃣ NO SERVIDOR - ATUALIZAR CÓDIGO

```bash
# 1. Entre no servidor
ssh seu_usuario@seu_servidor.com

# 2. Vá para pasta do projeto
cd /caminho/para/controle-itens-eventos

# 3. Pull das mudanças
git pull origin main

# 4. Veja o que foi alterado
git log -1 --stat

# 5. Verifique a integridade
ls -la backend/scripts/  # Veja os scripts organizados
```

---

### 3️⃣ NO SERVIDOR - PARAR O SERVIDOR

```bash
# Se rodando com systemd
sudo systemctl stop controle-itens  # ou seu_nome_do_servico

# Se rodando manualmente
# Pressione Ctrl+C no terminal onde está rodando
# OU: pkill -f "python app.py"

# Espere 5 segundos
sleep 5

# Verifique se parou
ps aux | grep app.py  # Não deve aparecer
```

---

### 4️⃣ NO SERVIDOR - CRIAR BACKUP

```bash
# Vá para pasta com banco
cd ~/seu_projeto/backend

# Liste os bancos
ls -lah instance/

# Crie backup manual (backup duplo)
cp instance/controle_itens.db instance/controle_itens_$(date +%Y%m%d_%H%M%S)_pre_auditoria.db

# Verifique
ls -lah instance/*.db
```

---

### 5️⃣ NO SERVIDOR - EXECUTAR MIGRAÇÃO

#### Opção A: Apenas Verificar (RECOMENDADO - Primeiro)

```bash
# Ative ambiente Python
source venv/bin/activate  # Linux/Mac
# ou
call venv\Scripts\activate.bat  # Windows

# Execute verificação
python backend/scripts/migracao/migrar_adicionar_auditoria.py --check

# Deve retornar: "✓ Verificação concluída. Banco está pronto para migração!"
```

#### Opção B: Executar Migração

```bash
# Se tudo OK no step anterior
python backend/scripts/migracao/migrar_adicionar_auditoria.py

# Deve retornar:
# ✓ Backup criado
# ✓ Tabela 'auditoria' criada
# ✓ Índices criados
# ✓ Migração concluída com sucesso!
```

**Saída esperada:**
```
✓ Backup criado: instance/backups/controle_itens_backup_20251107_143022.db
✓ Tabela 'auditoria' criada
✓ Índices criados
✓ Verificação concluída com sucesso!

MIGRAÇÃO CONCLUÍDA COM SUCESSO!
Banco: instance/controle_itens.db
Backup: instance/backups/controle_itens_backup_20251107_143022.db
```

---

### 6️⃣ NO SERVIDOR - SE ALGO DER ERRADO (ROLLBACK)

```bash
# Restaure do backup criado pela migração
python backend/scripts/migracao/migrar_adicionar_auditoria.py \
  --rollback instance/backups/controle_itens_backup_20251107_143022.db

# Ou restaure do seu backup manual
cp instance/controle_itens_20251107_143022_pre_auditoria.db instance/controle_itens.db
```

---

### 7️⃣ NO SERVIDOR - REINICIAR SERVIDOR

```bash
# Se usando systemd
sudo systemctl start controle-itens

# Se rodando manualmente
python app.py

# Aguarde mensagem: "Running on http://..."
```

---

### 8️⃣ NO SERVIDOR - VERIFICAR SE ESTÁ FUNCIONANDO

```bash
# Teste 1: Verifique se servidor respondeu
curl -s http://localhost:5100 | head -20

# Teste 2: Teste API de auditoria (precisa estar logado)
curl -s http://localhost:5100/api/auditoria/stats \
  -H "Authorization: Bearer seu_token"

# Teste 3: Verifique logs
tail -100 logs/app.log  # se houver
```

---

## 📋 CHECKLIST DE DEPLOYMENT

### Antes (✓ Todos devem estar completos)
- [ ] Backup local feito
- [ ] Teste de verificação passou (`--check`)
- [ ] Servidor pode ficar indisponível
- [ ] Você tem acesso SSH

### Durante
- [ ] Servidor foi parado
- [ ] Backup pré-migração foi criado
- [ ] Migração foi executada
- [ ] Verificação pós-migração passou
- [ ] Servidor foi reiniciado
- [ ] Servidor respondendo

### Depois
- [ ] Testar criar novo item (deve registrar em auditoria)
- [ ] Testar editar item (deve registrar antes/depois)
- [ ] Testar visualizar auditoria (menu > Auditoria)
- [ ] Verificar se dados antigos estão intactos
- [ ] Compartilhar backup com time

---

## 🆘 TROUBLESHOOTING

### Erro: "Tabela 'auditoria' já existe"

```bash
# Significa que servidor já foi migrado
# Apenas atualize o código sem rodar migração

python app.py  # Pode iniciar normalmente
```

### Erro: "FOREIGN KEY constraint failed"

```bash
# Usuários deletados quebram auditoria
# Solução: Restaure backup e execute rollback

python scripts/migracao/migrar_adicionar_auditoria.py \
  --rollback instance/backups/NOME_DO_BACKUP.db
```

### Servidor não inicia após migração

```bash
# 1. Restaure backup
cp instance/backups/controle_itens_backup_*.db instance/controle_itens.db

# 2. Verifique logs
tail -200 logs/app.log

# 3. Tente iniciar novamente
python app.py
```

### Auditoria não está gravando

```bash
# Verifique se blueprint foi registrado
curl -s http://localhost:5100/api/auditoria/stats -v

# Se retornar 404, reload do servidor com:
sudo systemctl restart controle-itens

# Ou: Ctrl+C e python app.py novamente
```

---

## 📊 O QUE MUDA NO SERVIDOR

### Banco de Dados
```sql
-- Antes
CREATE TABLE usuario (...)
CREATE TABLE categoria (...)
CREATE TABLE itens (...)
-- ... 6 tabelas mais

-- Depois
CREATE TABLE usuario (...)
CREATE TABLE categoria (...)
CREATE TABLE itens (...)
-- ... 6 tabelas mais
CREATE TABLE auditoria (...)  ← NOVA!
```

### Código
```
backend/
├── app.py (modificado - registra blueprint)
├── models.py (modificado - adiciona Auditoria model)
├── routes/
│   ├── auditoria_routes.py (NOVO)
│   ├── itens_routes.py (ATUALIZADO - audit logging)
│   ├── os_routes.py (ATUALIZADO - audit logging)
│   └── ...
├── utils/
│   └── auditoria.py (NOVO)
├── templates/
│   └── auditoria.html (NOVO)
└── scripts/ (REORGANIZADO - 51 scripts em 6 dirs)
```

### Funcionalidades
- ✅ Auditoria visível via web (menu > Auditoria)
- ✅ API REST para auditoria
- ✅ Rastreamento automático de mudanças
- ✅ Filtros e estatísticas
- ✅ Admin-only access

---

## 🔐 SEGURANÇA

### Backup
```bash
# Backup feito AUTOMATICAMENTE antes da migração
instance/backups/controle_itens_backup_20251107_143022.db

# Você também fez backup manual
instance/controle_itens_20251107_143022_pre_auditoria.db

# Total: 2 backups = Seguro ✓
```

### Transação
- Migração usa `BEGIN TRANSACTION`
- Se falhar, tudo reverte automaticamente
- Sem risco de estado meio-caminho

### Rollback
```bash
# Se precisar desfazer em caso de emergência
python scripts/migracao/migrar_adicionar_auditoria.py --rollback BACKUP.db

# O backup está lá, pronto para ser usado
```

---

## 📞 DÚVIDAS COMUNS

**P: Quanto tempo leva?**  
R: 30 segundos a 2 minutos (depende do tamanho do banco)

**P: Os dados antigos serão perdidos?**  
R: NÃO! Todos os dados mantêm-se intactos. Só adiciona tabela nova.

**P: Posso fazer durante o dia?**  
R: NÃO é recomendado. Faça em horário de baixo uso (madrugada).

**P: E se der erro no meio?**  
R: Rollback automático volta tudo ao normal.

**P: Preciso deletar dados?**  
R: Não! Apenas adiciona tabela, não modifica nada existente.

**P: Quem pode ver a auditoria?**  
R: Apenas admins. Outros usuários não podem acessar.

---

## 📝 LOG DE EXECUÇÃO

Salvo em: `instance/backups/migracao_log.json`

```json
{
  "timestamp": "2025-11-07T14:30:22.123456",
  "resultado": "sucesso",
  "banco": "instance/controle_itens.db",
  "backup": "instance/backups/controle_itens_backup_20251107_143022.db"
}
```

---

## ✨ PRÓXIMOS PASSOS

### 1. Após Deployment Bem-sucedido
```bash
# Teste a auditoria
1. Login como admin
2. Crie um novo item
3. Edite o item
4. Vá em Menu > Auditoria
5. Você deve ver as mudanças registradas
```

### 2. Treinar Usuários
```bash
Compartilhe: docs/AUDITORIA.md
Com equipe de compliance e auditoria
```

### 3. Monitorar
```bash
1. Verifique logs regularmente
2. Crie alertas se auditoria parar
3. Faça backup regular (já automático)
```

---

## 🎊 CONCLUSÃO

**Você está pronto para fazer deployment!**

✅ Código atualizado  
✅ Migração segura  
✅ Backup automático  
✅ Rollback disponível  
✅ Documentação completa  

**Próximo passo:**
```bash
git push origin main  # Enviar para repositório
```

Então siga os passos acima no servidor! 🚀

