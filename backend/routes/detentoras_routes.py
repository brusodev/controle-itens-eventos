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
        modulo = request.args.get('modulo', 'coffee')
        
        query = Detentora.query.filter_by(modulo=modulo)
        
        if not incluir_inativas:
            query = query.filter_by(ativo=True)
            
        detentoras = query.order_by(Detentora.grupo, Detentora.nome).all()
        
        # ✅ Serializar com tratamento de erro
        resultado = []
        for d in detentoras:
            try:
                resultado.append(d.to_dict())
            except Exception as e:
                # Se falhar em uma, adicionar dados básicos
                print(f'⚠️ Erro ao serializar detentora {d.id}: {str(e)}')
                resultado.append({
                    'id': d.id,
                    'nome': str(d.nome) if d.nome else 'Sem nome',
                    'grupo': str(d.grupo) if d.grupo else 'Sem grupo'
                })
        
        return jsonify(resultado), 200
    
    except Exception as e:
        print(f'❌ ERRO em listar_detentoras: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'erro': str(e)}), 500


@detentoras_bp.route('/grupos', methods=['GET'])
@login_requerido
def listar_grupos():
    """Lista todos os grupos únicos cadastrados"""
    try:
        modulo = request.args.get('modulo', 'coffee')
        grupos = db.session.query(Detentora.grupo).filter_by(ativo=True, modulo=modulo).distinct().order_by(Detentora.grupo).all()
        grupos_lista = [g[0] for g in grupos if g[0]]
        
        return jsonify(grupos_lista), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@detentoras_bp.route('/grupo/<grupo>', methods=['GET'])
@login_requerido
def obter_por_grupo(grupo):
    """Obtém dados da detentora por grupo"""
    try:
        modulo = request.args.get('modulo', 'coffee')
        print(f'🔍 [API] Buscando Detentora para grupo: {grupo} (modulo: {modulo})')
        
        # Converter para string se necessário
        grupo_str = str(grupo).strip()
        
        # ✅ Buscar detentora ativa
        detentora = Detentora.query.filter_by(grupo=grupo_str, modulo=modulo, ativo=True).first()
        
        if not detentora:
            print(f'❌ [API] Detentora não encontrada para grupo "{grupo_str}"')
            # Debug: listar grupos disponíveis
            grupos_disponiveis = [d.grupo for d in Detentora.query.filter_by(ativo=True).all()]
            print(f'📋 [API] Grupos disponíveis: {grupos_disponiveis}')
            return jsonify({'erro': f'Detentora não encontrada para o grupo "{grupo_str}"'}), 404
        
        print(f'✅ [API] Detentora encontrada: {detentora.nome}')
        
        # ✅ Serializar com tratamento de erro
        try:
            resultado = detentora.to_dict()
            print(f'✅ [API] Dados serializados com sucesso')
            return jsonify(resultado), 200
        except Exception as serialize_error:
            print(f'❌ [API] Erro ao serializar: {str(serialize_error)}')
            # Retornar dados básicos em caso de erro de serialização
            return jsonify({
                'id': detentora.id,
                'nome': str(detentora.nome) if detentora.nome else 'Sem nome',
                'grupo': str(detentora.grupo) if detentora.grupo else 'Sem grupo',
                'cnpj': str(detentora.cnpj) if detentora.cnpj else '',
                'erro_serializacao': 'Alguns campos não puderam ser processados'
            }), 200
    
    except Exception as e:
        print(f'❌ [API] ERRO NÃO TRATADO: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'erro': f'Erro ao buscar detentora: {str(e)}'}), 500


@detentoras_bp.route('/grupo/<grupo>/lista', methods=['GET'])
@login_requerido
def listar_por_grupo(grupo):
    """Lista todas as detentoras ativas de um grupo (para módulos com múltiplas detentoras por grupo)"""
    try:
        modulo = request.args.get('modulo', 'coffee')
        grupo_str = str(grupo).strip()

        detentoras = Detentora.query.filter_by(
            grupo=grupo_str, modulo=modulo, ativo=True
        ).order_by(Detentora.nome).all()

        resultado = []
        for d in detentoras:
            try:
                resultado.append(d.to_dict())
            except Exception:
                resultado.append({
                    'id': d.id,
                    'nome': str(d.nome) if d.nome else 'Sem nome',
                    'grupo': str(d.grupo) if d.grupo else ''
                })

        return jsonify(resultado), 200

    except Exception as e:
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
        
        modulo = dados.get('modulo', 'coffee')
        
        # Verificar se já existe detentora com mesmo grupo no mesmo modulo
        # Para organizacao, permite múltiplas detentoras por grupo
        if modulo != 'organizacao':
            existe = Detentora.query.filter_by(grupo=dados['grupo'], modulo=modulo, ativo=True).first()
            if existe:
                return jsonify({'erro': f'Já existe uma detentora ativa para o grupo "{dados["grupo"]}" neste módulo'}), 409
        
        # Criar nova detentora
        detentora = Detentora(
            contrato_num=dados['contratoNum'],
            data_assinatura=dados.get('dataAssinatura', ''),
            prazo_vigencia=dados.get('prazoVigencia', ''),
            nome=dados['nome'],
            cnpj=dados['cnpj'],
            servico=dados.get('servico', 'COFFEE BREAK'),
            modulo=modulo,
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
        
        # Verificar se está tentando mudar grupo para um já existente no mesmo modulo
        # Para organizacao, permite múltiplas detentoras por grupo
        modulo_atual = dados.get('modulo', detentora.modulo)
        if modulo_atual != 'organizacao' and 'grupo' in dados and dados['grupo'] != detentora.grupo:
            existe = Detentora.query.filter_by(grupo=dados['grupo'], modulo=modulo_atual, ativo=True).filter(Detentora.id != detentora_id).first()
            if existe:
                return jsonify({'erro': f'Já existe uma detentora ativa para o grupo "{dados["grupo"]}" neste módulo'}), 409
        
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
        if 'modulo' in dados:
            detentora.modulo = dados['modulo']
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
