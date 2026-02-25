from flask import Flask, render_template
from flask_cors import CORS
from models import db
from dotenv import load_dotenv
import os
import secrets

# Diretório absoluto de app.py (backend/) — funciona de qualquer CWD
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Carregar .env sempre de backend/, independente de onde o servidor for iniciado
load_dotenv(os.path.join(BASE_DIR, '.env'))

def create_app():
    app = Flask(__name__)

    # Banco de dados com caminho absoluto (evita duplicar instâncias)
    db_path = os.path.join(BASE_DIR, 'instance', 'controle_itens.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JSON_AS_ASCII'] = False

    # Seguranca e Sessao
    secret_key = os.environ.get('SECRET_KEY')
    if not secret_key:
        if os.environ.get('FLASK_ENV') == 'production':
            raise RuntimeError(
                'SECRET_KEY nao definida! Em producao, defina a variavel de ambiente SECRET_KEY. '
                'Gere uma com: python -c "import secrets; print(secrets.token_hex(32))"'
            )
        # Em desenvolvimento, gerar uma chave aleatoria (muda a cada reinicio)
        secret_key = secrets.token_hex(32)
        print('[AVISO] SECRET_KEY nao definida. Usando chave temporaria (sessoes serao perdidas ao reiniciar).')
        print('[AVISO] Crie um arquivo .env com SECRET_KEY=<sua-chave> para persistir sessoes.')

    app.config['SECRET_KEY'] = secret_key
    app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production'
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 horas

    # CORS restrito - suporta multiplas origens separadas por virgula no .env
    # Ex: CORS_ORIGIN=https://meusite.com,http://localhost:5100
    cors_raw = os.environ.get('CORS_ORIGIN', 'http://localhost:5100')
    cors_origins = [o.strip() for o in cors_raw.split(',') if o.strip()]
    CORS(app, origins=cors_origins, supports_credentials=True)

    # Inicializar banco
    db.init_app(app)

    # Registrar rotas de views (templates HTML)
    from routes.views_routes import views_bp
    from routes.auth_routes import auth_bp
    app.register_blueprint(views_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth')

    # Registrar rotas de API
    from routes.itens_routes import itens_bp
    from routes.alimentacao_routes import alimentacao_bp
    from routes.os_routes import os_bp
    from routes.relatorios_routes import relatorios_bp
    from routes.detentoras_routes import detentoras_bp
    from routes.auditoria_routes import auditoria_bp
    from routes.categorias_routes import categorias_bp

    app.register_blueprint(itens_bp, url_prefix='/api/itens')
    app.register_blueprint(categorias_bp, url_prefix='/api/categorias')
    app.register_blueprint(alimentacao_bp, url_prefix='/api/alimentacao')
    app.register_blueprint(os_bp, url_prefix='/api/ordens-servico')
    app.register_blueprint(relatorios_bp)
    app.register_blueprint(detentoras_bp, url_prefix='/api/detentoras')
    app.register_blueprint(auditoria_bp, url_prefix='/api/auditoria')

    # Headers de segurança em todas as respostas
    @app.after_request
    def adicionar_headers_seguranca(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        if os.environ.get('FLASK_ENV') == 'production':
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response

    # Handler de erro 403 (Acesso Negado)
    @app.errorhandler(403)
    def acesso_negado(e):
        return render_template('403.html'), 403

    # Criar tabelas
    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug_mode, port=5100)
