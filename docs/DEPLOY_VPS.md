# Deploy em VPS Ubuntu - Guia Completo

Este guia mostra como configurar o projeto para rodar como serviço systemd no Ubuntu, iniciando automaticamente com o sistema.

## 📋 Pré-requisitos na VPS

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python 3.10+ e dependências
sudo apt install python3 python3-pip python3-venv nginx git -y

# Verificar versão do Python
python3 --version
```

## 🚀 Passo 1: Clonar o Projeto

```bash
# Criar diretório para aplicações
sudo mkdir -p /var/www
cd /var/www

# Clonar repositório (substitua pela sua URL)
sudo git clone https://github.com/brusodev/controle-itens-eventos.git
sudo chown -R $USER:$USER controle-itens-eventos
cd controle-itens-eventos
```

## 🔧 Passo 2: Configurar Ambiente Virtual

```bash
# Criar ambiente virtual
cd backend
python3 -m venv venv

# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências
pip install --upgrade pip
pip install -r requirements.txt

# Criar diretório para banco de dados
mkdir -p instance

# Testar execução (Ctrl+C para parar)
python app.py
```

## ⚙️ Passo 3: Criar Serviço Systemd

Crie o arquivo de serviço:

```bash
sudo nano /etc/systemd/system/controle-itens.service
```

Cole o conteúdo abaixo (ajuste o usuário se necessário):

```ini
[Unit]
Description=Sistema de Controle de Itens e Eventos
After=network.target

[Service]
Type=simple
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/controle-itens-eventos/backend
Environment="PATH=/var/www/controle-itens-eventos/backend/venv/bin"
ExecStart=/var/www/controle-itens-eventos/backend/venv/bin/python app.py
Restart=always
RestartSec=3

# Logs
StandardOutput=append:/var/log/controle-itens/access.log
StandardError=append:/var/log/controle-itens/error.log

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

**Ajustes importantes:**
- `User=ubuntu` → substitua pelo seu usuário (use `whoami` para descobrir)
- Se o Python estiver instalado em local diferente, ajuste o caminho

## 📝 Passo 4: Configurar Logs

```bash
# Criar diretório de logs
sudo mkdir -p /var/log/controle-itens
sudo chown -R $USER:www-data /var/log/controle-itens
sudo chmod 755 /var/log/controle-itens
```

## 🔄 Passo 5: Ativar e Iniciar Serviço

```bash
# Recarregar systemd
sudo systemctl daemon-reload

# Habilitar serviço (inicia com o sistema)
sudo systemctl enable controle-itens.service

# Iniciar serviço
sudo systemctl start controle-itens.service

# Verificar status
sudo systemctl status controle-itens.service
```

## 🌐 Passo 6: Configurar Nginx (Proxy Reverso)

Crie configuração do Nginx:

```bash
sudo nano /etc/nginx/sites-available/controle-itens
```

Cole o conteúdo:

```nginx
server {
    listen 80;
    server_name coex.projdev.site;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name coex.projdev.site;

    # Certificados SSL (serão configurados pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/coex.projdev.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coex.projdev.site/privkey.pem;
    
    # Configurações SSL recomendadas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Logs
    access_log /var/log/nginx/controle-itens-access.log;
    error_log /var/log/nginx/controle-itens-error.log;

    # Tamanho máximo de upload (para PDFs)
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (se necessário)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Servir arquivos estáticos diretamente
    location /static/ {
        alias /var/www/controle-itens-eventos/backend/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Ativar configuração:

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/controle-itens /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

## 🔒 Passo 7: Configurar SSL (HTTPS) com Certbot

**IMPORTANTE:** Antes de executar, certifique-se que o domínio `coex.projdev.site` aponta para o IP da sua VPS!

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d coex.projdev.site

# Testar renovação automática
sudo certbot renew --dry-run
```

O Certbot vai:
- ✅ Obter certificado SSL gratuito do Let's Encrypt
- ✅ Configurar HTTPS automaticamente
- ✅ Configurar renovação automática (válido por 90 dias)

Após configuração, acesse: **https://coex.projdev.site**

## 📊 Comandos Úteis

### Gerenciar Serviço

```bash
# Ver status
sudo systemctl status controle-itens

# Parar serviço
sudo systemctl stop controle-itens

# Iniciar serviço
sudo systemctl start controle-itens

# Reiniciar serviço
sudo systemctl restart controle-itens

# Ver logs em tempo real
sudo journalctl -u controle-itens -f

# Ver últimas 100 linhas de log
sudo journalctl -u controle-itens -n 100
```

### Ver Logs da Aplicação

```bash
# Logs de acesso
tail -f /var/log/controle-itens/access.log

# Logs de erro
tail -f /var/log/controle-itens/error.log

# Logs do Nginx
tail -f /var/log/nginx/controle-itens-access.log
tail -f /var/log/nginx/controle-itens-error.log
```

## 🔄 Atualizar Aplicação

```bash
cd /var/www/controle-itens-eventos

# Parar serviço
sudo systemctl stop controle-itens

# Atualizar código
git pull origin main

# Atualizar dependências (se necessário)
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Reiniciar serviço
sudo systemctl start controle-itens
```

## 🛡️ Segurança Adicional (Recomendado)

### Firewall (UFW)

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ver status
sudo ufw status
```

### Permissões de Arquivos

```bash
# Garantir permissões corretas
cd /var/www/controle-itens-eventos
sudo chown -R $USER:www-data .
sudo chmod -R 755 .

# Banco de dados somente leitura/escrita pelo usuário
chmod 600 backend/instance/*.db
```

## 🐛 Troubleshooting

### Serviço não inicia

```bash
# Ver logs detalhados
sudo journalctl -u controle-itens -n 50 --no-pager

# Verificar se a porta 5000 está em uso
sudo netstat -tulpn | grep 5000

# Testar manualmente
cd /var/www/controle-itens-eventos/backend
source venv/bin/activate
python app.py
```

### Nginx retorna 502 Bad Gateway

```bash
# Verificar se o serviço está rodando
sudo systemctl status controle-itens

# Verificar porta Flask
curl http://127.0.0.1:5000

# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

### Banco de dados não encontrado

```bash
# Criar diretório instance se não existir
cd /var/www/controle-itens-eventos/backend
mkdir -p instance

# Verificar permissões
ls -la instance/

# Se necessário, recriar banco
python init_db.py
```

## 📈 Monitoramento (Opcional)

### Instalar htop

```bash
sudo apt install htop -y
htop
```

### Verificar uso de memória

```bash
free -h
```

### Verificar espaço em disco

```bash
df -h
```

## ✅ Checklist Final

- [ ] Projeto clonado em `/var/www/controle-itens-eventos`
- [ ] Ambiente virtual criado e dependências instaladas
- [ ] Serviço systemd criado e habilitado
- [ ] Logs configurados em `/var/log/controle-itens/`
- [ ] Nginx configurado como proxy reverso
- [ ] Firewall configurado (UFW)
- [ ] SSL/HTTPS configurado (certbot)
- [ ] Serviço iniciando automaticamente com o sistema
- [ ] Aplicação acessível via navegador

## 🎯 Acesso

Após configuração completa:
- **HTTPS**: https://coex.projdev.site (porta 443)
- **HTTP**: http://coex.projdev.site (redireciona automaticamente para HTTPS)

**Porta da aplicação Flask:** 5100 (interna, não exposta)

---

**Dúvidas?** Verifique os logs do serviço e do Nginx para diagnosticar problemas.
