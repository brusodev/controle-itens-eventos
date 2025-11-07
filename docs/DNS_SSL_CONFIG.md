# 🌐 Configuração de DNS e SSL para coex.projdev.site

## ⚠️ ANTES DE COMEÇAR

Certifique-se que o domínio **coex.projdev.site** está apontando para o IP da sua VPS!

---

## 📍 Passo 1: Configurar DNS

No painel do seu provedor de DNS (onde você registrou projdev.site), crie:

### Registro A
```
Tipo: A
Nome: coex
Valor: SEU-IP-DA-VPS
TTL: 3600 (ou padrão)
```

### Como verificar se está funcionando:

```bash
# No seu computador local, teste:
nslookup coex.projdev.site

# Ou:
ping coex.projdev.site

# Deve retornar o IP da sua VPS
```

**⏰ Aguarde propagação:** Pode levar de 5 minutos a 24 horas.

---

## 🔒 Passo 2: Instalar Certificado SSL (Let's Encrypt)

Na VPS, execute:

```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL para coex.projdev.site
sudo certbot --nginx -d coex.projdev.site
```

### Durante a instalação:

1. **Email:** Digite seu email (para avisos de expiração)
2. **Termos:** Aceite os termos (Y)
3. **Compartilhar email:** Opcional (N)
4. **Redirecionar HTTP → HTTPS:** Sim (opção 2)

### Resultado esperado:

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/coex.projdev.site/fullchain.pem
Key is saved at: /etc/letsencrypt/live/coex.projdev.site/privkey.pem
```

---

## ✅ Passo 3: Verificar Configuração

```bash
# Verificar certificado
sudo certbot certificates

# Verificar configuração do Nginx
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx

# Verificar status do serviço
sudo systemctl status controle-itens
```

---

## 🌍 Passo 4: Testar no Navegador

Acesse: **https://coex.projdev.site**

### Checklist:
- [ ] Carrega com cadeado verde (HTTPS)
- [ ] Certificado válido (clique no cadeado)
- [ ] HTTP redireciona automaticamente para HTTPS
- [ ] Aplicação funciona normalmente

---

## 🔄 Renovação Automática

O Certbot configura renovação automática. Verificar:

```bash
# Ver timer de renovação
sudo systemctl status certbot.timer

# Testar renovação (modo dry-run, não renova de verdade)
sudo certbot renew --dry-run
```

**Renovação automática:** A cada 60 dias (certificado válido por 90).

---

## 🐛 Troubleshooting

### Erro: "coex.projdev.site não aponta para este servidor"

**Solução:**
1. Verifique DNS: `nslookup coex.projdev.site`
2. Aguarde propagação DNS (até 24h)
3. Certifique-se que o IP retornado é o da VPS

### Erro: "Nginx test failed"

**Solução:**
```bash
# Ver erros
sudo nginx -t

# Verificar configuração
sudo nano /etc/nginx/sites-available/controle-itens

# Recarregar
sudo systemctl reload nginx
```

### Certificado não renova automaticamente

**Solução:**
```bash
# Forçar renovação manual
sudo certbot renew --force-renewal

# Verificar timer
sudo systemctl status certbot.timer
```

### Site mostra "Connection refused" ou "502 Bad Gateway"

**Solução:**
```bash
# Verificar se aplicação está rodando
sudo systemctl status controle-itens

# Verificar se está na porta correta
sudo netstat -tulpn | grep 5100

# Ver logs
sudo journalctl -u controle-itens -n 50
```

---

## 🔐 Configurações de Segurança SSL (Já Configuradas)

O Nginx está configurado com:

- ✅ **Protocolos:** TLSv1.2 e TLSv1.3 (seguros)
- ✅ **Ciphers:** HIGH (criptografia forte)
- ✅ **HSTS:** Headers de segurança
- ✅ **Redirecionamento HTTP → HTTPS:** Automático
- ✅ **Grade SSL:** A+ no SSL Labs

### Testar segurança SSL:

Acesse: https://www.ssllabs.com/ssltest/analyze.html?d=coex.projdev.site

---

## 📋 Comandos Úteis

```bash
# Ver certificados instalados
sudo certbot certificates

# Renovar certificados manualmente
sudo certbot renew

# Revogar certificado (se necessário)
sudo certbot revoke --cert-path /etc/letsencrypt/live/coex.projdev.site/fullchain.pem

# Ver logs do Certbot
sudo journalctl -u certbot

# Ver configuração do Nginx
sudo cat /etc/nginx/sites-available/controle-itens
```

---

## ✅ Checklist Final

- [ ] DNS configurado (Registro A apontando para VPS)
- [ ] DNS propagado (nslookup funciona)
- [ ] Certbot instalado
- [ ] Certificado SSL obtido para coex.projdev.site
- [ ] Nginx configurado e recarregado
- [ ] Aplicação rodando na porta 5100
- [ ] HTTPS funcionando (https://coex.projdev.site)
- [ ] HTTP redireciona para HTTPS
- [ ] Certificado válido (cadeado verde)
- [ ] Renovação automática configurada

---

**Tudo certo?** Acesse: **https://coex.projdev.site** 🚀
