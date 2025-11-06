# 🚀 Deploy Rápido - VPS Ubuntu

## Configuração do Projeto

- **Domínio:** coex.projdev.site
- **Porta:** 5100 (interna)
- **SSL:** HTTPS habilitado
- **Servidor:** Nginx + Flask

---

## Instalação em 4 Passos

### 0️⃣ Configurar DNS (ANTES DE COMEÇAR!)

No painel do seu provedor DNS, crie:

```
Tipo: A
Nome: coex
Valor: IP-DA-SUA-VPS
TTL: 3600
```

Teste: `nslookup coex.projdev.site` (deve retornar o IP da VPS)

**Aguarde propagação:** 5min a 24h

---

### 1️⃣ Enviar arquivos para VPS

```bash
# No seu computador local:
# Opção A - Via Git (recomendado)
git push origin main

# Opção B - Via SCP
scp -r controle-itens-eventos usuario@IP-DA-VPS:/tmp/
```

---

### 2️⃣ Executar instalação

```bash
# Conectar na VPS
ssh usuario@IP-DA-VPS

# Ir para o diretório (ou clonar)
cd /tmp/controle-itens-eventos
# OU: git clone https://github.com/brusodev/controle-itens-eventos.git

# Tornar script executável
chmod +x deploy.sh

# Executar instalação completa
./deploy.sh install
```

---

### 3️⃣ Configurar SSL

```bash
# Instalar certificado SSL (IMPORTANTE!)
./deploy.sh ssl

# OU manualmente:
sudo certbot --nginx -d coex.projdev.site
```

---

### 4️⃣ Acessar aplicação

Abra o navegador: **https://coex.projdev.site** 🎉

---

## 📚 Documentação Completa

- **[DEPLOY_VPS.md](./DEPLOY_VPS.md)** - Guia detalhado passo a passo
- **[DNS_SSL_CONFIG.md](./DNS_SSL_CONFIG.md)** - Configuração DNS e SSL
- **[DEPLOY_QUICK.md](./DEPLOY_QUICK.md)** - Este guia rápido

---

## ⚡ Comandos Úteis

```bash
# Atualizar aplicação (após git pull)
./deploy.sh update

# Configurar/reconfigurar SSL
./deploy.sh ssl

# Reiniciar serviço
./deploy.sh restart

# Ver logs em tempo real
./deploy.sh logs

# Ver status do serviço
./deploy.sh status
```

---

## 🔄 Atualizar Aplicação

```bash
# Na VPS
cd /var/www/controle-itens-eventos
git pull origin main
./deploy.sh update
```

---

## 🛡️ Segurança Importante

### 1. Configurar Firewall

```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
sudo ufw status
```

### 2. Mudar senha do admin

No primeiro acesso: **https://coex.projdev.site**
- Login: admin (ou o usuário que você criou)
- Vá em "Usuários" → Alterar senha

---

## 🐛 Problemas Comuns

### Site não carrega

```bash
# Verificar serviço
./deploy.sh status

# Ver logs
./deploy.sh logs

# Reiniciar
./deploy.sh restart
```

### SSL não funciona

```bash
# Verificar DNS primeiro
nslookup coex.projdev.site

# Reconfigurar SSL
./deploy.sh ssl

# Ver guia: DNS_SSL_CONFIG.md
```

### 502 Bad Gateway

```bash
# Verificar se aplicação está rodando
sudo systemctl status controle-itens

# Verificar porta 5100
sudo netstat -tulpn | grep 5100

# Ver logs de erro
sudo tail -f /var/log/controle-itens/error.log
```

---

## 📊 Monitoramento

```bash
# Ver logs do serviço
sudo journalctl -u controle-itens -f

# Ver logs do Nginx
sudo tail -f /var/log/nginx/controle-itens-error.log

# Ver logs da aplicação
sudo tail -f /var/log/controle-itens/error.log
```

---

## 🔄 Backup Automático

```bash
# Configurar backup diário
chmod +x backup.sh

# Adicionar ao cron
crontab -e

# Adicionar linha (backup às 2h da manhã):
0 2 * * * /var/www/controle-itens-eventos/backup.sh >> /var/log/controle-itens/backup.log 2>&1
```

---

## ✅ Checklist Final

- [ ] DNS configurado (coex.projdev.site → IP da VPS)
- [ ] Projeto instalado em `/var/www/controle-itens-eventos`
- [ ] Serviço rodando: `./deploy.sh status`
- [ ] SSL configurado: `./deploy.sh ssl`
- [ ] HTTPS funcionando: https://coex.projdev.site
- [ ] Firewall configurado (UFW)
- [ ] Senha do admin alterada
- [ ] Backup automático configurado (opcional)

---

**Acesso:** https://coex.projdev.site  
**Porta interna:** 5100  
**Logs:** `/var/log/controle-itens/`

---

**Dúvidas?** Consulte os guias completos ou verifique os logs! 📖

---

## 📚 Documentação Completa

Veja o arquivo **[DEPLOY_VPS.md](./DEPLOY_VPS.md)** para:
- Configuração detalhada passo a passo
- Configuração de SSL/HTTPS
- Troubleshooting
- Comandos de gerenciamento
- Configuração de backup automático

---

## ⚡ Comandos Rápidos

```bash
# Atualizar aplicação (após git pull)
./deploy.sh update

# Reiniciar serviço
./deploy.sh restart

# Ver logs em tempo real
./deploy.sh logs

# Ver status do serviço
./deploy.sh status
```

---

## 🔄 Backup Automático

```bash
# Tornar script de backup executável
chmod +x backup.sh

# Configurar cron para backup diário às 2h da manhã
crontab -e

# Adicionar linha:
0 2 * * * /var/www/controle-itens-eventos/backup.sh >> /var/log/controle-itens/backup.log 2>&1
```

---

## 🛠️ Comandos Úteis

```bash
# Ver status do serviço
sudo systemctl status controle-itens

# Reiniciar serviço
sudo systemctl restart controle-itens

# Ver logs
sudo journalctl -u controle-itens -f

# Ver logs da aplicação
tail -f /var/log/controle-itens/error.log

# Testar configuração do Nginx
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## 🔒 Segurança (Importante!)

Após instalação, configure:

1. **Firewall:**
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

2. **SSL/HTTPS (com domínio):**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seu-dominio.com
```

3. **Mudar senha padrão do admin** no primeiro acesso!

---

## ❓ Problemas?

1. Verifique logs: `./deploy.sh logs`
2. Veja status: `./deploy.sh status`
3. Consulte [DEPLOY_VPS.md](./DEPLOY_VPS.md) seção Troubleshooting

---

**Desenvolvido por:** Bruno Vargas  
**Repositório:** [brusodev/controle-itens-eventos](https://github.com/brusodev/controle-itens-eventos)
