from flask import Blueprint, render_template, session, redirect, url_for, abort
from functools import wraps

views_bp = Blueprint('views', __name__)

def login_requerido(f):
    """Decorator para verificar se o usuário está logado"""
    @wraps(f)
    def verificar_login(*args, **kwargs):
        if 'usuario_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return verificar_login

def admin_requerido(f):
    """Decorator para verificar se o usuário é administrador"""
    @wraps(f)
    def verificar_admin(*args, **kwargs):
        if 'usuario_id' not in session:
            return redirect(url_for('auth.login'))
        if session.get('usuario_perfil') != 'admin':
            abort(403)  # Forbidden
        return f(*args, **kwargs)
    return verificar_admin

@views_bp.before_request
def verificar_autenticacao():
    """Middleware para verificar autenticação em todas as rotas"""
    pass

@views_bp.route('/')
@login_requerido
def index():
    """Página principal do sistema"""
    return render_template('index.html',
                         usuario_nome=session.get('usuario_nome'),
                         usuario_perfil=session.get('usuario_perfil', 'comum'))

@views_bp.route('/dashboard')
@login_requerido
def dashboard():
    """Painel de seleção de módulos"""
    return render_template('dashboard.html',
                         usuario_nome=session.get('usuario_nome'),
                         usuario_perfil=session.get('usuario_perfil', 'comum'))

@views_bp.route('/importar-os')
@login_requerido
def importar_os():
    """Página de importação de O.S. antigas"""
    return render_template('importar-os-antigas.html',
                         usuario_nome=session.get('usuario_nome'),
                         usuario_perfil=session.get('usuario_perfil', 'comum'))

@views_bp.route('/gerenciar-conta')
@login_requerido
def gerenciar_conta():
    """Página de gerenciamento de conta"""
    return render_template('gerenciar-conta.html',
                         usuario_nome=session.get('usuario_nome'),
                         usuario_perfil=session.get('usuario_perfil', 'comum'))

@views_bp.route('/alterar-senha')
@login_requerido
def alterar_senha():
    """Página para alterar senha"""
    return render_template('alterar-senha.html',
                         usuario_nome=session.get('usuario_nome'),
                         usuario_perfil=session.get('usuario_perfil', 'comum'))

@views_bp.route('/gerenciar-usuarios')
@admin_requerido
def gerenciar_usuarios():
    """Página de gerenciamento de usuários (apenas admin)"""
    return render_template('gerenciar-usuarios.html', 
                         usuario_nome=session.get('usuario_nome'),
                         usuario_perfil=session.get('usuario_perfil', 'comum'))

@views_bp.route('/alimentacao')
@views_bp.route('/estoque')
@login_requerido
def alimentacao():
    """Página de Itens/Estoque do Módulo"""
    return render_template('index.html', 
                         secao_ativa='alimentacao',
                         usuario_nome=session.get('usuario_nome'),
                         usuario_perfil=session.get('usuario_perfil', 'comum'))

@views_bp.route('/emitir-os')
@login_requerido
def emitir_os():
    """Página para Emitir Ordem de Serviço"""
    return render_template('index.html', 
                         secao_ativa='emitir-os',
                         usuario_nome=session.get('usuario_nome'),
                         usuario_perfil=session.get('usuario_perfil', 'comum'))

@views_bp.route('/ordens-servico')
@login_requerido
def ordens_servico():
    """Página de Ordens de Serviço"""
    return render_template('index.html', 
                         secao_ativa='ordens-servico',
                         usuario_nome=session.get('usuario_nome'),
                         usuario_perfil=session.get('usuario_perfil', 'comum'))

@views_bp.route('/relatorios')
@login_requerido
def relatorios():
    """Página de Relatórios"""
    return render_template('index.html', 
                         secao_ativa='relatorios',
                         usuario_nome=session.get('usuario_nome'),
                         usuario_perfil=session.get('usuario_perfil', 'comum'))

@views_bp.route('/detentoras')
@login_requerido
def detentoras():
    """Página de Gerenciamento de Detentoras"""
    return render_template('gerenciar-detentoras.html', 
                         usuario_nome=session.get('usuario_nome'),
                         usuario_perfil=session.get('usuario_perfil', 'comum'))

