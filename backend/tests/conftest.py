"""
Fixtures compartilhadas para todos os testes do portal da detentora.
Usa SQLite em memória — sem dependência de banco de dados real.
"""
import sys
import os
import secrets
import base64
import pytest

# Garantir que o diretório backend/ está no path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask
from models import db, Detentora, Usuario, OrdemServico


def create_test_app():
    """Cria uma instância de app Flask isolada para testes."""
    app = Flask(__name__, instance_path='/tmp')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'test-secret-key-sprint4'
    app.config['TESTING'] = True
    app.config['PORTAL_DETENTORA_ATIVO'] = True  # Feature flag ativa por padrão nos testes
    app.config['WTF_CSRF_ENABLED'] = False  # Gerenciado pelo decorator próprio

    db.init_app(app)

    from routes.auth_routes import auth_bp
    from routes.os_routes import os_bp
    from routes.detentora_portal_routes import detentora_portal_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(os_bp, url_prefix='/api/ordens-servico')
    app.register_blueprint(detentora_portal_bp, url_prefix='/api/empresa')

    return app


@pytest.fixture(scope='function')
def app():
    """App Flask com banco em memória limpo a cada teste."""
    application = create_test_app()
    with application.app_context():
        db.create_all()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope='function')
def client(app):
    return app.test_client()


# ---------------------------------------------------------------------------
# Fixtures de dados
# ---------------------------------------------------------------------------

@pytest.fixture
def detentora_alpha(app):
    with app.app_context():
        det = Detentora(contrato_num='001/2025', nome='Alpha LTDA', cnpj='00.000.000/0001-00', grupo='1')
        db.session.add(det)
        db.session.commit()
        return det.id  # Retorna apenas o ID para evitar sessão detached


@pytest.fixture
def detentora_beta(app):
    with app.app_context():
        det = Detentora(contrato_num='002/2025', nome='Beta LTDA', cnpj='11.111.111/0001-11', grupo='2')
        db.session.add(det)
        db.session.commit()
        return det.id


@pytest.fixture
def usuario_admin(app):
    with app.app_context():
        u = Usuario(nome='Admin', email='admin@test.com', perfil='admin')
        u.set_senha('senha123')
        db.session.add(u)
        db.session.commit()
        return u.id


@pytest.fixture
def usuario_empresa_alpha(app, detentora_alpha):
    with app.app_context():
        u = Usuario(nome='User Alpha', email='alpha@test.com', perfil='empresa', detentora_id=detentora_alpha)
        u.set_senha('senha123')
        db.session.add(u)
        db.session.commit()
        return u.id


@pytest.fixture
def usuario_empresa_beta(app, detentora_beta):
    with app.app_context():
        u = Usuario(nome='User Beta', email='beta@test.com', perfil='empresa', detentora_id=detentora_beta)
        u.set_senha('senha123')
        db.session.add(u)
        db.session.commit()
        return u.id


@pytest.fixture
def os_enviada_alpha(app, detentora_alpha):
    """O.S. já enviada à detentora Alpha."""
    with app.app_context():
        os_obj = OrdemServico(
            numero_os='1/2026', modulo='coffee', grupo='1',
            detentora_id=detentora_alpha, status='enviada_empresa',
            evento='Evento Alpha', data='2026-01-01'
        )
        db.session.add(os_obj)
        db.session.commit()
        return os_obj.id


@pytest.fixture
def os_emitida_alpha(app, detentora_alpha):
    """O.S. ainda emitida (não enviada) da detentora Alpha."""
    with app.app_context():
        os_obj = OrdemServico(
            numero_os='2/2026', modulo='coffee', grupo='1',
            detentora_id=detentora_alpha, status='emitida',
            evento='Evento Emitido Alpha', data='2026-01-02'
        )
        db.session.add(os_obj)
        db.session.commit()
        return os_obj.id


@pytest.fixture
def os_enviada_beta(app, detentora_beta):
    """O.S. enviada à detentora Beta (deve ser invisível para Alpha)."""
    with app.app_context():
        os_obj = OrdemServico(
            numero_os='3/2026', modulo='coffee', grupo='2',
            detentora_id=detentora_beta, status='enviada_empresa',
            evento='Evento Beta', data='2026-01-03'
        )
        db.session.add(os_obj)
        db.session.commit()
        return os_obj.id


# ---------------------------------------------------------------------------
# Helpers de sessão
# ---------------------------------------------------------------------------

def sessao_empresa(client, usuario_id, detentora_id,
                   nome='User Empresa', email='empresa@test.com'):
    """Injeta sessão de usuário empresa com CSRF token."""
    token = secrets.token_hex(32)
    with client.session_transaction() as s:
        s['usuario_id'] = usuario_id
        s['usuario_perfil'] = 'empresa'
        s['detentora_id'] = detentora_id
        s['csrf_token'] = token
        s['usuario_nome'] = nome
        s['usuario_email'] = email
    return token


def sessao_admin(client, usuario_id,
                 nome='Admin', email='admin@test.com'):
    """Injeta sessão de admin com CSRF token."""
    token = secrets.token_hex(32)
    with client.session_transaction() as s:
        s['usuario_id'] = usuario_id
        s['usuario_perfil'] = 'admin'
        s['detentora_id'] = None
        s['csrf_token'] = token
        s['usuario_nome'] = nome
        s['usuario_email'] = email
    return token


def assinatura_fake_b64():
    """Retorna uma assinatura PNG mínima válida (1x1) em base64.

    A rota de aceite valida os magic bytes do PNG, então o conteúdo precisa
    começar com a assinatura PNG (89 50 4E 47 0D 0A 1A 0A).
    """
    png_1x1 = bytes([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # magic bytes PNG
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,  # IDAT chunk
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,  # IEND chunk
        0x42, 0x60, 0x82,
    ])
    return 'data:image/png;base64,' + base64.b64encode(png_1x1).decode()
