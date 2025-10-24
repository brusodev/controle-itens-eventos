from flask import Blueprint, request, jsonify
from models import db, Item, Categoria, EstoqueRegional
from routes.auth_routes import login_requerido, admin_requerido

itens_bp = Blueprint('itens', __name__)

@itens_bp.route('/', methods=['GET'])
def listar_itens():
    """Lista todos os itens com seus estoques"""
    try:
        categoria_id = request.args.get('categoria_id', type=int)
        tipo = request.args.get('tipo')
        
        query = Item.query
        
        if categoria_id:
            query = query.filter_by(categoria_id=categoria_id)
        elif tipo:
            query = query.join(Categoria).filter(Categoria.tipo == tipo)
        
        itens = query.all()
        return jsonify([item.to_dict() for item in itens]), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@itens_bp.route('/<int:item_id>', methods=['GET'])
def obter_item(item_id):
    """Obtém um item específico"""
    try:
        item = Item.query.get_or_404(item_id)
        return jsonify(item.to_dict()), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 404


@itens_bp.route('/', methods=['POST'])
@login_requerido
@admin_requerido
def criar_item():
    """Cria um novo item"""
    try:
        dados = request.json
        
        # Verificar categoria
        categoria = Categoria.query.get(dados['categoria_id'])
        if not categoria:
            return jsonify({'erro': 'Categoria não encontrada'}), 404
        
        # Criar item
        item = Item(
            categoria_id=dados['categoria_id'],
            item_codigo=dados['item'],
            descricao=dados['descricao'],
            unidade=dados['unidade']
        )
        db.session.add(item)
        db.session.flush()  # Para obter o ID
        
        # Criar estoques regionais
        if 'regioes' in dados:
            for regiao_num, qtds in dados['regioes'].items():
                estoque = EstoqueRegional(
                    item_id=item.id,
                    regiao_numero=int(regiao_num),
                    quantidade_inicial=qtds.get('inicial', '0'),
                    quantidade_gasto=qtds.get('gasto', '0')
                )
                db.session.add(estoque)
        
        db.session.commit()
        return jsonify(item.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500


@itens_bp.route('/<int:item_id>', methods=['PUT'])
@login_requerido
@admin_requerido
def atualizar_item(item_id):
    """Atualiza um item e seus estoques"""
    try:
        item = Item.query.get_or_404(item_id)
        dados = request.json
        
        # Atualizar dados básicos
        if 'descricao' in dados:
            item.descricao = dados['descricao']
        if 'unidade' in dados:
            item.unidade = dados['unidade']
        
        # Atualizar estoques regionais
        if 'regioes' in dados:
            for regiao_num, qtds in dados['regioes'].items():
                estoque = EstoqueRegional.query.filter_by(
                    item_id=item.id,
                    regiao_numero=int(regiao_num)
                ).first()
                
                if estoque:
                    if 'inicial' in qtds:
                        estoque.quantidade_inicial = qtds['inicial']
                    if 'gasto' in qtds:
                        estoque.quantidade_gasto = qtds['gasto']
                else:
                    # Criar se não existe
                    estoque = EstoqueRegional(
                        item_id=item.id,
                        regiao_numero=int(regiao_num),
                        quantidade_inicial=qtds.get('inicial', '0'),
                        quantidade_gasto=qtds.get('gasto', '0')
                    )
                    db.session.add(estoque)
        
        db.session.commit()
        return jsonify(item.to_dict()), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500


@itens_bp.route('/<int:item_id>', methods=['DELETE'])
@login_requerido
@admin_requerido
def deletar_item(item_id):
    """Deleta um item"""
    try:
        item = Item.query.get_or_404(item_id)
        db.session.delete(item)
        db.session.commit()
        return jsonify({'mensagem': 'Item deletado com sucesso'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500
