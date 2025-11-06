#!/bin/bash
#
# Script de Deploy Automático - Controle de Itens e Eventos
# Uso: ./deploy.sh [install|update|restart|logs]
#

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
APP_NAME="controle-itens"
APP_DIR="/var/www/controle-itens-eventos"
BACKEND_DIR="$APP_DIR/backend"
SERVICE_NAME="controle-itens.service"
NGINX_CONF="/etc/nginx/sites-available/controle-itens"
REPO_URL="https://github.com/brusodev/controle-itens-eventos.git"
DOMAIN="coex.projdev.site"
APP_PORT="5100"

# Funções auxiliares
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

# Verificar se está rodando como root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_error "Não execute como root. Use seu usuário normal."
        exit 1
    fi
}

# Instalação completa
install() {
    print_info "Iniciando instalação completa..."
    
    # 1. Instalar dependências do sistema
    print_info "Instalando dependências do sistema..."
    sudo apt update
    sudo apt install -y python3 python3-pip python3-venv nginx git
    print_success "Dependências instaladas"
    
    # 2. Clonar repositório
    if [ ! -d "$APP_DIR" ]; then
        print_info "Clonando repositório..."
        sudo mkdir -p /var/www
        cd /var/www
        sudo git clone "$REPO_URL"
        sudo chown -R $USER:$USER controle-itens-eventos
        print_success "Repositório clonado"
    else
        print_info "Diretório já existe, atualizando..."
        cd "$APP_DIR"
        git pull origin main
        print_success "Código atualizado"
    fi
    
    # 3. Configurar ambiente virtual
    print_info "Configurando ambiente virtual..."
    cd "$BACKEND_DIR"
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    print_success "Ambiente virtual configurado"
    
    # 4. Criar diretórios necessários
    print_info "Criando diretórios..."
    mkdir -p "$BACKEND_DIR/instance"
    sudo mkdir -p /var/log/controle-itens
    sudo chown -R $USER:www-data /var/log/controle-itens
    print_success "Diretórios criados"
    
    # 5. Criar serviço systemd
    print_info "Criando serviço systemd..."
    sudo tee /etc/systemd/system/$SERVICE_NAME > /dev/null <<EOF
[Unit]
Description=Sistema de Controle de Itens e Eventos
After=network.target

[Service]
Type=simple
User=$USER
Group=www-data
WorkingDirectory=$BACKEND_DIR
Environment="PATH=$BACKEND_DIR/venv/bin"
ExecStart=$BACKEND_DIR/venv/bin/python app.py
Restart=always
RestartSec=3

StandardOutput=append:/var/log/controle-itens/access.log
StandardError=append:/var/log/controle-itens/error.log

NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
    print_success "Serviço systemd criado"
    
    # 6. Configurar Nginx
    print_info "Configurando Nginx..."
    sudo tee $NGINX_CONF > /dev/null <<'EOF'
server {
    listen 80;
    server_name coex.projdev.site;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name coex.projdev.site;

    # Certificados SSL (configurados pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/coex.projdev.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coex.projdev.site/privkey.pem;
    
    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    access_log /var/log/nginx/controle-itens-access.log;
    error_log /var/log/nginx/controle-itens-error.log;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /static/ {
        alias /var/www/controle-itens-eventos/backend/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
    print_success "Nginx configurado"
    
    # 7. Habilitar e iniciar serviço
    print_info "Iniciando serviço..."
    sudo systemctl daemon-reload
    sudo systemctl enable $SERVICE_NAME
    sudo systemctl start $SERVICE_NAME
    print_success "Serviço iniciado"
    
    # 8. Status final
    echo ""
    print_success "Instalação concluída!"
    echo ""
    print_info "Status do serviço:"
    sudo systemctl status $SERVICE_NAME --no-pager
    echo ""
    print_info "Próximos passos:"
    echo "  1. Configure DNS: Aponte $DOMAIN para o IP desta VPS"
    echo "  2. Instale SSL: sudo certbot --nginx -d $DOMAIN"
    echo "  3. Acesse: https://$DOMAIN"
    echo ""
    print_info "Ver guia completo: cat DNS_SSL_CONFIG.md"
}

# Configurar SSL
ssl() {
    print_info "Configurando SSL para $DOMAIN..."
    
    # Verificar se DNS está configurado
    print_info "Verificando DNS..."
    if ! nslookup $DOMAIN > /dev/null 2>&1; then
        print_error "DNS não está configurado corretamente!"
        echo "Configure o DNS antes de instalar SSL."
        echo "Ver guia: DNS_SSL_CONFIG.md"
        exit 1
    fi
    
    print_success "DNS configurado corretamente"
    
    # Instalar Certbot
    print_info "Instalando Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
    
    # Obter certificado
    print_info "Obtendo certificado SSL..."
    sudo certbot --nginx -d $DOMAIN
    
    # Testar renovação
    print_info "Testando renovação automática..."
    sudo certbot renew --dry-run
    
    print_success "SSL configurado com sucesso!"
    echo ""
    print_info "Acesse: https://$DOMAIN"
}

# Atualizar aplicação
update() {
    print_info "Atualizando aplicação..."
    
    # Parar serviço
    print_info "Parando serviço..."
    sudo systemctl stop $SERVICE_NAME
    
    # Atualizar código
    print_info "Atualizando código..."
    cd "$APP_DIR"
    git pull origin main
    
    # Atualizar dependências
    print_info "Atualizando dependências..."
    cd "$BACKEND_DIR"
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Reiniciar serviço
    print_info "Reiniciando serviço..."
    sudo systemctl start $SERVICE_NAME
    
    print_success "Aplicação atualizada!"
    sudo systemctl status $SERVICE_NAME --no-pager
}

# Reiniciar serviço
restart() {
    print_info "Reiniciando serviço..."
    sudo systemctl restart $SERVICE_NAME
    print_success "Serviço reiniciado!"
    sudo systemctl status $SERVICE_NAME --no-pager
}

# Ver logs
logs() {
    print_info "Exibindo logs (Ctrl+C para sair)..."
    sudo journalctl -u $SERVICE_NAME -f
}

# Status
status() {
    sudo systemctl status $SERVICE_NAME
}

# Menu de ajuda
help() {
    echo "Uso: ./deploy.sh [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  install   - Instalação completa (primeira vez)"
    echo "  ssl       - Configurar SSL/HTTPS com Let's Encrypt"
    echo "  update    - Atualizar código e dependências"
    echo "  restart   - Reiniciar serviço"
    echo "  logs      - Ver logs em tempo real"
    echo "  status    - Ver status do serviço"
    echo "  help      - Mostrar esta ajuda"
    echo ""
    echo "Domínio configurado: $DOMAIN"
    echo "Porta da aplicação: $APP_PORT"
    echo ""
}

# Main
check_root

case "$1" in
    install)
        install
        ;;
    ssl)
        ssl
        ;;
    update)
        update
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    help|--help|-h)
        help
        ;;
    *)
        print_error "Comando inválido: $1"
        echo ""
        help
        exit 1
        ;;
esac
