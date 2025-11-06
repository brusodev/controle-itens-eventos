from flask import Blueprint, request, jsonify
from models import db, Categoria, Item, EstoqueRegional
from routes.auth_routes import login_requerido, admin_requerido

alimentacao_bp = Blueprint('alimentacao', __name__)

@alimentacao_bp.route('/', methods=['GET'])
def listar_alimentacao():
    """Lista todos os itens de alimentação organizados por categoria"""
    try:
        categorias = Categoria.query.filter_by(tipo='alimentacao').all()
        
        resultado = {}
        for cat in categorias:
            resultado[cat.nome] = {
                'natureza': cat.natureza,
                'itens': [item.to_dict() for item in cat.itens]
            }
        
        return jsonify(resultado), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@alimentacao_bp.route('/categorias', methods=['GET'])
def listar_categorias():
    """Lista todas as categorias de alimentação"""
    try:
        categorias = Categoria.query.filter_by(tipo='alimentacao').all()
        return jsonify([cat.to_dict() for cat in categorias]), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@alimentacao_bp.route('/categorias', methods=['POST'])
@login_requerido
@admin_requerido
def criar_categoria():
    """Cria uma nova categoria de alimentação"""
    try:
        dados = request.json
        
        # Verificar se já existe
        if Categoria.query.filter_by(nome=dados['nome']).first():
            return jsonify({'erro': 'Categoria já existe'}), 400
        
        categoria = Categoria(
            nome=dados['nome'],
            tipo='alimentacao',
            natureza=dados.get('natureza', '')
        )
        db.session.add(categoria)
        db.session.commit()
        
        return jsonify(categoria.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500


@alimentacao_bp.route('/filtrar', methods=['GET'])
def filtrar_alimentacao():
    """Filtra itens de alimentação por categoria e busca"""
    try:
        categoria = request.args.get('categoria', '')
        busca = request.args.get('busca', '')
        
        query = Item.query.join(Categoria).filter(Categoria.tipo == 'alimentacao')
        
        if categoria:
            query = query.filter(Categoria.nome == categoria)
        
        if busca:
            query = query.filter(Item.descricao.ilike(f'%{busca}%'))
        
        itens = query.all()
        return jsonify([item.to_dict() for item in itens]), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@alimentacao_bp.route('/item/<int:item_id>/estoque', methods=['PUT'])
@login_requerido
@admin_requerido
def atualizar_estoque(item_id):
    """Atualiza quantidades de estoque e preços de um item específico"""
    try:
        item = Item.query.get_or_404(item_id)
        dados = request.json
        
        for regiao_num, qtds in dados.items():
            estoque = EstoqueRegional.query.filter_by(
                item_id=item.id,
                regiao_numero=int(regiao_num)
            ).first()
            
            if estoque:
                if 'inicial' in qtds:
                    estoque.quantidade_inicial = qtds['inicial']
                if 'gasto' in qtds:
                    estoque.quantidade_gasto = qtds['gasto']
                if 'preco' in qtds:
                    estoque.preco = qtds['preco']
        
        db.session.commit()
        return jsonify(item.to_dict()), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500


@alimentacao_bp.route('/resumo', methods=['GET'])
def resumo_estoque():
    """Retorna resumo de estoque por região"""
    try:
        regiao = request.args.get('regiao', type=int)
        
        estoques = EstoqueRegional.query
        
        if regiao:
            estoques = estoques.filter_by(regiao_numero=regiao)
        
        estoques = estoques.all()
        
        resumo = {
            'total_inicial': 0,
            'total_gasto': 0,
            'total_disponivel': 0,
            'por_regiao': {}
        }
        
        for est in estoques:
            try:
                inicial = float(est.quantidade_inicial.replace('.', '').replace(',', '.'))
                gasto = float(est.quantidade_gasto.replace('.', '').replace(',', '.'))
                disponivel = inicial - gasto
                
                resumo['total_inicial'] += inicial
                resumo['total_gasto'] += gasto
                resumo['total_disponivel'] += disponivel
                
                regiao_key = str(est.regiao_numero)
                if regiao_key not in resumo['por_regiao']:
                    resumo['por_regiao'][regiao_key] = {
                        'inicial': 0,
                        'gasto': 0,
                        'disponivel': 0
                    }
                
                resumo['por_regiao'][regiao_key]['inicial'] += inicial
                resumo['por_regiao'][regiao_key]['gasto'] += gasto
                resumo['por_regiao'][regiao_key]['disponivel'] += disponivel
            except:
                continue
        
        return jsonify(resumo), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500
