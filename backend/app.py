from flask import Flask
from flask_cors import CORS
from models import db
import os

def create_app():
    app = Flask(__name__)
    
    # Configurações
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///controle_itens.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JSON_AS_ASCII'] = False
    
    # CORS para permitir requisições do frontend
    CORS(app)
    
    # Inicializar banco
    db.init_app(app)
    
    # Registrar rotas de views (templates HTML)
    from routes.views_routes import views_bp
    app.register_blueprint(views_bp)
    
    # Registrar rotas de API
    from routes.itens_routes import itens_bp
    from routes.alimentacao_routes import alimentacao_bp
    from routes.os_routes import os_bp
    
    app.register_blueprint(itens_bp, url_prefix='/api/itens')
    app.register_blueprint(alimentacao_bp, url_prefix='/api/alimentacao')
    app.register_blueprint(os_bp, url_prefix='/api/ordens-servico')
    
    # Criar tabelas
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5100)
