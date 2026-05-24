"""
Portal da Detentora — APIs
============================
Prefixo: /api/empresa

Rotas:
  GET  /inbox                          — caixa de entrada da detentora (filtro por status)
  GET  /ordens/<id>                    — detalhe de uma O.S. (isolado por detentora)
  POST /ordens/<id>/aceitar            — aceite com assinatura canvas
  POST /ordens/<id>/revisar            — solicitar revisão (não bloqueia execução)
  POST /ordens/<id>/recusar            — recusar a O.S. (enviada_empresa/em_revisao → recusada)
  GET  /ordens/<id>/comentarios        — listar comentários
  POST /ordens/<id>/comentarios        — adicionar comentário
  POST /ordens/<id>/iniciar-execucao   — aceita → em_execucao
  POST /ordens/<id>/concluir-execucao  — em_execucao → executada
"""

import os
import base64
import hashlib
from datetime import datetime
from flask import Blueprint, request, jsonify, session, send_file

from models import (
    db, OrdemServico, AceiteEmpresa, RevisaoEmpresa, ComentarioEmpresa,
    status_transicao_valida, STATUS_LABELS, get_datetime_br
)
from routes.auth_routes import empresa_requerido, login_requerido, csrf_protegido
from utils.auditoria import registrar_auditoria
from extensions import limiter

detentora_portal_bp = Blueprint('detentora_portal', __name__)

# ---------------------------------------------------------------------------
# Limites de tamanho de campos de texto livre (server-side)
# ---------------------------------------------------------------------------
_MAX_NOME = 120
_MAX_CARGO = 100
_MAX_TEXTO = 2000
_MAX_MOTIVO = 1000
_MAX_DESCRICAO = 1000

# Pasta onde as assinaturas são salvas
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSINATURAS_DIR = os.path.join(BASE_DIR, 'static', 'assinaturas')


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_detentora_id():
    """Retorna o detentora_id da sessão atual."""
    return session.get('detentora_id')


def _get_os_da_detentora(os_id):
    """
    Busca a O.S. pelo ID e garante que pertence à detentora autenticada.
    Retorna (os, erro_response) — um deles será None.

    Segurança: revalida o detentora_id buscando o usuário atual no banco,
    não confiando apenas na sessão (que pode estar desatualizada ou ter sido
    manipulada entre requisições).
    """
    usuario_id = session.get('usuario_id')
    if not usuario_id:
        return None, (jsonify({'erro': 'Sessão inválida'}), 403)

    # Refetch do banco — ignora o que está na sessão para decisões de autorização
    from models import Usuario
    usuario = Usuario.query.get(usuario_id)
    if not usuario or usuario.perfil != 'empresa' or not usuario.detentora_id:
        return None, (jsonify({'erro': 'Acesso negado'}), 403)

    os_obj = OrdemServico.query.get(os_id)
    if not os_obj:
        return None, (jsonify({'erro': 'Ordem de Serviço não encontrada'}), 404)
    if os_obj.detentora_id != usuario.detentora_id:
        return None, (jsonify({'erro': 'Acesso negado a esta Ordem de Serviço'}), 403)
    return os_obj, None


_PNG_MAGIC = b'\x89PNG\r\n\x1a\n'
_MAX_ASSINATURA_BYTES = 2 * 1024 * 1024  # 2 MB após decode


def _validar_e_decodificar_png(base64_data: str) -> bytes:
    """
    Valida e decodifica uma string base64 de imagem PNG.
    Lança ValueError com mensagem descritiva em caso de falha.
    Proteções:
      - Tamanho máximo da string base64 (evita alocação excessiva antes do decode)
      - Base64 inválido
      - Tamanho máximo dos bytes decodificados (2 MB)
      - Magic bytes PNG (89 50 4E 47 0D 0A 1A 0A)
    """
    # 1. Remover prefixo data URI se presente
    if ',' in base64_data:
        base64_data = base64_data.split(',', 1)[1]

    # 2. Limite de tamanho da string base64 (base64 ≈ 33% maior que binário)
    max_b64_len = int(_MAX_ASSINATURA_BYTES * 1.37)
    if len(base64_data) > max_b64_len:
        raise ValueError('Assinatura excede o tamanho máximo permitido (2 MB)')

    # 3. Decodificar (com validação estrita)
    try:
        img_bytes = base64.b64decode(base64_data, validate=True)
    except Exception:
        raise ValueError('Dados de assinatura inválidos (base64 malformado)')

    # 4. Tamanho do binário decodificado
    if len(img_bytes) > _MAX_ASSINATURA_BYTES:
        raise ValueError('Assinatura excede o tamanho máximo permitido (2 MB)')

    # 5. Validar magic bytes PNG
    if not img_bytes.startswith(_PNG_MAGIC):
        raise ValueError('Arquivo de assinatura inválido (não é PNG)')

    return img_bytes


def _salvar_assinatura(os_id, base64_data):
    """
    Valida, salva o PNG de assinatura em arquivo e retorna (path_relativo, hash_sha256).
    base64_data pode vir com ou sem o prefixo 'data:image/png;base64,'.
    Lança ValueError se os dados forem inválidos.
    """
    os.makedirs(ASSINATURAS_DIR, exist_ok=True)

    img_bytes = _validar_e_decodificar_png(base64_data)
    hash_sha256 = hashlib.sha256(img_bytes).hexdigest()

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'os{os_id}_{timestamp}.png'
    filepath = os.path.join(ASSINATURAS_DIR, filename)

    with open(filepath, 'wb') as f:
        f.write(img_bytes)

    # Retornar path relativo à pasta static (sempre com forward slash para URLs)
    return f'assinaturas/{filename}', hash_sha256


def _mudar_status(os_obj, novo_status, descricao_auditoria, entidade_tipo='ordens_servico'):
    """Aplica a transição de status com auditoria. Retorna (sucesso, erro_response)."""
    status_atual = os_obj.status or 'emitida'
    if not status_transicao_valida(status_atual, novo_status):
        msg = (
            f'Transição inválida: {STATUS_LABELS.get(status_atual, status_atual)} '
            f'→ {STATUS_LABELS.get(novo_status, novo_status)}'
        )
        return False, (jsonify({'erro': msg}), 400)

    dados_antes = {'status': status_atual}
    os_obj.status = novo_status
    dados_depois = {'status': novo_status}

    registrar_auditoria(
        'UPDATE', 'OS', descricao_auditoria,
        entidade_tipo=entidade_tipo,
        entidade_id=os_obj.id,
        dados_antes=dados_antes,
        dados_depois=dados_depois
    )
    return True, None


# ---------------------------------------------------------------------------
# GET /api/empresa/inbox
# ---------------------------------------------------------------------------

@detentora_portal_bp.route('/inbox', methods=['GET'])
@empresa_requerido
def inbox():
    """
    Caixa de entrada da detentora.
    Filtros: status (pode ser lista separada por vírgula), busca (número/evento).
    """
    detentora_id = _get_detentora_id()

    # Sessão sem detentora_id — usuário precisa re-logar após vinculação
    if not detentora_id:
        return jsonify({
            'erro': 'Sua sessão não possui uma detentora vinculada. Faça logout e login novamente.',
            'relogin': True,
            'ordens': [],
            'totais': {}
        }), 200  # 200 para o frontend exibir mensagem amigável

    status_filtro = request.args.get('status', '')
    busca = request.args.get('busca', '').strip()
    modulo = request.args.get('modulo', '')
    grupo = request.args.get('grupo', '')

    query = OrdemServico.query.filter_by(detentora_id=detentora_id)

    # Status visíveis para a empresa (nunca expor 'emitida' — ainda não enviada)
    _STATUS_VALIDOS_EMPRESA = frozenset([
        'enviada_empresa', 'em_revisao', 'aceita',
        'em_execucao', 'executada', 'recusada', 'cancelada',
    ])

    # Filtrar por status (aceita múltiplos separados por vírgula)
    if status_filtro:
        statuses = [s.strip() for s in status_filtro.split(',') if s.strip()]
        invalidos = [s for s in statuses if s not in _STATUS_VALIDOS_EMPRESA]
        if invalidos:
            return jsonify({'erro': f'Status inválido: {invalidos}'}), 400
        if statuses:
            query = query.filter(OrdemServico.status.in_(statuses))
    else:
        # Por padrão, exibir apenas status visíveis para a empresa
        query = query.filter(OrdemServico.status.in_(list(_STATUS_VALIDOS_EMPRESA)))

    if busca:
        query = query.filter(
            db.or_(
                OrdemServico.numero_os.ilike(f'%{busca}%'),
                OrdemServico.evento.ilike(f'%{busca}%')
            )
        )

    if modulo:
        query = query.filter_by(modulo=modulo)

    if grupo:
        query = query.filter_by(grupo=grupo)

    ordens = query.order_by(OrdemServico.data_emissao.desc(), OrdemServico.id.desc()).all()

    # Calcular totais por status para os badges das abas
    todas = OrdemServico.query.filter_by(detentora_id=detentora_id).filter(
        OrdemServico.status.in_([
            'enviada_empresa', 'em_revisao', 'aceita',
            'em_execucao', 'executada', 'recusada'
        ])
    ).all()
    totais = {}
    for o in todas:
        totais[o.status] = totais.get(o.status, 0) + 1

    return jsonify({
        'ordens': [o.to_dict(incluir_itens=False) for o in ordens],
        'totais': totais,
        'total': len(ordens)
    }), 200


# ---------------------------------------------------------------------------
# GET /api/empresa/ordens/<id>
# ---------------------------------------------------------------------------

@detentora_portal_bp.route('/ordens/<int:os_id>', methods=['GET'])
@empresa_requerido
def detalhe_ordem(os_id):
    """Retorna detalhe completo de uma O.S., incluindo aceites, revisões e comentários."""
    os_obj, erro = _get_os_da_detentora(os_id)
    if erro:
        return erro

    data = os_obj.to_dict(incluir_itens=True)
    data['aceites'] = [a.to_dict() for a in os_obj.aceites]
    data['revisoes'] = [r.to_dict() for r in os_obj.revisoes]
    data['comentarios'] = sorted(
        [c.to_dict() for c in os_obj.comentarios],
        key=lambda c: c['criadoEm'] or ''
    )
    return jsonify(data), 200


# ---------------------------------------------------------------------------
# POST /api/empresa/ordens/<id>/aceitar
# ---------------------------------------------------------------------------

@detentora_portal_bp.route('/ordens/<int:os_id>/pdf', methods=['GET'])
@empresa_requerido
def pdf_ordem_empresa(os_id):
    """
    Gera e retorna o PDF completo da O.S. para a detentora,
    incluindo a seção de aceite digital se já foi aceita.
    """
    from pdf_generator import gerar_pdf_os

    os_obj, erro = _get_os_da_detentora(os_id)
    if erro:
        return erro

    dados_pdf = os_obj.to_dict(incluir_itens=True)
    dados_pdf['aceites'] = [a.to_dict() for a in os_obj.aceites]
    dados_pdf['assinaturas_internas'] = [a.to_dict() for a in os_obj.assinaturas_internas]

    pdf_buffer = gerar_pdf_os(dados_pdf)

    numero_limpo = (dados_pdf.get('numeroOS') or str(os_id)).replace('/', '-')
    filename = f"OS_{numero_limpo}.pdf"

    return send_file(
        pdf_buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename
    )


@detentora_portal_bp.route('/ordens/<int:os_id>/aceitar', methods=['POST'])
@empresa_requerido
@csrf_protegido
@limiter.limit('5 per minute')
def aceitar_ordem(os_id):
    """
    Registra o aceite da O.S. com assinatura digital (canvas base64).
    Transição obrigatória: enviada_empresa → aceita.

    Body JSON:
      - nome_responsavel: str (obrigatório)
      - assinatura_base64: str PNG em base64 (obrigatório)
      - observacoes: str (opcional)
    """
    os_obj, erro = _get_os_da_detentora(os_id)
    if erro:
        return erro

    dados = request.get_json() or {}
    nome_responsavel = (dados.get('nome_responsavel') or '').strip()
    cargo = (dados.get('cargo') or '').strip()
    assinatura_b64 = (dados.get('assinatura_base64') or '').strip()

    if not nome_responsavel:
        return jsonify({'erro': 'nome_responsavel é obrigatório'}), 400
    if len(nome_responsavel) > _MAX_NOME:
        return jsonify({'erro': f'nome_responsavel deve ter no máximo {_MAX_NOME} caracteres'}), 400
    if cargo and len(cargo) > _MAX_CARGO:
        return jsonify({'erro': f'cargo deve ter no máximo {_MAX_CARGO} caracteres'}), 400
    if not assinatura_b64:
        return jsonify({'erro': 'assinatura_base64 é obrigatório'}), 400

    # Validar e aplicar transição de status
    ok, err_resp = _mudar_status(
        os_obj, 'aceita',
        f'Detentora aceitou a O.S. #{os_obj.numero_os} — responsável: {nome_responsavel}'
    )
    if not ok:
        return err_resp

    # Salvar assinatura em arquivo
    try:
        assinatura_path, hash_payload = _salvar_assinatura(os_id, assinatura_b64)
    except Exception as e:
        return jsonify({'erro': f'Erro ao salvar assinatura: {str(e)}'}), 500

    # Registrar aceite com evidências
    aceite = AceiteEmpresa(
        ordem_servico_id=os_id,
        usuario_id=session['usuario_id'],
        detentora_id=_get_detentora_id(),
        nome_responsavel=nome_responsavel,
        assinatura_path=assinatura_path,
        hash_payload=hash_payload,
        data_hora=get_datetime_br(),
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent', '')[:200],
        observacoes=dados.get('observacoes', '')
    )
    db.session.add(aceite)
    db.session.commit()

    registrar_auditoria(
        'CREATE', 'ACEITE_OS',
        f'Aceite registrado para O.S. #{os_obj.numero_os} por {nome_responsavel}',
        entidade_tipo='aceites_empresa',
        entidade_id=aceite.id,
        dados_depois=aceite.to_dict()
    )

    return jsonify({
        'sucesso': True,
        'status': os_obj.status,
        'aceite': aceite.to_dict()
    }), 201


# ---------------------------------------------------------------------------
# POST /api/empresa/ordens/<id>/revisar
# ---------------------------------------------------------------------------

@detentora_portal_bp.route('/ordens/<int:os_id>/revisar', methods=['POST'])
@empresa_requerido
@csrf_protegido
def revisar_ordem(os_id):
    """
    Registra uma solicitação de revisão. Não bloqueia execução automaticamente.
    Transição: enviada_empresa → em_revisao.

    Body JSON:
      - descricao: str (obrigatório)
    """
    os_obj, erro = _get_os_da_detentora(os_id)
    if erro:
        return erro

    dados = request.get_json() or {}
    descricao = (dados.get('descricao') or '').strip()

    if not descricao:
        return jsonify({'erro': 'descricao é obrigatória'}), 400
    if len(descricao) > _MAX_DESCRICAO:
        return jsonify({'erro': f'descricao deve ter no máximo {_MAX_DESCRICAO} caracteres'}), 400

    ok, err_resp = _mudar_status(
        os_obj, 'em_revisao',
        f'Detentora solicitou revisão da O.S. #{os_obj.numero_os}'
    )
    if not ok:
        return err_resp

    revisao = RevisaoEmpresa(
        ordem_servico_id=os_id,
        usuario_id=session['usuario_id'],
        detentora_id=_get_detentora_id(),
        descricao=descricao,
        criado_em=get_datetime_br()
    )
    db.session.add(revisao)
    db.session.commit()

    registrar_auditoria(
        'CREATE', 'REVISAO_OS',
        f'Revisão solicitada para O.S. #{os_obj.numero_os}',
        entidade_tipo='revisoes_empresa',
        entidade_id=revisao.id,
        dados_depois=revisao.to_dict()
    )

    return jsonify({
        'sucesso': True,
        'status': os_obj.status,
        'revisao': revisao.to_dict()
    }), 201


# ---------------------------------------------------------------------------
# GET + POST /api/empresa/ordens/<id>/comentarios
# ---------------------------------------------------------------------------

@detentora_portal_bp.route('/ordens/<int:os_id>/comentarios', methods=['GET'])
@empresa_requerido
def listar_comentarios(os_id):
    """Lista comentários da O.S. em ordem cronológica."""
    os_obj, erro = _get_os_da_detentora(os_id)
    if erro:
        return erro

    comentarios = sorted(os_obj.comentarios, key=lambda c: c.criado_em or datetime.min)
    return jsonify([c.to_dict() for c in comentarios]), 200


@detentora_portal_bp.route('/ordens/<int:os_id>/comentarios', methods=['POST'])
@empresa_requerido
@csrf_protegido
@limiter.limit('20 per minute')
def adicionar_comentario(os_id):
    """
    Adiciona um comentário/pergunta à O.S. (sem SLA).

    Body JSON:
      - texto: str (obrigatório)
    """
    os_obj, erro = _get_os_da_detentora(os_id)
    if erro:
        return erro

    dados = request.get_json() or {}
    texto = (dados.get('texto') or '').strip()

    if not texto:
        return jsonify({'erro': 'texto é obrigatório'}), 400
    if len(texto) > _MAX_TEXTO:
        return jsonify({'erro': f'texto deve ter no máximo {_MAX_TEXTO} caracteres'}), 400

    comentario = ComentarioEmpresa(
        ordem_servico_id=os_id,
        usuario_id=session['usuario_id'],
        detentora_id=_get_detentora_id(),
        texto=texto,
        criado_em=get_datetime_br()
    )
    db.session.add(comentario)
    db.session.commit()

    registrar_auditoria(
        'CREATE', 'COMENTARIO_OS',
        f'Comentário adicionado na O.S. #{os_obj.numero_os}',
        entidade_tipo='comentarios_empresa',
        entidade_id=comentario.id,
        dados_depois=comentario.to_dict()
    )

    return jsonify({
        'sucesso': True,
        'comentario': comentario.to_dict()
    }), 201


# ---------------------------------------------------------------------------
# POST /api/empresa/ordens/<id>/iniciar-execucao
# ---------------------------------------------------------------------------

@detentora_portal_bp.route('/ordens/<int:os_id>/iniciar-execucao', methods=['POST'])
@empresa_requerido
@csrf_protegido
def iniciar_execucao(os_id):
    """Transição: aceita → em_execucao."""
    os_obj, erro = _get_os_da_detentora(os_id)
    if erro:
        return erro

    ok, err_resp = _mudar_status(
        os_obj, 'em_execucao',
        f'Detentora iniciou execução da O.S. #{os_obj.numero_os}'
    )
    if not ok:
        return err_resp

    db.session.commit()

    return jsonify({
        'sucesso': True,
        'status': os_obj.status,
        'statusLabel': STATUS_LABELS.get(os_obj.status, os_obj.status)
    }), 200


# ---------------------------------------------------------------------------
# POST /api/empresa/ordens/<id>/concluir-execucao
# ---------------------------------------------------------------------------

@detentora_portal_bp.route('/ordens/<int:os_id>/concluir-execucao', methods=['POST'])
@empresa_requerido
@csrf_protegido
def concluir_execucao(os_id):
    """Transição: em_execucao → executada."""
    os_obj, erro = _get_os_da_detentora(os_id)
    if erro:
        return erro

    ok, err_resp = _mudar_status(
        os_obj, 'executada',
        f'Detentora concluiu execução da O.S. #{os_obj.numero_os}'
    )
    if not ok:
        return err_resp

    db.session.commit()

    return jsonify({
        'sucesso': True,
        'status': os_obj.status,
        'statusLabel': STATUS_LABELS.get(os_obj.status, os_obj.status)
    }), 200


# ---------------------------------------------------------------------------
# POST /api/empresa/ordens/<id>/recusar
# ---------------------------------------------------------------------------

@detentora_portal_bp.route('/ordens/<int:os_id>/recusar', methods=['POST'])
@empresa_requerido
@csrf_protegido
@limiter.limit('5 per minute')
def recusar_ordem(os_id):
    """
    Detentora recusa a O.S. Transição: enviada_empresa | em_revisao → recusada.

    Body JSON:
      - motivo: str (obrigatório) — justificativa da recusa
    """
    os_obj, erro = _get_os_da_detentora(os_id)
    if erro:
        return erro

    dados = request.get_json() or {}
    motivo = (dados.get('motivo') or '').strip()

    if not motivo:
        return jsonify({'erro': 'motivo é obrigatório para recusar a O.S.'}), 400
    if len(motivo) > _MAX_MOTIVO:
        return jsonify({'erro': f'motivo deve ter no máximo {_MAX_MOTIVO} caracteres'}), 400

    ok, err_resp = _mudar_status(
        os_obj, 'recusada',
        f'Detentora recusou a O.S. #{os_obj.numero_os} — motivo: {motivo}'
    )
    if not ok:
        return err_resp

    # Registrar motivo como revisão para rastreabilidade
    revisao = RevisaoEmpresa(
        ordem_servico_id=os_id,
        usuario_id=session['usuario_id'],
        detentora_id=_get_detentora_id(),
        descricao=f'[RECUSA] {motivo}',
        criado_em=get_datetime_br()
    )
    db.session.add(revisao)
    db.session.commit()

    registrar_auditoria(
        'UPDATE', 'OS',
        f'O.S. #{os_obj.numero_os} recusada pela detentora — motivo: {motivo}',
        entidade_tipo='ordens_servico',
        entidade_id=os_id,
        dados_depois={'status': 'recusada', 'motivo': motivo}
    )

    return jsonify({
        'sucesso': True,
        'status': os_obj.status,
        'statusLabel': STATUS_LABELS.get(os_obj.status, os_obj.status)
    }), 200
