"""
Rotas de Pedidos/Orçamentos de Serviços Gráficos — etapa anterior à emissão de O.S.

Reservado ao módulo 'servicos_graficos': todas as rotas exigem login e permissão
para esse módulo especificamente (ver auth_routes.modulo_permitido_requerido).
"""
from flask import Blueprint, request, jsonify, session
from models import (
    db, PedidoGrafico, ItemPedidoGrafico, Item, EstoqueRegional, OrdemServico,
    get_datetime_br, formatar_br
)
from datetime import datetime, timedelta
from routes.auth_routes import login_requerido, csrf_protegido, modulo_permitido_requerido
from utils.auditoria import registrar_auditoria
import logging

logger = logging.getLogger(__name__)

pedidos_graficos_bp = Blueprint('pedidos_graficos', __name__)

MODULO_PEDIDOS = 'servicos_graficos'
_MOD = lambda *a, **k: MODULO_PEDIDOS

# Janela de "vencendo em breve" usada no resumo de alertas
_DIAS_VENCENDO_EM_BREVE = 3

# Limites de texto livre (mesmo padrão de detentora_portal_routes.py).
# Necessários porque o SQLite não aplica o tamanho declarado em VARCHAR(n).
_MAX_SOLICITANTE = 200
_MAX_SETOR = 200
_MAX_DESCRICAO = 1000
_MAX_OBSERVACOES = 2000
_MAX_MOTIVO = 1000


def _validar_tamanho(valor, maximo, campo):
    """Retorna mensagem de erro se o texto exceder o limite, senão None."""
    if valor and len(valor) > maximo:
        return f'{campo} deve ter no máximo {maximo} caracteres'
    return None


def _hoje_br():
    """Data de hoje no fuso de São Paulo — não usar date.today(), que segue o
    fuso do servidor e viraria o dia cedo demais num host em UTC, marcando
    pedidos como atrasados algumas horas antes da hora."""
    return get_datetime_br().date()


def _filtro_pendente_nao_entregue():
    """Pedidos que ainda cobram ação: abertos e sem entrega confirmada.

    'entregue' é independente de 'status' (um pedido entregue pode seguir
    'pendente' até virar O.S.), então os alertas de prazo precisam excluir
    explicitamente os já entregues — senão um pedido entregue continuaria
    contando como atrasado."""
    return (
        PedidoGrafico.status == 'pendente',
        PedidoGrafico.entregue == False,
    )


def _parsear_data(valor):
    """Converte 'YYYY-MM-DD' (input type=date) para date. Retorna None se ausente/inválido."""
    if not valor:
        return None
    try:
        return datetime.strptime(str(valor).strip(), '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None


def _resolver_valor_unitario(item_id):
    """Preço do item na região única do módulo (regiao_numero=1). Snapshot no momento da criação."""
    estoque = EstoqueRegional.query.filter_by(item_id=item_id, regiao_numero=1).first()
    if not estoque or not estoque.preco:
        return '0'
    # preco e Numeric no banco; o campo destino guarda texto no formato BR
    return formatar_br(estoque.preco)


def _aplicar_itens(pedido, itens_data):
    """Cria os ItemPedidoGrafico a partir do payload, resolvendo preço no backend.
    Levanta ValueError com mensagem amigável em caso de item inválido."""
    for item_data in itens_data:
        item_id = item_data.get('itemId')
        item = Item.query.get(item_id) if item_id else None
        if not item:
            raise ValueError(f'Item {item_id} não encontrado')

        try:
            quantidade = float(item_data.get('quantidade'))
        except (TypeError, ValueError):
            quantidade = 0
        if quantidade <= 0:
            raise ValueError(f'Quantidade inválida para o item "{item.descricao}"')

        categoria_nome = item_data.get('categoria') or (item.categoria.nome if item.categoria else None)

        item_pedido = ItemPedidoGrafico(
            pedido_id=pedido.id,
            item_id=item.id,
            categoria=categoria_nome,
            descricao=item_data.get('descricao') or item.descricao,
            unidade=item_data.get('unidade') or item.unidade,
            quantidade=quantidade,
            valor_unitario=_resolver_valor_unitario(item.id),
        )
        db.session.add(item_pedido)


@pedidos_graficos_bp.route('/', methods=['GET'])
@login_requerido
@modulo_permitido_requerido(_MOD)
def listar_pedidos():
    """Lista pedidos com filtros: status, entregue (sim/nao), atraso (sim), busca."""
    try:
        query = PedidoGrafico.query

        status = request.args.get('status')
        if status:
            query = query.filter(PedidoGrafico.status == status)

        entregue = request.args.get('entregue')
        if entregue in ('sim', 'nao'):
            query = query.filter(PedidoGrafico.entregue == (entregue == 'sim'))

        if request.args.get('atraso') == 'sim':
            hoje = _hoje_br()
            query = query.filter(
                *_filtro_pendente_nao_entregue(),
                PedidoGrafico.prazo_entrega.isnot(None),
                PedidoGrafico.prazo_entrega < hoje
            )

        busca = request.args.get('busca', '').strip()
        if busca:
            query = query.filter(
                db.or_(
                    PedidoGrafico.solicitante.ilike(f'%{busca}%'),
                    PedidoGrafico.descricao.ilike(f'%{busca}%')
                )
            )

        # Prazos mais urgentes primeiro; sem prazo definido vai para o final
        pedidos = query.order_by(
            db.case((PedidoGrafico.prazo_entrega.is_(None), 1), else_=0),
            PedidoGrafico.prazo_entrega.asc(),
            PedidoGrafico.criado_em.desc()
        ).all()

        return jsonify([p.to_dict(incluir_itens=False) for p in pedidos]), 200

    except Exception as e:
        logger.exception('Erro ao listar pedidos gráficos')
        return jsonify({'erro': str(e)}), 500


@pedidos_graficos_bp.route('/resumo', methods=['GET'])
@login_requerido
@modulo_permitido_requerido(_MOD)
def resumo_pedidos():
    """Contagens para o painel de alertas de prazo."""
    try:
        hoje = _hoje_br()
        limite_vencendo = hoje + timedelta(days=_DIAS_VENCENDO_EM_BREVE)

        # "Pendentes" = ainda não viraram O.S. e não foram entregues: é o que
        # continua exigindo ação, coerente com os contadores de prazo ao lado.
        base_acao = PedidoGrafico.query.filter(*_filtro_pendente_nao_entregue())

        pendentes = base_acao.count()
        atrasados = base_acao.filter(
            PedidoGrafico.prazo_entrega.isnot(None),
            PedidoGrafico.prazo_entrega < hoje
        ).count()
        vencendo_em_breve = base_acao.filter(
            PedidoGrafico.prazo_entrega.isnot(None),
            PedidoGrafico.prazo_entrega >= hoje,
            PedidoGrafico.prazo_entrega <= limite_vencendo
        ).count()
        aguardando_entrega = PedidoGrafico.query.filter(
            PedidoGrafico.status == 'convertido',
            PedidoGrafico.entregue == False
        ).count()

        return jsonify({
            'pendentes': pendentes,
            'atrasados': atrasados,
            'vencendoEmBreve': vencendo_em_breve,
            'aguardandoEntrega': aguardando_entrega,
        }), 200

    except Exception as e:
        logger.exception('Erro ao gerar resumo de pedidos gráficos')
        return jsonify({'erro': str(e)}), 500


@pedidos_graficos_bp.route('/<int:pedido_id>', methods=['GET'])
@login_requerido
@modulo_permitido_requerido(_MOD)
def obter_pedido(pedido_id):
    pedido = PedidoGrafico.query.get_or_404(pedido_id)
    return jsonify(pedido.to_dict()), 200


@pedidos_graficos_bp.route('/', methods=['POST'])
@login_requerido
@modulo_permitido_requerido(_MOD)
@csrf_protegido
def criar_pedido():
    """Cria um pedido/orçamento + itens. Permite salvar sem itens (velocidade de lançamento)."""
    try:
        dados = request.get_json() or {}

        solicitante = (dados.get('solicitante') or '').strip()
        descricao = (dados.get('descricao') or '').strip()
        setor = (dados.get('setorSolicitante') or '').strip()
        observacoes = (dados.get('observacoes') or '').strip()
        if not solicitante or not descricao:
            return jsonify({'erro': 'solicitante e descricao são obrigatórios'}), 400

        for valor, maximo, campo in (
            (solicitante, _MAX_SOLICITANTE, 'solicitante'),
            (descricao, _MAX_DESCRICAO, 'descricao'),
            (setor, _MAX_SETOR, 'setorSolicitante'),
            (observacoes, _MAX_OBSERVACOES, 'observacoes'),
        ):
            erro = _validar_tamanho(valor, maximo, campo)
            if erro:
                return jsonify({'erro': erro}), 400

        pedido = PedidoGrafico(
            data_pedido=_parsear_data(dados.get('dataPedido')) or _hoje_br(),
            solicitante=solicitante,
            descricao=descricao,
            setor_solicitante=setor or None,
            prazo_entrega=_parsear_data(dados.get('prazoEntrega')),
            observacoes=observacoes or None,
            usuario_criador_id=session['usuario_id'],
        )
        db.session.add(pedido)
        db.session.flush()  # obter pedido.id para os itens

        try:
            _aplicar_itens(pedido, dados.get('itens', []))
        except ValueError as e:
            db.session.rollback()
            return jsonify({'erro': str(e)}), 400

        db.session.commit()

        registrar_auditoria(
            'CREATE', 'PEDIDO_GRAFICO',
            f'Criou pedido gráfico de {solicitante}',
            entidade_tipo='pedidos_graficos',
            entidade_id=pedido.id,
            dados_depois=pedido.to_dict()
        )

        return jsonify(pedido.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        logger.exception('Erro ao criar pedido gráfico')
        return jsonify({'erro': str(e)}), 500


@pedidos_graficos_bp.route('/<int:pedido_id>', methods=['PUT'])
@login_requerido
@modulo_permitido_requerido(_MOD)
@csrf_protegido
def atualizar_pedido(pedido_id):
    """Edita um pedido. Bloqueado se já convertido em O.S. ou cancelado."""
    try:
        pedido = PedidoGrafico.query.get_or_404(pedido_id)

        if pedido.status != 'pendente':
            return jsonify({
                'erro': f'Não é possível editar um pedido com status "{pedido.status}". '
                        f'Apenas pedidos pendentes podem ser alterados.'
            }), 409

        dados = request.get_json() or {}
        dados_antes = pedido.to_dict()

        if 'solicitante' in dados:
            solicitante = (dados.get('solicitante') or '').strip()
            if not solicitante:
                return jsonify({'erro': 'solicitante não pode ser vazio'}), 400
            erro = _validar_tamanho(solicitante, _MAX_SOLICITANTE, 'solicitante')
            if erro:
                return jsonify({'erro': erro}), 400
            pedido.solicitante = solicitante
        if 'descricao' in dados:
            descricao = (dados.get('descricao') or '').strip()
            if not descricao:
                return jsonify({'erro': 'descricao não pode ser vazia'}), 400
            erro = _validar_tamanho(descricao, _MAX_DESCRICAO, 'descricao')
            if erro:
                return jsonify({'erro': erro}), 400
            pedido.descricao = descricao
        if 'dataPedido' in dados:
            pedido.data_pedido = _parsear_data(dados.get('dataPedido')) or pedido.data_pedido
        if 'setorSolicitante' in dados:
            setor = (dados.get('setorSolicitante') or '').strip()
            erro = _validar_tamanho(setor, _MAX_SETOR, 'setorSolicitante')
            if erro:
                return jsonify({'erro': erro}), 400
            pedido.setor_solicitante = setor or None
        if 'prazoEntrega' in dados:
            pedido.prazo_entrega = _parsear_data(dados.get('prazoEntrega'))
        if 'observacoes' in dados:
            observacoes = (dados.get('observacoes') or '').strip()
            erro = _validar_tamanho(observacoes, _MAX_OBSERVACOES, 'observacoes')
            if erro:
                return jsonify({'erro': erro}), 400
            pedido.observacoes = observacoes or None

        # Itens: substituir por completo, igual ao padrão de atualização de OS
        if 'itens' in dados:
            for item_pedido in list(pedido.itens):
                db.session.delete(item_pedido)
            db.session.flush()
            try:
                _aplicar_itens(pedido, dados.get('itens', []))
            except ValueError as e:
                db.session.rollback()
                return jsonify({'erro': str(e)}), 400

        db.session.commit()

        registrar_auditoria(
            'UPDATE', 'PEDIDO_GRAFICO',
            f'Atualizou pedido gráfico #{pedido.id} - {pedido.solicitante}',
            entidade_tipo='pedidos_graficos',
            entidade_id=pedido.id,
            dados_antes=dados_antes,
            dados_depois=pedido.to_dict()
        )

        return jsonify(pedido.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        logger.exception('Erro ao atualizar pedido gráfico')
        return jsonify({'erro': str(e)}), 500


@pedidos_graficos_bp.route('/<int:pedido_id>/entrega', methods=['PUT'])
@login_requerido
@modulo_permitido_requerido(_MOD)
@csrf_protegido
def marcar_entrega(pedido_id):
    """Alterna o flag de entregue. Payload: {entregue: bool}."""
    try:
        pedido = PedidoGrafico.query.get_or_404(pedido_id)
        dados = request.get_json() or {}

        entregue = bool(dados.get('entregue'))
        pedido.entregue = entregue
        pedido.data_entrega_efetiva = _hoje_br() if entregue else None

        db.session.commit()

        registrar_auditoria(
            'UPDATE', 'PEDIDO_GRAFICO',
            f'Marcou pedido gráfico #{pedido.id} como {"entregue" if entregue else "não entregue"}',
            entidade_tipo='pedidos_graficos',
            entidade_id=pedido.id,
            dados_depois={'entregue': entregue}
        )

        return jsonify(pedido.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        logger.exception('Erro ao marcar entrega do pedido gráfico')
        return jsonify({'erro': str(e)}), 500


@pedidos_graficos_bp.route('/<int:pedido_id>/vincular-os', methods=['POST'])
@login_requerido
@modulo_permitido_requerido(_MOD)
@csrf_protegido
def vincular_os(pedido_id):
    """Vincula o pedido a uma O.S. já emitida. Payload: {ordemServicoId}.
    Chamado por emitir-os.js logo após a criação da O.S. a partir de um pedido."""
    try:
        pedido = PedidoGrafico.query.get_or_404(pedido_id)

        if pedido.status != 'pendente':
            return jsonify({
                'erro': f'Pedido #{pedido.id} já está com status "{pedido.status}" — não pode ser vinculado novamente.'
            }), 409

        dados = request.get_json() or {}
        ordem_servico_id = dados.get('ordemServicoId')
        if not ordem_servico_id:
            return jsonify({'erro': 'ordemServicoId é obrigatório'}), 400

        os_obj = OrdemServico.query.get(int(ordem_servico_id))
        if not os_obj:
            return jsonify({'erro': 'Ordem de Serviço não encontrada'}), 404
        if os_obj.modulo != MODULO_PEDIDOS:
            return jsonify({'erro': 'A Ordem de Serviço informada não pertence ao módulo Serviços Gráficos'}), 400

        pedido.ordem_servico_id = os_obj.id
        pedido.status = 'convertido'
        db.session.commit()

        registrar_auditoria(
            'UPDATE', 'PEDIDO_GRAFICO',
            f'Vinculou pedido gráfico #{pedido.id} à O.S. #{os_obj.numero_os}',
            entidade_tipo='pedidos_graficos',
            entidade_id=pedido.id,
            dados_depois={'ordemServicoId': os_obj.id, 'status': 'convertido'}
        )

        return jsonify(pedido.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        logger.exception('Erro ao vincular pedido gráfico à O.S.')
        return jsonify({'erro': str(e)}), 500


@pedidos_graficos_bp.route('/vincular-os-lote', methods=['POST'])
@login_requerido
@modulo_permitido_requerido(_MOD)
@csrf_protegido
def vincular_os_lote():
    """Vincula VÁRIOS pedidos a uma mesma O.S. Payload: {ordemServicoId, pedidoIds:[...]}.

    Permite agrupar pedidos numa única O.S. (o vínculo é many-to-one, então N
    pedidos podem apontar para a mesma ordem sem mudança de schema).

    Atômica de propósito: valida todos os pedidos ANTES de gravar qualquer um —
    um lote parcialmente aplicado deixaria pedidos órfãos difíceis de reconciliar.
    """
    try:
        dados = request.get_json() or {}

        pedido_ids = dados.get('pedidoIds') or []
        if not isinstance(pedido_ids, list) or not pedido_ids:
            return jsonify({'erro': 'pedidoIds deve ser uma lista não vazia'}), 400

        try:
            pedido_ids = [int(i) for i in pedido_ids]
        except (TypeError, ValueError):
            return jsonify({'erro': 'pedidoIds deve conter apenas números'}), 400
        pedido_ids = list(dict.fromkeys(pedido_ids))  # remove repetidos preservando a ordem

        ordem_servico_id = dados.get('ordemServicoId')
        if not ordem_servico_id:
            return jsonify({'erro': 'ordemServicoId é obrigatório'}), 400

        os_obj = OrdemServico.query.get(int(ordem_servico_id))
        if not os_obj:
            return jsonify({'erro': 'Ordem de Serviço não encontrada'}), 404
        if os_obj.modulo != MODULO_PEDIDOS:
            return jsonify({'erro': 'A Ordem de Serviço informada não pertence ao módulo Serviços Gráficos'}), 400

        # Fase 1 — validar tudo antes de gravar qualquer coisa
        pedidos = PedidoGrafico.query.filter(PedidoGrafico.id.in_(pedido_ids)).all()
        encontrados = {p.id: p for p in pedidos}

        inexistentes = [i for i in pedido_ids if i not in encontrados]
        if inexistentes:
            return jsonify({
                'erro': f'Pedido(s) não encontrado(s): {", ".join(f"#{i}" for i in inexistentes)}',
                'pedidosInvalidos': inexistentes
            }), 409

        nao_pendentes = [p.id for p in pedidos if p.status != 'pendente']
        if nao_pendentes:
            return jsonify({
                'erro': (f'Pedido(s) {", ".join(f"#{i}" for i in nao_pendentes)} não estão mais pendentes '
                         f'— nenhum vínculo foi feito.'),
                'pedidosInvalidos': nao_pendentes
            }), 409

        # Fase 2 — grava tudo num único commit
        for p in pedidos:
            p.ordem_servico_id = os_obj.id
            p.status = 'convertido'
        db.session.commit()

        registrar_auditoria(
            'UPDATE', 'PEDIDO_GRAFICO',
            f'Vinculou {len(pedidos)} pedido(s) gráfico(s) à O.S. #{os_obj.numero_os}: '
            f'{", ".join(f"#{p.id}" for p in pedidos)}',
            entidade_tipo='pedidos_graficos',
            entidade_id=pedidos[0].id if pedidos else None,
            dados_depois={'ordemServicoId': os_obj.id, 'pedidoIds': [p.id for p in pedidos],
                          'status': 'convertido'}
        )

        return jsonify({
            'sucesso': True,
            'ordemServicoId': os_obj.id,
            'numeroOS': os_obj.numero_os,
            'pedidos': [p.to_dict(incluir_itens=False) for p in pedidos]
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.exception('Erro ao vincular pedidos gráficos à O.S. em lote')
        return jsonify({'erro': str(e)}), 500


@pedidos_graficos_bp.route('/<int:pedido_id>/cancelar', methods=['POST'])
@login_requerido
@modulo_permitido_requerido(_MOD)
@csrf_protegido
def cancelar_pedido(pedido_id):
    """Cancela um pedido pendente. Payload: {motivo}."""
    try:
        pedido = PedidoGrafico.query.get_or_404(pedido_id)

        if pedido.status != 'pendente':
            return jsonify({
                'erro': f'Só é possível cancelar pedidos pendentes. Status atual: "{pedido.status}".'
            }), 400

        dados = request.get_json() or {}
        motivo = (dados.get('motivo') or '').strip()
        if not motivo:
            return jsonify({'erro': 'O motivo do cancelamento é obrigatório'}), 400
        erro = _validar_tamanho(motivo, _MAX_MOTIVO, 'motivo')
        if erro:
            return jsonify({'erro': erro}), 400

        pedido.status = 'cancelado'
        pedido.motivo_cancelamento = motivo
        db.session.commit()

        registrar_auditoria(
            'UPDATE', 'PEDIDO_GRAFICO',
            f'Cancelou pedido gráfico #{pedido.id} - motivo: {motivo}',
            entidade_tipo='pedidos_graficos',
            entidade_id=pedido.id,
            dados_depois={'status': 'cancelado', 'motivo': motivo}
        )

        return jsonify(pedido.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        logger.exception('Erro ao cancelar pedido gráfico')
        return jsonify({'erro': str(e)}), 500


@pedidos_graficos_bp.route('/<int:pedido_id>', methods=['DELETE'])
@login_requerido
@modulo_permitido_requerido(_MOD)
@csrf_protegido
def deletar_pedido(pedido_id):
    """Exclusão física — só permitida enquanto o pedido está pendente."""
    try:
        pedido = PedidoGrafico.query.get_or_404(pedido_id)

        if pedido.status != 'pendente':
            return jsonify({
                'erro': f'Não é possível excluir um pedido com status "{pedido.status}".'
            }), 409

        dados_antes = pedido.to_dict()
        solicitante = pedido.solicitante
        db.session.delete(pedido)
        db.session.commit()

        registrar_auditoria(
            'DELETE', 'PEDIDO_GRAFICO',
            f'Excluiu pedido gráfico #{pedido_id} - {solicitante}',
            entidade_tipo='pedidos_graficos',
            entidade_id=pedido_id,
            dados_antes=dados_antes
        )

        return jsonify({'sucesso': True, 'mensagem': 'Pedido excluído com sucesso'}), 200

    except Exception as e:
        db.session.rollback()
        logger.exception('Erro ao excluir pedido gráfico')
        return jsonify({'erro': str(e)}), 500
