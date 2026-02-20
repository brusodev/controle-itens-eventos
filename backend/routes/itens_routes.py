from flask import Blueprint, request, jsonify
from models import db, Item, Categoria, EstoqueRegional
from routes.auth_routes import login_requerido, admin_requerido
from utils.auditoria import registrar_auditoria

itens_bp = Blueprint('itens', __name__)

@itens_bp.route('/', methods=['GET'])
def listar_itens():
    """Lista todos os itens com seus estoques"""
    try:
        categoria_id = request.args.get('categoria_id', type=int)
        tipo = request.args.get('tipo')
        modulo = request.args.get('modulo', 'coffee')
        
        query = Item.query.join(Categoria).filter(Categoria.modulo == modulo)
        
        if categoria_id:
            query = query.filter(Item.categoria_id == categoria_id)
        elif tipo:
            query = query.filter(Categoria.tipo == tipo)
        
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
            unidade=dados['unidade'],
            natureza=dados.get('natureza')  # Código BEC/CATSER individual
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
        
        # Registrar auditoria
        registrar_auditoria(
            'CREATE',
            'ITEM',
            f'Criou item: {item.descricao} (código: {item.item_codigo})',
            entidade_tipo='itens',
            entidade_id=item.id,
            dados_depois=item.to_dict()
        )
        
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
        
        # Salvar dados anteriores para auditoria (com estoques)
        dados_antes = item.to_dict(incluir_estoques=True)
        
        # Atualizar dados básicos
        if 'descricao' in dados:
            item.descricao = dados['descricao']
        if 'unidade' in dados:
            item.unidade = dados['unidade']
        if 'natureza' in dados:
            item.natureza = dados['natureza']  # Código BEC/CATSER
        
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
        
        # Registrar auditoria com estoques
        print(f"\n📋 Registrando auditoria para item {item.id} - {item.descricao}")
        print(f"   Dados ANTES: {dados_antes}")
        print(f"   Dados DEPOIS: {item.to_dict(incluir_estoques=True)}")
        
        registrar_auditoria(
            'UPDATE',
            'ITEM',
            f'Atualizou item: {item.descricao}',
            entidade_tipo='itens',
            entidade_id=item.id,
            dados_antes=dados_antes,
            dados_depois=item.to_dict(incluir_estoques=True)
        )
        
        print(f"   ✅ Auditoria registrada!")
        
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
        
        # Salvar dados antes de deletar
        dados_antes = item.to_dict()
        descricao = item.descricao
        
        db.session.delete(item)
        db.session.commit()
        
        # Registrar auditoria
        registrar_auditoria(
            'DELETE',
            'ITEM',
            f'Deletou item: {descricao}',
            entidade_tipo='itens',
            entidade_id=item_id,
            dados_antes=dados_antes
        )
        
        return jsonify({'mensagem': 'Item deletado com sucesso'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500
