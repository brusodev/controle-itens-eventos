"""
Rotas de autenticação e gerenciamento de usuários
"""
from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from models import db, Usuario
from extensions import limiter
from datetime import datetime
from functools import wraps
import secrets

auth_bp = Blueprint('auth', __name__)


def login_requerido(f):
    """Decorator para verificar se o usuário está logado"""
    @wraps(f)
    def verificar_login(*args, **kwargs):
        if 'usuario_id' not in session:
            # Sempre retornar JSON para APIs
            return jsonify({'erro': 'Não autenticado'}), 401
        return f(*args, **kwargs)
    return verificar_login


def admin_requerido(f):
    """Decorator para verificar se o usuário é administrador"""
    @wraps(f)
    def verificar_admin(*args, **kwargs):
        if 'usuario_id' not in session:
            return jsonify({'erro': 'Não autenticado'}), 401

        if session.get('usuario_perfil') != 'admin':
            return jsonify({'erro': 'Acesso negado. Apenas administradores podem realizar esta ação.'}), 403

        return f(*args, **kwargs)
    return verificar_admin


def empresa_requerido(f):
    """Decorator para rotas acessíveis apenas por usuários com perfil 'empresa'"""
    @wraps(f)
    def verificar_empresa(*args, **kwargs):
        if 'usuario_id' not in session:
            return jsonify({'erro': 'Não autenticado'}), 401

        if session.get('usuario_perfil') != 'empresa':
            return jsonify({'erro': 'Acesso negado. Apenas contas de empresa podem realizar esta ação.'}), 403

        return f(*args, **kwargs)
    return verificar_empresa


def admin_ou_empresa_requerido(f):
    """Decorator para rotas acessíveis por admin ou empresa"""
    @wraps(f)
    def verificar(*args, **kwargs):
        if 'usuario_id' not in session:
            return jsonify({'erro': 'Não autenticado'}), 401

        if session.get('usuario_perfil') not in ('admin', 'empresa'):
            return jsonify({'erro': 'Acesso negado.'}), 403

        return f(*args, **kwargs)
    return verificar


def csrf_protegido(f):
    """
    Decorator CSRF para rotas de mutação (POST/PUT/DELETE).
    Valida o header X-CSRF-Token contra o token armazenado na sessão.
    Rotas GET/HEAD/OPTIONS são dispensadas automaticamente.

    O frontend deve:
      1. Buscar o token em GET /auth/csrf-token após o login.
      2. Incluir o header X-CSRF-Token em todas as requisições mutantes.
    """
    @wraps(f)
    def verificar_csrf(*args, **kwargs):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return f(*args, **kwargs)

        token_sessao = session.get('csrf_token')
        token_header = request.headers.get('X-CSRF-Token', '')

        if not token_sessao or not secrets.compare_digest(token_sessao, token_header):
            return jsonify({'erro': 'Token CSRF inválido ou ausente'}), 403

        return f(*args, **kwargs)
    return verificar_csrf


# ========================================
# ROTAS DE AUTENTICAÇÃO
# ========================================

@auth_bp.route('/login', methods=['GET', 'POST'])
@limiter.limit('10 per minute', methods=['POST'])
def login():
    """Página de login"""
    if request.method == 'GET':
        # Se já está logado, redireciona para home
        if 'usuario_id' in session:
            return redirect('/')
        return render_template('login.html')
    
    # POST - Processa login
    dados = request.get_json()
    email = dados.get('email', '').strip()
    senha = dados.get('senha', '')
    
    if not email or not senha:
        return jsonify({'erro': 'Email e senha são obrigatórios'}), 400
    
    usuario = Usuario.query.filter_by(email=email).first()
    
    if not usuario or not usuario.verificar_senha(senha):
        return jsonify({'erro': 'Email ou senha incorretos'}), 401
    
    if not usuario.ativo:
        return jsonify({'erro': 'Usuário inativo'}), 403
    
    # Registrar último acesso
    usuario.ultimo_acesso = datetime.utcnow()
    db.session.commit()
    
    # Criar sessão
    session['usuario_id'] = usuario.id
    session['usuario_nome'] = usuario.nome
    session['usuario_email'] = usuario.email
    session['usuario_cargo'] = usuario.cargo
    session['usuario_perfil'] = usuario.perfil  # 'admin', 'comum' ou 'empresa'
    session['detentora_id'] = usuario.detentora_id  # None para admin/comum
    session['csrf_token'] = secrets.token_hex(32)  # Token CSRF por sessão
    session.permanent = True  # Respeitar PERMANENT_SESSION_LIFETIME
    
    return jsonify({
        'sucesso': True,
        'usuario': usuario.to_dict()
    })


@auth_bp.route('/logout')
def logout():
    """Fazer logout"""
    session.clear()
    return redirect(url_for('auth.login'))


@auth_bp.route('/csrf-token', methods=['GET'])
@login_requerido
def obter_csrf_token():
    """
    Retorna o token CSRF da sessão atual.
    O frontend deve chamar este endpoint após o login e incluir o token
    no header X-CSRF-Token em todas as requisições POST/PUT/DELETE.
    """
    token = session.get('csrf_token')
    if not token:
        token = secrets.token_hex(32)
        session['csrf_token'] = token
    return jsonify({'csrf_token': token})


@auth_bp.route('/registro', methods=['GET', 'POST'])
@login_requerido
def registro():
    """Página de registro de novo usuário (apenas admin pode criar)"""
    if request.method == 'GET':
        return render_template('registro.html')
    
    dados = request.get_json()

    # Validações
    email = dados.get('email', '').strip().lower()
    nome = dados.get('nome', '').strip()
    senha = dados.get('senha', '')
    cargo = dados.get('cargo', '').strip()
    perfil = dados.get('perfil', 'comum')  # 'admin', 'comum' ou 'empresa'
    detentora_id = dados.get('detentora_id') or None

    if not all([email, nome, senha]):
        return jsonify({'erro': 'Email, nome e senha são obrigatórios'}), 400

    if len(senha) < 12:
        return jsonify({'erro': 'Senha deve ter no mínimo 12 caracteres'}), 400

    if perfil not in ['admin', 'comum', 'empresa']:
        return jsonify({'erro': 'Perfil inválido. Use "admin", "comum" ou "empresa"'}), 400

    # Apenas admin pode criar qualquer tipo de usuário
    if session.get('usuario_perfil') != 'admin':
        return jsonify({'erro': 'Apenas administradores podem criar usuários'}), 403

    # Perfil empresa exige vínculo com detentora existente
    if perfil == 'empresa':
        if not detentora_id:
            return jsonify({'erro': 'Perfil "empresa" exige um detentora_id válido'}), 400
        from models import Detentora
        if not Detentora.query.get(int(detentora_id)):
            return jsonify({'erro': 'Detentora não encontrada'}), 404

    if Usuario.query.filter_by(email=email).first():
        return jsonify({'erro': 'Email já cadastrado'}), 409

    # Criar novo usuário
    novo_usuario = Usuario(
        nome=nome,
        email=email,
        cargo=cargo or None,
        perfil=perfil,
        detentora_id=int(detentora_id) if detentora_id else None
    )
    novo_usuario.set_senha(senha)
    
    db.session.add(novo_usuario)
    db.session.commit()
    
    return jsonify({
        'sucesso': True,
        'mensagem': 'Usuário criado com sucesso',
        'usuario': novo_usuario.to_dict()
    }), 201


# ========================================
# ROTAS DE GERENCIAMENTO DE USUÁRIOS
# ========================================

@auth_bp.route('/api/usuarios', methods=['GET'])
@login_requerido
@admin_requerido
def listar_usuarios():
    """Lista todos os usuários (apenas admin)"""
    usuarios = Usuario.query.all()
    return jsonify([u.to_dict() for u in usuarios])


@auth_bp.route('/api/usuarios/<int:usuario_id>', methods=['GET'])
@login_requerido
def obter_usuario(usuario_id):
    """Obtém dados de um usuário específico"""
    if session['usuario_id'] != usuario_id and session.get('usuario_perfil') != 'admin':
        return jsonify({'erro': 'Acesso negado'}), 403

    usuario = Usuario.query.get(usuario_id)

    if not usuario:
        return jsonify({'erro': 'Usuário não encontrado'}), 404

    return jsonify(usuario.to_dict())


@auth_bp.route('/api/usuarios/<int:usuario_id>', methods=['PUT'])
@login_requerido
def atualizar_usuario(usuario_id):
    """Atualiza dados de um usuário"""
    try:
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return jsonify({'erro': 'Usuário não encontrado'}), 404
        
        dados = request.get_json()
        
        if not dados:
            return jsonify({'erro': 'Nenhum dado fornecido'}), 400
        
        # Validar permissões
        if session['usuario_id'] != usuario_id and session.get('usuario_perfil') != 'admin':
            return jsonify({'erro': 'Você só pode editar seu próprio perfil'}), 403
        
        if 'nome' in dados:
            usuario.nome = dados['nome'].strip()
        
        if 'cargo' in dados:
            usuario.cargo = dados['cargo'].strip() or None
        
        if 'ativo' in dados:
            # Apenas admin pode alterar status
            if session.get('usuario_perfil') == 'admin':
                usuario.ativo = dados['ativo']
            else:
                return jsonify({'erro': 'Apenas administradores podem alterar o status'}), 403
        
        perfil_alterado = False
        detentora_alterada = False

        if 'perfil' in dados:
            # Apenas admin pode alterar perfil
            if session.get('usuario_perfil') != 'admin':
                return jsonify({'erro': 'Apenas administradores podem alterar perfis'}), 403

            if dados['perfil'] not in ['admin', 'comum', 'empresa']:
                return jsonify({'erro': 'Perfil inválido. Use "admin", "comum" ou "empresa"'}), 400

            if dados['perfil'] == 'empresa' and not dados.get('detentora_id') and not usuario.detentora_id:
                return jsonify({'erro': 'Perfil "empresa" exige um detentora_id válido'}), 400

            if usuario.perfil != dados['perfil']:
                usuario.perfil = dados['perfil']
                perfil_alterado = True

        if 'detentora_id' in dados:
            if session.get('usuario_perfil') != 'admin':
                return jsonify({'erro': 'Apenas administradores podem alterar o vínculo com detentora'}), 403
            novo_det_id = int(dados['detentora_id']) if dados['detentora_id'] else None
            if novo_det_id != usuario.detentora_id:
                # Validar que a detentora existe
                if novo_det_id is not None:
                    from models import Detentora
                    if not Detentora.query.get(novo_det_id):
                        return jsonify({'erro': 'Detentora não encontrada'}), 404
                usuario.detentora_id = novo_det_id
                detentora_alterada = True

        if 'senha' in dados and dados['senha']:
            usuario.set_senha(dados['senha'])

        db.session.commit()

        # Se o admin alterou o próprio usuário logado, atualizar sessão
        if session['usuario_id'] == usuario_id:
            session['usuario_nome'] = usuario.nome
            session['usuario_email'] = usuario.email
            session['usuario_perfil'] = usuario.perfil
            session['detentora_id'] = usuario.detentora_id
            # Regenerar CSRF token se perfil ou detentora mudou — invalida tokens antigos
            if perfil_alterado or detentora_alterada:
                session['csrf_token'] = secrets.token_hex(32)

        return jsonify({
            'sucesso': True,
            'usuario': usuario.to_dict(),
            'sessao_atualizada': session['usuario_id'] == usuario_id
        })

    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao atualizar usuário'}), 500


@auth_bp.route('/api/usuarios/<int:usuario_id>', methods=['DELETE'])
@login_requerido
@admin_requerido
def deletar_usuario(usuario_id):
    """Deleta um usuário (apenas admin)"""
    usuario = Usuario.query.get(usuario_id)
    
    if not usuario:
        return jsonify({'erro': 'Usuário não encontrado'}), 404
    
    # Não permitir deletar a si mesmo
    if session['usuario_id'] == usuario_id:
        return jsonify({'erro': 'Você não pode deletar sua própria conta'}), 400
    
    db.session.delete(usuario)
    db.session.commit()
    
    return jsonify({
        'sucesso': True,
        'mensagem': 'Usuário deletado com sucesso'
    })


@auth_bp.route('/api/me')
@login_requerido
def obter_usuario_atual():
    """Obtém dados do usuário logado"""
    usuario = Usuario.query.get(session['usuario_id'])
    if not usuario:
        session.clear()
        return jsonify({'erro': 'Usuário não encontrado'}), 404
    
    return jsonify(usuario.to_dict())


@auth_bp.route('/api/alterar-senha', methods=['POST'])
@login_requerido
@limiter.limit('5 per minute')
def alterar_senha_api():
    """Altera a senha do usuário logado"""
    try:
        usuario = Usuario.query.get(session['usuario_id'])
        
        if not usuario:
            return jsonify({'erro': 'Usuário não encontrado'}), 404
        
        dados = request.get_json()
        
        senha_atual = dados.get('senha_atual', dados.get('senhaAtual', ''))
        senha_nova = dados.get('senha_nova', dados.get('senhaNova', ''))
        
        if not senha_atual or not senha_nova:
            return jsonify({'erro': 'Senha atual e nova senha são obrigatórias'}), 400
        
        if not usuario.verificar_senha(senha_atual):
            return jsonify({'erro': 'Senha atual incorreta'}), 401
        
        if len(senha_nova) < 12:
            return jsonify({'erro': 'Senha deve ter no mínimo 12 caracteres'}), 400
        
        usuario.set_senha(senha_nova)
        db.session.commit()
        
        return jsonify({
            'sucesso': True,
            'mensagem': 'Senha alterada com sucesso'
        })
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao alterar senha'}), 500


# ========================================
# ROTAS DE ATUALIZAÇÃO DE PERFIL
# ========================================

@auth_bp.route('/atualizar-perfil', methods=['POST'])
@login_requerido
def atualizar_perfil():
    """Atualiza perfil do usuário logado"""
    usuario = Usuario.query.get(session['usuario_id'])
    dados = request.get_json()
    
    nome = dados.get('nome', '').strip()
    email = dados.get('email', '').strip().lower()
    cargo = dados.get('cargo', '').strip()
    
    if not nome or not email:
        return jsonify({'erro': 'Nome e email são obrigatórios'}), 400
    
    # Verificar se email já existe (outro usuário)
    outro_usuario = Usuario.query.filter_by(email=email).first()
    if outro_usuario and outro_usuario.id != usuario.id:
        return jsonify({'erro': 'Email já cadastrado por outro usuário'}), 409
    
    usuario.nome = nome
    usuario.email = email
    usuario.cargo = cargo or None
    usuario.atualizado_em = datetime.utcnow()
    
    db.session.commit()
    
    # Atualizar sessão
    session['usuario_nome'] = usuario.nome
    session['usuario_email'] = usuario.email
    session['usuario_cargo'] = usuario.cargo
    
    return jsonify({
        'sucesso': True,
        'mensagem': 'Perfil atualizado com sucesso',
        'usuario': usuario.to_dict()
    })
