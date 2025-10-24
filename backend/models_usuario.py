"""
Modelo de Usuário para o sistema de autenticação
"""
from models import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


class Usuario(db.Model):
    """Modelo de Usuário do sistema"""
    __tablename__ = 'usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    senha_hash = db.Column(db.String(255), nullable=False)
    cargo = db.Column(db.String(100), nullable=True)  # Gestor, Operador, Fiscal, etc
    ativo = db.Column(db.Boolean, default=True)
    
    # Auditoria
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    atualizado_em = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ultimo_acesso = db.Column(db.DateTime, nullable=True)
    
    def set_senha(self, senha):
        """Define a senha (com hash)"""
        self.senha_hash = generate_password_hash(senha, method='pbkdf2:sha256')
    
    def verificar_senha(self, senha):
        """Verifica se a senha está correta"""
        return check_password_hash(self.senha_hash, senha)
    
    def to_dict(self):
        """Converte usuário para dicionário (sem dados sensíveis)"""
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'cargo': self.cargo,
            'ativo': self.ativo,
            'criadoEm': self.criado_em.isoformat() if self.criado_em else None,
            'ultimoAcesso': self.ultimo_acesso.isoformat() if self.ultimo_acesso else None
        }
    
    def __repr__(self):
        return f'<Usuario {self.email}>'
