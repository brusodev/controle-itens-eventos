from flask import Blueprint, request, jsonify
from models import db, Categoria, Item
from routes.auth_routes import login_requerido, admin_requerido
from utils.auditoria import registrar_auditoria

categorias_bp = Blueprint('categorias', __name__)

@categorias_bp.route('/', methods=['GET'])
def listar_categorias():
    """Lista todas as categorias"""
    try:
        categorias = Categoria.query.all()
        return jsonify([cat.to_dict() for cat in categorias]), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@categorias_bp.route('/<int:cat_id>', methods=['GET'])
def obter_categoria(cat_id):
    """Obtém uma categoria específica"""
    try:
        categoria = Categoria.query.get_or_404(cat_id)
        return jsonify(categoria.to_dict()), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 404


@categorias_bp.route('/', methods=['POST'])
@login_requerido
@admin_requerido
def criar_categoria():
    """Cria uma nova categoria"""
    try:
        dados = request.json
        
        if not dados.get('nome') or not dados.get('tipo'):
            return jsonify({'erro': 'Nome e tipo são obrigatórios'}), 400
        
        # Verificar se já existe
        existe = Categoria.query.filter_by(nome=dados['nome']).first()
        if existe:
            return jsonify({'erro': 'Categoria já existe'}), 409
        
        categoria = Categoria(
            nome=dados['nome'],
            tipo=dados['tipo'],
            natureza=dados.get('natureza')
        )
        
        db.session.add(categoria)
        db.session.commit()
        
        # Registrar auditoria
        registrar_auditoria(
            'CREATE',
            'CATEGORIA',
            f'Criou categoria: {categoria.nome}',
            entidade_tipo='categorias',
            entidade_id=categoria.id,
            dados_depois=categoria.to_dict()
        )
        
        return jsonify(categoria.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500


@categorias_bp.route('/<int:cat_id>', methods=['PUT'])
@login_requerido
@admin_requerido
def atualizar_categoria(cat_id):
    """Atualiza uma categoria"""
    try:
        categoria = Categoria.query.get_or_404(cat_id)
        dados = request.json
        
        dados_antes = categoria.to_dict()
        
        categoria.nome = dados.get('nome', categoria.nome)
        categoria.tipo = dados.get('tipo', categoria.tipo)
        categoria.natureza = dados.get('natureza', categoria.natureza)
        
        db.session.commit()
        
        # Registrar auditoria
        registrar_auditoria(
            'UPDATE',
            'CATEGORIA',
            f'Atualizou categoria: {categoria.nome}',
            entidade_tipo='categorias',
            entidade_id=categoria.id,
            dados_antes=dados_antes,
            dados_depois=categoria.to_dict()
        )
        
        return jsonify(categoria.to_dict()), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500


@categorias_bp.route('/<int:cat_id>', methods=['DELETE'])
@login_requerido
@admin_requerido
def deletar_categoria(cat_id):
    """Deleta uma categoria"""
    try:
        categoria = Categoria.query.get_or_404(cat_id)
        
        # Verificar se há itens associados
        itens = Item.query.filter_by(categoria_id=cat_id).count()
        if itens > 0:
            return jsonify({'erro': f'Não é possível deletar. Existem {itens} itens associados à esta categoria'}), 400
        
        dados_antes = categoria.to_dict()
        
        db.session.delete(categoria)
        db.session.commit()
        
        # Registrar auditoria
        registrar_auditoria(
            'DELETE',
            'CATEGORIA',
            f'Deletou categoria: {categoria.nome}',
            entidade_tipo='categorias',
            entidade_id=cat_id,
            dados_antes=dados_antes
        )
        
        return jsonify({'mensagem': 'Categoria deletada com sucesso'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500
