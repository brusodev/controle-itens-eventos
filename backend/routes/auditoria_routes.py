from flask import Blueprint, request, jsonify, render_template
from models import db, Auditoria, Usuario
from routes.auth_routes import login_requerido, admin_requerido
from datetime import datetime, timedelta

auditoria_bp = Blueprint('auditoria', __name__)

@auditoria_bp.route('/', methods=['GET'])
@login_requerido
@admin_requerido
def listar_auditorias():
    """Lista registros de auditoria com filtros"""
    try:
        # Parâmetros de filtro
        usuario_id = request.args.get('usuario_id', type=int)
        modulo = request.args.get('modulo')
        acao = request.args.get('acao')
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        limite = request.args.get('limite', 100, type=int)
        pagina = request.args.get('pagina', 1, type=int)
        
        # Query base
        query = Auditoria.query
        
        # Aplicar filtros
        if usuario_id:
            query = query.filter_by(usuario_id=usuario_id)
        
        if modulo:
            query = query.filter_by(modulo=modulo)
        
        if acao:
            query = query.filter_by(acao=acao)
        
        if data_inicio:
            data_inicio_dt = datetime.fromisoformat(data_inicio)
            query = query.filter(Auditoria.data_hora >= data_inicio_dt)
        
        if data_fim:
            data_fim_dt = datetime.fromisoformat(data_fim)
            query = query.filter(Auditoria.data_hora <= data_fim_dt)
        
        # Ordenar por data decrescente
        query = query.order_by(Auditoria.data_hora.desc())
        
        # Paginação
        offset = (pagina - 1) * limite
        total = query.count()
        auditorias = query.limit(limite).offset(offset).all()
        
        return jsonify({
            'total': total,
            'pagina': pagina,
            'limite': limite,
            'auditorias': [a.to_dict() for a in auditorias]
        }), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@auditoria_bp.route('/view', methods=['GET'])
@login_requerido
@admin_requerido
def view_auditoria():
    """Página de visualização de auditoria"""
    return render_template('auditoria.html')


@auditoria_bp.route('/usuarios', methods=['GET'])
@login_requerido
@admin_requerido
def listar_usuarios_auditoria():
    """Lista usuários que têm registros de auditoria"""
    try:
        usuarios = db.session.query(
            Usuario.id, 
            Usuario.nome, 
            Usuario.email
        ).join(
            Auditoria
        ).distinct().order_by(Usuario.nome).all()
        
        return jsonify([{
            'id': u.id,
            'nome': u.nome,
            'email': u.email
        } for u in usuarios]), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@auditoria_bp.route('/estatisticas', methods=['GET'])
@login_requerido
@admin_requerido
def estatisticas_auditoria():
    """Estatísticas gerais de auditoria"""
    try:
        # Total de registros
        total = Auditoria.query.count()
        
        # Por módulo
        por_modulo = db.session.query(
            Auditoria.modulo,
            db.func.count(Auditoria.id)
        ).group_by(Auditoria.modulo).all()
        
        # Por ação
        por_acao = db.session.query(
            Auditoria.acao,
            db.func.count(Auditoria.id)
        ).group_by(Auditoria.acao).all()
        
        # Últimas 24 horas
        ontem = datetime.utcnow() - timedelta(hours=24)
        ultimas_24h = Auditoria.query.filter(Auditoria.data_hora >= ontem).count()
        
        # Usuários mais ativos
        usuarios_ativos = db.session.query(
            Auditoria.usuario_nome,
            Auditoria.usuario_email,
            db.func.count(Auditoria.id).label('total')
        ).group_by(
            Auditoria.usuario_nome,
            Auditoria.usuario_email
        ).order_by(
            db.func.count(Auditoria.id).desc()
        ).limit(10).all()
        
        return jsonify({
            'total': total,
            'ultimas_24h': ultimas_24h,
            'por_modulo': {m: c for m, c in por_modulo},
            'por_acao': {a: c for a, c in por_acao},
            'usuarios_ativos': [{
                'nome': u[0],
                'email': u[1],
                'total': u[2]
            } for u in usuarios_ativos]
        }), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


def registrar_auditoria(usuario_id, usuario_email, usuario_nome, acao, modulo, descricao, 
                       entidade_tipo=None, entidade_id=None, dados_antes=None, dados_depois=None,
                       ip_address=None, user_agent=None):
    """Função auxiliar para registrar auditoria"""
    try:
        auditoria = Auditoria(
            usuario_id=usuario_id,
            usuario_email=usuario_email,
            usuario_nome=usuario_nome,
            acao=acao,
            modulo=modulo,
            entidade_tipo=entidade_tipo,
            entidade_id=entidade_id,
            descricao=descricao,
            dados_antes=dados_antes,
            dados_depois=dados_depois,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.session.add(auditoria)
        db.session.commit()
        return True
    except Exception as e:
        print(f"Erro ao registrar auditoria: {str(e)}")
        db.session.rollback()
        return False
