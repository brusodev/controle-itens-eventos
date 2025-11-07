from flask import Blueprint, request, jsonify
from models import db, Detentora
from routes.auth_routes import login_requerido, admin_requerido
from utils.auditoria import registrar_auditoria

detentoras_bp = Blueprint('detentoras', __name__)

@detentoras_bp.route('/', methods=['GET'])
@login_requerido
def listar_detentoras():
    """Lista todas as detentoras ativas"""
    try:
        incluir_inativas = request.args.get('incluir_inativas', 'false').lower() == 'true'
        
        if incluir_inativas:
            detentoras = Detentora.query.order_by(Detentora.grupo, Detentora.nome).all()
        else:
            detentoras = Detentora.query.filter_by(ativo=True).order_by(Detentora.grupo, Detentora.nome).all()
        
        return jsonify([d.to_dict() for d in detentoras]), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@detentoras_bp.route('/grupos', methods=['GET'])
@login_requerido
def listar_grupos():
    """Lista todos os grupos únicos cadastrados"""
    try:
        grupos = db.session.query(Detentora.grupo).filter_by(ativo=True).distinct().order_by(Detentora.grupo).all()
        grupos_lista = [g[0] for g in grupos if g[0]]
        
        return jsonify(grupos_lista), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@detentoras_bp.route('/grupo/<grupo>', methods=['GET'])
@login_requerido
def obter_por_grupo(grupo):
    """Obtém dados da detentora por grupo"""
    try:
        print(f'🔍 [API] Buscando Detentora para grupo: {grupo} (tipo: {type(grupo)})')
        
        detentora = Detentora.query.filter_by(grupo=grupo, ativo=True).first()
        
        print(f'📊 [API] Detentoras encontradas: {Detentora.query.filter_by(ativo=True).count()}')
        print(f'📋 [API] Grupos disponíveis: {[d.grupo for d in Detentora.query.filter_by(ativo=True).all()]}')
        
        if not detentora:
            print(f'❌ [API] Detentora não encontrada para grupo {grupo}')
            return jsonify({'erro': 'Detentora não encontrada para este grupo'}), 404
        
        print(f'✅ [API] Detentora encontrada: {detentora.nome}')
        return jsonify(detentora.to_dict()), 200
    
    except Exception as e:
        print(f'❌ [API] ERRO: {str(e)}')
        return jsonify({'erro': str(e)}), 500


@detentoras_bp.route('/<int:detentora_id>', methods=['GET'])
@login_requerido
def obter_detentora(detentora_id):
    """Obtém dados de uma detentora específica"""
    try:
        detentora = Detentora.query.get_or_404(detentora_id)
        return jsonify(detentora.to_dict()), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@detentoras_bp.route('/', methods=['POST'])
@login_requerido
def criar_detentora():
    """Cria uma nova detentora (apenas admin)"""
    try:
        dados = request.json
        
        # Validações
        if not dados.get('nome'):
            return jsonify({'erro': 'Nome da detentora é obrigatório'}), 400
        
        if not dados.get('cnpj'):
            return jsonify({'erro': 'CNPJ é obrigatório'}), 400
        
        if not dados.get('grupo'):
            return jsonify({'erro': 'Grupo é obrigatório'}), 400
        
        if not dados.get('contratoNum'):
            return jsonify({'erro': 'Número do contrato é obrigatório'}), 400
        
        # Verificar se já existe detentora com mesmo grupo
        existe = Detentora.query.filter_by(grupo=dados['grupo'], ativo=True).first()
        if existe:
            return jsonify({'erro': f'Já existe uma detentora ativa para o grupo "{dados["grupo"]}"'}), 409
        
        # Criar nova detentora
        detentora = Detentora(
            contrato_num=dados['contratoNum'],
            data_assinatura=dados.get('dataAssinatura', ''),
            prazo_vigencia=dados.get('prazoVigencia', ''),
            nome=dados['nome'],
            cnpj=dados['cnpj'],
            servico=dados.get('servico', 'COFFEE BREAK'),
            grupo=dados['grupo'],
            ativo=dados.get('ativo', True)
        )
        
        db.session.add(detentora)
        db.session.commit()
        
        # Registrar auditoria
        registrar_auditoria(
            'CREATE',
            'DETENTORA',
            f'Criou detentora: {detentora.nome} - Grupo {detentora.grupo}',
            entidade_tipo='detentoras',
            entidade_id=detentora.id,
            dados_depois=detentora.to_dict()
        )
        
        return jsonify(detentora.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500


@detentoras_bp.route('/<int:detentora_id>', methods=['PUT'])
@login_requerido
def atualizar_detentora(detentora_id):
    """Atualiza uma detentora (apenas admin)"""
    try:
        detentora = Detentora.query.get_or_404(detentora_id)
        dados = request.json
        
        # Salvar dados anteriores para auditoria
        dados_antes = detentora.to_dict()
        
        # Verificar se está tentando mudar grupo para um já existente
        if 'grupo' in dados and dados['grupo'] != detentora.grupo:
            existe = Detentora.query.filter_by(grupo=dados['grupo'], ativo=True).filter(Detentora.id != detentora_id).first()
            if existe:
                return jsonify({'erro': f'Já existe uma detentora ativa para o grupo "{dados["grupo"]}"'}), 409
        
        # Atualizar campos
        if 'contratoNum' in dados:
            detentora.contrato_num = dados['contratoNum']
        if 'dataAssinatura' in dados:
            detentora.data_assinatura = dados['dataAssinatura']
        if 'prazoVigencia' in dados:
            detentora.prazo_vigencia = dados['prazoVigencia']
        if 'nome' in dados:
            detentora.nome = dados['nome']
        if 'cnpj' in dados:
            detentora.cnpj = dados['cnpj']
        if 'servico' in dados:
            detentora.servico = dados['servico']
        if 'grupo' in dados:
            detentora.grupo = dados['grupo']
        if 'ativo' in dados:
            detentora.ativo = dados['ativo']
        
        db.session.commit()
        
        # Registrar auditoria
        registrar_auditoria(
            'UPDATE',
            'DETENTORA',
            f'Atualizou detentora: {detentora.nome} - Grupo {detentora.grupo}',
            entidade_tipo='detentoras',
            entidade_id=detentora.id,
            dados_antes=dados_antes,
            dados_depois=detentora.to_dict()
        )
        
        return jsonify(detentora.to_dict()), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500


@detentoras_bp.route('/<int:detentora_id>', methods=['DELETE'])
@login_requerido
@admin_requerido
def deletar_detentora(detentora_id):
    """Inativa uma detentora (soft delete - apenas admin)"""
    try:
        detentora = Detentora.query.get_or_404(detentora_id)
        
        # Salvar dados para auditoria
        dados_antes = detentora.to_dict()
        nome_detentora = detentora.nome
        grupo_detentora = detentora.grupo
        
        # Soft delete - apenas marca como inativa
        detentora.ativo = False
        db.session.commit()
        
        # Registrar auditoria
        registrar_auditoria(
            'DELETE',
            'DETENTORA',
            f'Inativou detentora: {nome_detentora} - Grupo {grupo_detentora}',
            entidade_tipo='detentoras',
            entidade_id=detentora.id,
            dados_antes=dados_antes
        )
        
        return jsonify({
            'sucesso': True,
            'mensagem': 'Detentora inativada com sucesso'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500
