from flask import Flask, render_template
from flask_cors import CORS
from models import db
import os

def create_app():
    app = Flask(__name__)
    
    # Configurações
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///controle_itens.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JSON_AS_ASCII'] = False
    
    # Segurança e Sessão
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-mudareemprodução')
    app.config['SESSION_COOKIE_SECURE'] = False  # True em produção com HTTPS
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 horas
    
    # CORS para permitir requisições do frontend
    CORS(app)
    
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
    app.run(debug=True, port=5100)
