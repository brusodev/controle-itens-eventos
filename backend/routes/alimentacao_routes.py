from flask import Blueprint, request, jsonify
from models import db, Categoria, Item, EstoqueRegional
from routes.auth_routes import login_requerido, admin_requerido
from utils.auditoria import registrar_auditoria

alimentacao_bp = Blueprint('alimentacao', __name__)

@alimentacao_bp.route('/', methods=['GET'])
def listar_alimentacao():
    """Lista todos os itens organizados por categoria, filtrando por módulo"""
    try:
        modulo = request.args.get('modulo', 'coffee')
        # Removido filtro fixo por tipo='alimentacao' para suportar as novas modalidades de transporte
        categorias = Categoria.query.filter_by(modulo=modulo).all()
        
        resultado = {}
        for cat in categorias:
            resultado[cat.nome] = {
                'natureza': cat.natureza,
                'categoria_db_id': cat.id,  # Adicionar ID da categoria para facilitar criação de itens
                'itens': [item.to_dict() for item in cat.itens]
            }
        
        return jsonify(resultado), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@alimentacao_bp.route('/categorias', methods=['GET'])
def listar_categorias():
    """Lista todas as categorias do módulo atual"""
    try:
        modulo = request.args.get('modulo', 'coffee')
        categorias = Categoria.query.filter_by(modulo=modulo).all()
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
        modulo = dados.get('modulo', 'coffee')
        
        # Verificar se já existe no mesmo módulo
        if Categoria.query.filter_by(nome=dados['nome'], modulo=modulo).first():
            return jsonify({'erro': 'Categoria já existe neste módulo'}), 400
        
        categoria = Categoria(
            nome=dados['nome'],
            tipo='alimentacao',
            natureza=dados.get('natureza', ''),
            modulo=modulo
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
        modulo = request.args.get('modulo', 'coffee')
        
        query = Item.query.join(Categoria).filter(Categoria.tipo == 'alimentacao', Categoria.modulo == modulo)
        
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
        
        # Salvar dados antes para auditoria
        dados_antes = item.to_dict(incluir_estoques=True)
        
        # Atualizar código BEC/CATSER se fornecido
        if 'natureza' in dados:
            item.natureza = dados['natureza']
        
        # Atualizar regiões (pode estar em 'regioes' ou direto no objeto para retrocompatibilidade)
        regioes_dados = dados.get('regioes', dados)
        
        for regiao_num, qtds in regioes_dados.items():
            # Pular campos que não são regiões (como 'natureza')
            if not regiao_num.isdigit():
                continue
                
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
        
        # Registrar auditoria
        registrar_auditoria(
            'UPDATE',
            'ITEM',
            f'Atualizou estoques do item: {item.descricao}',
            entidade_tipo='itens',
            entidade_id=item.id,
            dados_antes=dados_antes,
            dados_depois=item.to_dict(incluir_estoques=True)
        )
        
        return jsonify(item.to_dict()), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500


@alimentacao_bp.route('/resumo', methods=['GET'])
def resumo_estoque():
    """Retorna resumo de estoque por região"""
    try:
        regiao = request.args.get('regiao', type=int)
        modulo = request.args.get('modulo', 'coffee')
        
        estoques = EstoqueRegional.query.join(Item).join(Categoria).filter(Categoria.modulo == modulo)
        
        if regiao:
            estoques = estoques.filter(EstoqueRegional.regiao_numero == regiao)
        
        estoques = estoques.all()
        
        resumo = {
            'total_inicial': 0,
            'total_gasto': 0,
            'total_disponivel': 0,
            'por_regiao': {}
        }
        
        for est in estoques:
            try:
                # ✅ Tratamento seguro de valores
                inicial_str = str(est.quantidade_inicial or '0').strip()
                gasto_str = str(est.quantidade_gasto or '0').strip()
                
                # Evitar valores inválidos como '__'
                if not inicial_str or inicial_str == '__' or not inicial_str.replace(',', '').replace('.', '').replace('-', ''):
                    inicial = 0
                else:
                    inicial = float(inicial_str.replace('.', '').replace(',', '.'))
                
                if not gasto_str or gasto_str == '__' or not gasto_str.replace(',', '').replace('.', '').replace('-', ''):
                    gasto = 0
                else:
                    gasto = float(gasto_str.replace('.', '').replace(',', '.'))
                
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
