# 📋 Resumo de Produção - coex.projdev.site

## ⚙️ Configuração do Servidor

| Item | Valor |
|------|-------|
| **Domínio** | coex.projdev.site |
| **SSL** | ✅ HTTPS obrigatório |
| **Porta Interna** | 5100 |
| **Porta Externa** | 443 (HTTPS), 80 → 443 |
| **Servidor** | Nginx + Flask |
| **Banco** | SQLite |
| **SO** | Ubuntu 20.04+ |

---

## 🚀 Deploy em 3 Comandos

```bash
git clone https://github.com/brusodev/controle-itens-eventos.git
cd controle-itens-eventos
chmod +x deploy.sh && ./deploy.sh install && ./deploy.sh ssl
```

**Acesso:** https://coex.projdev.site

---

## 📂 Arquivos na VPS

```
/var/www/controle-itens-eventos/  # Aplicação
/etc/nginx/sites-available/controle-itens  # Nginx config
/etc/systemd/system/controle-itens.service  # Systemd
/var/log/controle-itens/  # Logs
/var/backups/controle-itens/  # Backups
```

---

## 🔧 Comandos Rápidos

```bash
./deploy.sh status    # Ver status
./deploy.sh restart   # Reiniciar
./deploy.sh logs      # Ver logs
./deploy.sh update    # Atualizar
./deploy.sh ssl       # Config SSL
```

---

## 🔒 Checklist Segurança

- [ ] DNS configurado
- [ ] SSL instalado
- [ ] Firewall ativo (UFW)
- [ ] Senha admin alterada
- [ ] Backup automático

---

**Docs:** DEPLOY_VPS.md | DNS_SSL_CONFIG.md | DEPLOY_QUICK.md
