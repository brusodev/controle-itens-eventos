from flask import Blueprint, request, jsonify, send_file, session
from models import (
    db, OrdemServico, ItemOrdemServico, Item, EstoqueRegional, Categoria,
    MovimentacaoEstoque, get_datetime_br, status_transicao_valida, STATUS_LABELS,
    STATUS_BLOQUEADOS_EDICAO, Usuario, Detentora
)
from datetime import datetime, date
from sqlalchemy import func
from pdf_generator import gerar_pdf_os
from routes.auth_routes import login_requerido, admin_requerido, csrf_protegido
from utils.auditoria import registrar_auditoria
import sys
import os
import json
import re

# Adicionar o diretório utils ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'utils'))
from controle_estoque import (
    processar_baixas_os, 
    reverter_baixa_estoque, 
    ErroEstoqueInsuficiente, 
    ErroRegiaoInvalida,
    obter_relatorio_estoque_por_regiao
)

os_bp = Blueprint('ordens_servico', __name__)


def _parsear_data_emissao(data_str):
    """Converte dd/mm/yyyy ou yyyy-mm-dd para datetime. Retorna datetime.now() se inválido."""
    if not data_str:
        return datetime.now()
    try:
        s = str(data_str).strip()
        if '/' in s:
            return datetime.strptime(s, '%d/%m/%Y')
        if 'T' in s:
            return datetime.fromisoformat(s.replace('Z', '+00:00'))
        return datetime.strptime(s.split()[0], '%Y-%m-%d')
    except (ValueError, AttributeError):
        return datetime.now()


def _extrair_numero_os(numero_os):
    if not numero_os:
        return None
    s = str(numero_os).strip().upper()
    if '/' in s:
        s = s.split('/')[0]
    if s.startswith('OS-'):
        s = s[3:]
    try:
        return int(s)
    except ValueError:
        m = re.search(r'(\d+)', s)
        return int(m.group(1)) if m else None


_MODULO_LABEL = {
    'coffee': 'CoffeeBreak',
    'transporte': 'Transporte',
    'organizacao': 'Organizacao',
    'hospedagem': 'Hospedagem',
    'trofeus': 'Trofeus',
}

def _nome_arquivo_os(dados_pdf, extensao='pdf'):
    """Gera nome de arquivo identificável: Modulo_Detentora_Grupo_OS-XXX_DD-MM-AAAA.ext"""
    import re as _re
    from datetime import datetime as _dt

    def _slug(texto, max_len=20):
        if not texto:
            return ''
        s = str(texto).strip()
        s = _re.sub(r'[^\w\s-]', '', s, flags=_re.UNICODE)
        s = _re.sub(r'[\s]+', '-', s)
        return s[:max_len]

    modulo = dados_pdf.get('modulo', 'os')
    modulo_label = _MODULO_LABEL.get(modulo, modulo.capitalize())
    detentora = _slug(dados_pdf.get('detentora') or '', 15)
    grupo = dados_pdf.get('grupo') or ''
    numero_os = (dados_pdf.get('numeroOS') or '').replace('/', '-')
    data_emissao = dados_pdf.get('dataEmissao') or ''
    try:
        dt = _dt.fromisoformat(str(data_emissao).replace('Z', '')) if data_emissao else _dt.now()
        data_str = dt.strftime('%d-%m-%Y')
    except Exception:
        data_str = _dt.now().strftime('%d-%m-%Y')

    partes = [modulo_label]
    if detentora:
        partes.append(detentora)
    if grupo:
        partes.append(f'G{grupo}')
    partes.append(numero_os)
    partes.append(data_str)

    return '_'.join(partes) + f'.{extensao}'


def gerar_proximo_numero_os(modulo=None, detentora_id=None):
    """Gera automaticamente o próximo número de O.S. (OS-001) por detentora e módulo"""
    query = OrdemServico.query
    if modulo:
        query = query.filter(OrdemServico.modulo == modulo)
    if detentora_id is not None:
        query = query.filter(OrdemServico.detentora_id == detentora_id)

    ultima_os = query.order_by(OrdemServico.id.desc()).first()

    if ultima_os:
        numero_atual = _extrair_numero_os(ultima_os.numero_os) or 0
        proximo_numero = numero_atual + 1
    else:
        proximo_numero = 1

    return f"OS-{proximo_numero:03d}"


def _max_grupo_por_modulo(modulo):
    if modulo == 'organizacao':
        return 3
    if modulo == 'transporte':
        return 1
    if modulo == 'trofeus':
        return 2
    return 6


def _resolver_detentora_id(modulo, grupo, detentora_nome, detentora_id=None):
    if detentora_id:
        return int(detentora_id)

    query = Detentora.query.filter_by(modulo=modulo, ativo=True)
    if grupo:
        query = query.filter_by(grupo=str(grupo).strip())
    if detentora_nome:
        query = query.filter(Detentora.nome.ilike(detentora_nome))

    det = query.first()
    return det.id if det else None


@os_bp.route('/proximo-numero', methods=['GET'])
@login_requerido
def obter_proximo_numero():
    """Retorna o próximo número de O.S. disponível para o módulo"""
    try:
        modulo = request.args.get('modulo', 'coffee')
        detentora_id = request.args.get('detentora_id')
        proximo_numero = gerar_proximo_numero_os(modulo, int(detentora_id) if detentora_id else None)
        return jsonify({'proximoNumero': proximo_numero}), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@os_bp.route('/', methods=['GET'])
@login_requerido
def listar_ordens():
    """Lista todas as ordens de serviço"""
    try:
        busca = request.args.get('busca', '')
        modulo = request.args.get('modulo', 'coffee')
        
        query = OrdemServico.query.filter_by(modulo=modulo)
        
        grupo = request.args.get('grupo')
        if grupo:
            query = query.filter(OrdemServico.grupo == str(grupo).strip())

        if busca:
            query = query.filter(
                db.or_(
                    OrdemServico.numero_os.ilike(f'%{busca}%'),
                    OrdemServico.evento.ilike(f'%{busca}%'),
                    OrdemServico.detentora.ilike(f'%{busca}%')
                )
            )

        filtro = request.args.get('filtro', '')
        hoje = date.today().isoformat()
        if filtro == 'vencidas':
            query = query.filter(
                OrdemServico.pagamento_vencimento != None,
                OrdemServico.pagamento_vencimento < hoje,
                db.or_(
                    OrdemServico.pagamento_pago == False,
                    OrdemServico.pagamento_pago == None
                )
            )
        elif filtro == 'pagas':
            query = query.filter(OrdemServico.pagamento_pago == True)

        ordens = query.order_by(
            OrdemServico.id.desc()
        ).all()
        return jsonify([os.to_dict() for os in ordens]), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@os_bp.route('/<int:os_id>', methods=['GET'])
@login_requerido
def obter_ordem(os_id):
    """Obtém uma ordem de serviço específica"""
    try:
        os = OrdemServico.query.get_or_404(os_id)
        return jsonify(os.to_dict()), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 404


@os_bp.route('/', methods=['POST'])
@login_requerido
def criar_ordem():
    """Cria uma nova ordem de serviço e atualiza estoque COM VALIDAÇÃO"""
    # Empresa contratada não pode emitir O.S. — apenas operadores internos
    if session.get('usuario_perfil') == 'empresa':
        return jsonify({'erro': 'Empresa contratada não tem permissão para emitir Ordens de Serviço'}), 403

    try:
        dados = request.json
        
        # DEBUG: Imprimir dados recebidos
        print("\n" + "="*60)
        print("📥 DADOS RECEBIDOS NA API - POST /ordens-servico/")
        print("="*60)
        print(f"Grupo: {dados.get('grupo')}")
        print(f"Itens recebidos: {len(dados.get('itens', []))}")
        for idx, item in enumerate(dados.get('itens', []), 1):
            print(f"\nItem {idx}:")
            print(f"  Descrição: {item.get('descricao', 'N/A')}")
            print(f"  Diárias: {item.get('diarias', 'MISSING')}")
            print(f"  Qtd Solicitada: {item.get('qtdSolicitada', 'MISSING')}")
            print(f"  Qtd Total: {item.get('qtdTotal', 'MISSING')}")
        print("="*60 + "\n")
        
        # Gerar próximo número automaticamente (por módulo + detentora)
        modulo_os = dados.get('modulo') or request.args.get('modulo', 'coffee')
        detentora_id = dados.get('detentoraId') or dados.get('detentora_id') or None
        detentora_id = int(detentora_id) if detentora_id else None
        if not detentora_id:
            detentora_id = _resolver_detentora_id(modulo_os, dados.get('grupo'), dados.get('detentora'))
        numero_os_gerado = gerar_proximo_numero_os(modulo_os, detentora_id)
        print(f"🔢 Número da O.S. gerado automaticamente: {numero_os_gerado}")
        
        # ✅ VALIDAR E OBTER REGIÃO DO GRUPO
        grupo = dados.get('grupo')
        try:
            regiao_estoque = int(grupo) if grupo else None
            max_grupo = _max_grupo_por_modulo(modulo_os)
            if not regiao_estoque or regiao_estoque < 1 or regiao_estoque > max_grupo:
                return jsonify({
                    'erro': f'Grupo/Região inválida: {grupo}. Deve ser um número entre 1 e {max_grupo}.'
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                'erro': f'Grupo inválido: {grupo}. Deve ser um número entre 1 e {_max_grupo_por_modulo(modulo_os)}.'
            }), 400
        
        print(f"🗺️  Região do estoque: {regiao_estoque}")
        
        # Resolver detentora_id: aceita id explícito ou busca pelo nome/grupo
        detentora_id = detentora_id or _resolver_detentora_id(modulo_os, grupo, dados.get('detentora'))

        # Criar ordem de serviço
        os = OrdemServico(
            numero_os=numero_os_gerado,
            contrato=dados.get('contrato'),
            data_assinatura=dados.get('dataAssinatura'),
            prazo_vigencia=dados.get('prazoVigencia'),
            detentora=dados.get('detentora'),
            cnpj=dados.get('cnpj'),
            servico=dados.get('servico'),
            modulo=dados.get('modulo') or request.args.get('modulo', 'coffee'),
            grupo=grupo,
            regiao_estoque=regiao_estoque,
            detentora_id=detentora_id,
            evento=dados.get('evento'),
            data=dados.get('data'),
            horario=dados.get('horario'),
            local=dados.get('local'),
            justificativa=dados.get('justificativa'),
            observacoes=dados.get('observacoes'),
            trajeto_origem=dados.get('trajetoOrigem'),
            trajeto_destino=dados.get('trajetoDestino'),
            trajeto_km=dados.get('trajetoKm'),
            trajeto_tipo=dados.get('trajetoTipo'),
            qtd_pessoas_atendidas=dados.get('qtdPessoasAtendidas'),
            gestor_contrato=dados.get('gestorContrato'),
            fiscal_contrato=dados.get('fiscalContrato'),
            fiscal_tipo=dados.get('fiscalTipo', 'Fiscal do Contrato'),
            responsavel=dados.get('responsavel'),
            data_emissao=_parsear_data_emissao(dados.get('dataEmissao')),
            data_emissao_completa=_parsear_data_emissao(dados.get('dataEmissao')).isoformat(),
            signatarios_json=json.dumps(dados['signatarios'], ensure_ascii=False) if dados.get('signatarios') else None
        )
        db.session.add(os)
        db.session.flush()  # Para obter o ID
        
        # Adicionar itens da O.S.
        itens_os = []
        for item_os_data in dados.get('itens', []):
            # Buscar o item no banco de dados pelo ID (não pelo item_codigo!)
            item = Item.query.filter_by(id=item_os_data['itemId']).first()
            if not item:
                db.session.rollback()
                return jsonify({'erro': f'Item {item_os_data["itemId"]} não encontrado'}), 404
            
            # ✅ NOVO: Capturar valor unitário
            valor_unitario = item_os_data.get('valorUnit', item_os_data.get('valorUnit', '0'))
            if isinstance(valor_unitario, (int, float)):
                valor_unitario = str(valor_unitario)
            
            print(f"💰 Item {item_os_data['descricao']}: valorUnit = {valor_unitario} (tipo: {type(valor_unitario).__name__})")
            
            # Criar registro do item na O.S.
            item_os = ItemOrdemServico(
                ordem_servico_id=os.id,
                item_id=item.id,
                categoria=item_os_data['categoria'],
                item_codigo=item_os_data['itemId'],
                item_bec=item_os_data.get('itemBec', ''),
                descricao=item_os_data['descricao'],
                unidade=item_os_data.get('unidade', 'Unidade'),
                diarias=item_os_data.get('diarias') or 1,
                quantidade_solicitada=item_os_data.get('qtdSolicitada'),
                quantidade_total=item_os_data['qtdTotal'],
                valor_unitario=valor_unitario,
                trajeto_origem=item_os_data.get('trajetoOrigem') or None,
                trajeto_destino=item_os_data.get('trajetoDestino') or None,
                trajeto_tipo=item_os_data.get('trajetoTipo') or None,
            )
            db.session.add(item_os)
            itens_os.append(item_os)

        db.session.flush()  # Garantir que os itens tenham IDs
        
        # ✅ PROCESSAR BAIXAS DE ESTOQUE COM VALIDAÇÃO
        try:
            print(f"\n📦 Processando baixas de estoque para região {regiao_estoque}...")
            movimentacoes = processar_baixas_os(
                ordem_servico_id=os.id,
                itens_os=itens_os,
                regiao_numero=regiao_estoque,
                numero_os=numero_os_gerado
            )
            print(f"✅ {len(movimentacoes)} movimentações de estoque registradas com sucesso!")
            
        except (ErroEstoqueInsuficiente, ErroRegiaoInvalida) as e:
            db.session.rollback()
            print(f"❌ ERRO de estoque: {str(e)}")
            return jsonify({'erro': str(e)}), 400
        
        db.session.commit()
        
        # Registrar auditoria
        registrar_auditoria(
            'CREATE',
            'OS',
            f'Criou Ordem de Serviço #{numero_os_gerado} - {os.evento}',
            entidade_tipo='ordens_servico',
            entidade_id=os.id,
            dados_depois=os.to_dict()
        )
        
        print(f"✅ O.S. {numero_os_gerado} criada com sucesso!\n")
        return jsonify(os.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ ERRO ao criar O.S.: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'erro': str(e)}), 500


@os_bp.route('/<int:os_id>', methods=['PUT'])
@login_requerido
def atualizar_ordem(os_id):
    """Atualiza uma ordem de serviço existente COM CONTROLE DE ESTOQUE"""
    # Empresa contratada não pode editar estrutura da O.S.
    if session.get('usuario_perfil') == 'empresa':
        return jsonify({'erro': 'Empresa contratada não tem permissão para editar Ordens de Serviço'}), 403

    try:
        os = OrdemServico.query.get_or_404(os_id)

        # Bloquear edição estrutural se a O.S. já foi enviada ao fluxo da detentora
        status_atual = os.status or 'emitida'
        if status_atual != 'emitida':
            return jsonify({
                'erro': (
                    f'Não é possível editar estruturalmente uma O.S. com status '
                    f'"{STATUS_LABELS.get(status_atual, status_atual)}". '
                    f'Apenas O.S. com status "Emitida" podem ser alteradas.'
                )
            }), 409

        dados = request.get_json()

        # Salvar dados antes para auditoria (com itens)
        dados_antes = os.to_dict(incluir_itens=True)
        
        print(f"\n🔄 Editando O.S. {os.numero_os}...")
        
        # ✅ REVERTER ESTOQUE DOS ITENS ANTIGOS
        print(f"↩️  Revertendo estoque da O.S. {os_id}...")
        total_revertido = reverter_baixa_estoque(os_id)
        print(f"   ✅ {total_revertido} movimentações revertidas!")
        
        # Deletar itens antigos
        for item_os in os.itens:
            db.session.delete(item_os)
        db.session.flush()
        
        # Atualizar dados principais da O.S.
        # NOTA: numero_os NÃO é alterado - é gerado automaticamente na criação
        os.contrato = dados.get('contrato', os.contrato)
        os.data_assinatura = dados.get('dataAssinatura', os.data_assinatura)
        os.prazo_vigencia = dados.get('prazoVigencia', os.prazo_vigencia)
        os.detentora = dados.get('detentora', os.detentora)
        os.cnpj = dados.get('cnpj', os.cnpj)
        os.servico = dados.get('servico', os.servico)
        os.modulo = dados.get('modulo', os.modulo)
        
        # Atualizar grupo e região
        grupo = dados.get('grupo', os.grupo)
        try:
            regiao_estoque = int(grupo) if grupo else os.regiao_estoque
            max_grupo = _max_grupo_por_modulo(os.modulo)
            if not regiao_estoque or regiao_estoque < 1 or regiao_estoque > max_grupo:
                db.session.rollback()
                return jsonify({
                    'erro': f'Grupo/Região inválida: {grupo}. Deve ser um número entre 1 e {max_grupo}.'
                }), 400
        except (ValueError, TypeError):
            db.session.rollback()
            return jsonify({
                'erro': f'Grupo inválido: {grupo}. Deve ser um número entre 1 e {_max_grupo_por_modulo(os.modulo)}.'
            }), 400
        
        os.grupo = grupo
        os.regiao_estoque = regiao_estoque
        
        os.evento = dados.get('evento', os.evento)
        os.data = dados.get('data', os.data)
        os.horario = dados.get('horario', os.horario)
        os.local = dados.get('local', os.local)
        os.justificativa = dados.get('justificativa', os.justificativa)
        os.observacoes = dados.get('observacoes', os.observacoes)
        os.trajeto_origem = dados.get('trajetoOrigem', os.trajeto_origem)
        os.trajeto_destino = dados.get('trajetoDestino', os.trajeto_destino)
        os.trajeto_km = dados.get('trajetoKm', os.trajeto_km)
        os.trajeto_tipo = dados.get('trajetoTipo', os.trajeto_tipo)
        os.qtd_pessoas_atendidas = dados.get('qtdPessoasAtendidas', os.qtd_pessoas_atendidas)
        os.gestor_contrato = dados.get('gestorContrato', os.gestor_contrato)
        os.fiscal_contrato = dados.get('fiscalContrato', os.fiscal_contrato)
        os.fiscal_tipo = dados.get('fiscalTipo', os.fiscal_tipo)
        os.responsavel = dados.get('responsavel', os.responsavel)
        if dados.get('dataEmissao'):
            nova_data = _parsear_data_emissao(dados['dataEmissao'])
            os.data_emissao = nova_data
            os.data_emissao_completa = nova_data.isoformat()
        if dados.get('signatarios'):
            os.signatarios_json = json.dumps(dados['signatarios'], ensure_ascii=False)

        # Atualizar detentora_id se fornecido
        if 'detentoraId' in dados or 'detentora_id' in dados:
            det_id = dados.get('detentoraId') or dados.get('detentora_id')
            os.detentora_id = int(det_id) if det_id else None
        elif not os.detentora_id:
            os.detentora_id = _resolver_detentora_id(os.modulo, os.grupo, os.detentora)

        # Adicionar novos itens
        itens_os = []
        for item_os_data in dados.get('itens', []):
            # Buscar o item no banco de dados pelo ID (não pelo item_codigo!)
            item = Item.query.filter_by(id=item_os_data['itemId']).first()
            if not item:
                db.session.rollback()
                return jsonify({'erro': f'Item {item_os_data["itemId"]} não encontrado'}), 404
            
            # ✅ NOVO: Capturar valor unitário
            valor_unitario = item_os_data.get('valorUnit', item_os_data.get('valorUnit', '0'))
            if isinstance(valor_unitario, (int, float)):
                valor_unitario = str(valor_unitario)
            
            # Criar registro do item na O.S.
            item_os = ItemOrdemServico(
                ordem_servico_id=os.id,
                item_id=item.id,
                categoria=item_os_data['categoria'],
                item_codigo=item_os_data['itemId'],
                item_bec=item_os_data.get('itemBec', ''),
                descricao=item_os_data['descricao'],
                unidade=item_os_data.get('unidade', 'Unidade'),
                diarias=item_os_data.get('diarias') or 1,
                quantidade_solicitada=item_os_data.get('qtdSolicitada'),
                quantidade_total=item_os_data['qtdTotal'],
                valor_unitario=valor_unitario,
                trajeto_origem=item_os_data.get('trajetoOrigem') or None,
                trajeto_destino=item_os_data.get('trajetoDestino') or None,
                trajeto_tipo=item_os_data.get('trajetoTipo') or None,
            )
            db.session.add(item_os)
            itens_os.append(item_os)

        db.session.flush()

        # ✅ PROCESSAR NOVAS BAIXAS DE ESTOQUE
        try:
            print(f"📦 Processando novas baixas de estoque para região {regiao_estoque}...")
            movimentacoes = processar_baixas_os(
                ordem_servico_id=os.id,
                itens_os=itens_os,
                regiao_numero=regiao_estoque,
                numero_os=os.numero_os
            )
            print(f"✅ {len(movimentacoes)} novas movimentações registradas!")
            
        except (ErroEstoqueInsuficiente, ErroRegiaoInvalida) as e:
            db.session.rollback()
            print(f"❌ ERRO de estoque: {str(e)}")
            return jsonify({'erro': str(e)}), 400
        
        db.session.commit()
        
        # Registrar auditoria com dados completos
        registrar_auditoria(
            'UPDATE',
            'OS',
            f'Atualizou Ordem de Serviço #{os.numero_os} - {os.evento}',
            entidade_tipo='ordens_servico',
            entidade_id=os.id,
            dados_antes=dados_antes,
            dados_depois=os.to_dict(incluir_itens=True)
        )
        
        print(f"✅ O.S. {os.numero_os} atualizada com sucesso!\n")
        return jsonify(os.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ ERRO ao atualizar O.S.: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'erro': str(e)}), 500


@os_bp.route('/<int:os_id>', methods=['DELETE'])
@login_requerido
@admin_requerido  # Apenas administradores podem deletar O.S.
def deletar_ordem(os_id):
    """Deleta uma ordem de serviço e reverte o estoque automaticamente"""
    try:
        os = OrdemServico.query.get_or_404(os_id)
        numero_os = os.numero_os
        evento = os.evento

        # Bloquear exclusão se a O.S. já está no fluxo da detentora
        status_atual = os.status or 'emitida'
        if status_atual != 'emitida':
            return jsonify({
                'erro': (
                    f'Não é possível excluir uma O.S. com status '
                    f'"{STATUS_LABELS.get(status_atual, status_atual)}". '
                    f'Apenas O.S. com status "Emitida" podem ser excluídas.'
                )
            }), 409

        # Receber motivo da exclusão
        dados_requisicao = request.get_json() or {}
        motivo_exclusao = dados_requisicao.get('motivo', '').strip()

        if not motivo_exclusao:
            return jsonify({'erro': 'Motivo da exclusão é obrigatório'}), 400
        
        # Salvar dados antes de deletar
        dados_antes = os.to_dict()
        
        print(f"\n🗑️  Deletando O.S. {numero_os}...")
        print(f"   Motivo: {motivo_exclusao}")
        
        # ✅ REVERTER ESTOQUE ANTES DE DELETAR
        print(f"↩️  Revertendo estoque da O.S. {os_id}...")
        total_revertido = reverter_baixa_estoque(os_id)
        print(f"   ✅ {total_revertido} movimentações revertidas!")
        
        # ✅ Registrar motivo e data de exclusão antes de deletar
        os.motivo_exclusao = motivo_exclusao
        os.data_exclusao = get_datetime_br()
        
        # As movimentações serão deletadas automaticamente devido ao CASCADE
        db.session.delete(os)
        db.session.commit()
        
        # Registrar auditoria com motivo
        registrar_auditoria(
            'DELETE',
            'OS',
            f'Deletou Ordem de Serviço #{numero_os} - {evento}\nMotivo: {motivo_exclusao}',
            entidade_tipo='ordens_servico',
            entidade_id=os_id,
            dados_antes=dados_antes
        )
        
        print(f"✅ O.S. {numero_os} deletada com sucesso!\n")
        return jsonify({
            'mensagem': f'O.S. {numero_os} deletada com sucesso',
            'numeroOS': numero_os,
            'motivo': motivo_exclusao
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ ERRO ao deletar O.S.: {str(e)}")
        return jsonify({'erro': str(e)}), 500


@os_bp.route('/estoque/regiao/<int:regiao>', methods=['GET'])
@login_requerido
def relatorio_estoque_regiao(regiao):
    """Retorna relatório de estoque de uma região específica"""
    try:
        relatorio = obter_relatorio_estoque_por_regiao(regiao)
        return jsonify({
            'regiao': regiao,
            'itens': relatorio
        }), 200
    
    except ErroRegiaoInvalida as e:
        return jsonify({'erro': str(e)}), 400
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@os_bp.route('/estatisticas', methods=['GET'])
@login_requerido
def estatisticas():
    """Retorna estatísticas sobre ordens de serviço"""
    try:
        total_os = OrdemServico.query.count()
        
        # Total de itens consumidos
        total_itens = db.session.query(
            db.func.sum(ItemOrdemServico.quantidade_total)
        ).scalar() or 0
        
        # Últimas 5 ordens
        ultimas = OrdemServico.query.order_by(
            OrdemServico.data_emissao.desc()
        ).limit(5).all()
        
        return jsonify({
            'total_ordens': total_os,
            'total_itens_consumidos': float(total_itens),
            'ultimas_ordens': [os.to_dict(incluir_itens=False) for os in ultimas]
        }), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@os_bp.route('/<int:os_id>/pdf', methods=['GET'])
@login_requerido
def gerar_pdf_ordem(os_id):
    """
    Gera PDF da Ordem de Serviço com texto selecionável (não imagem)
    Permite fácil conversão para Excel posteriormente
    
    Query Parameters:
        - print=true: Abre PDF inline no navegador para impressão (em vez de download)
    """
    try:
        # Buscar O.S.
        os = OrdemServico.query.get_or_404(os_id)
        
        dados_pdf = os.to_dict(incluir_itens=True)
        dados_pdf['aceites'] = [a.to_dict() for a in os.aceites]

        # Gerar PDF
        pdf_buffer = gerar_pdf_os(dados_pdf)
        
        filename = _nome_arquivo_os(dados_pdf, 'pdf')
        
        # Verificar se é para impressão (inline) ou download
        is_print = request.args.get('print', 'false').lower() == 'true'
        
        # Retornar PDF com headers para evitar cache
        response = send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=not is_print,  # Se print=true, abre inline; senão, baixa
            download_name=filename
        )
        
        # Headers para evitar cache
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        
        return response
    
    except Exception as e:
        print(f"❌ Erro ao gerar PDF: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'erro': str(e)}), 500


@os_bp.route('/<int:os_id>/png', methods=['GET'])
@login_requerido
def baixar_png_os(os_id):
    """Gera PNG da OS (imagem) para upload e assinatura no SEI."""
    try:
        import fitz  # PyMuPDF
        from io import BytesIO as _BytesIO

        db.session.expire_all()  # garante dados frescos do banco
        os_obj = db.session.get(OrdemServico, os_id)
        if os_obj is None:
            return jsonify({'erro': 'Ordem de Serviço não encontrada'}), 404
        dados_pdf = os_obj.to_dict(incluir_itens=True)
        dados_pdf['aceites'] = [a.to_dict() for a in os_obj.aceites]

        pdf_buffer = gerar_pdf_os(dados_pdf)
        pdf_bytes = pdf_buffer.read() if hasattr(pdf_buffer, 'read') else pdf_buffer.getvalue()

        from PIL import Image as _PILImage

        doc = fitz.open(stream=pdf_bytes, filetype='pdf')
        mat = fitz.Matrix(2.0, 2.0)  # 2× zoom → ~144 dpi

        imagens_pil = []
        for page in doc:
            pix = page.get_pixmap(matrix=mat, alpha=False)
            img = _PILImage.frombytes('RGB', (pix.width, pix.height), pix.samples)
            imagens_pil.append(img)
        doc.close()

        largura = max(i.width for i in imagens_pil)
        altura_total = sum(i.height for i in imagens_pil)
        combinado = _PILImage.new('RGB', (largura, altura_total), (255, 255, 255))
        y_off = 0
        for img in imagens_pil:
            combinado.paste(img, (0, y_off))
            y_off += img.height

        buf_png = _BytesIO()
        combinado.save(buf_png, format='PNG', optimize=False)
        buf_png.seek(0)
        png_bytes = buf_png.read()

        png_filename = _nome_arquivo_os(dados_pdf, 'png')
        response = send_file(
            _BytesIO(png_bytes),
            mimetype='image/png',
            as_attachment=True,
            download_name=png_filename
        )
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'erro': str(e)}), 500


@os_bp.route('/<int:os_id>/itens/<int:item_id>/trajeto', methods=['PUT'])
@login_requerido
@admin_requerido
@csrf_protegido
def atualizar_trajeto_item(os_id, item_id):
    """Atualiza origem, destino e tipo de trajeto de um item de OS (admin)."""
    try:
        from models import ItemOrdemServico
        item = ItemOrdemServico.query.filter_by(id=item_id, ordem_servico_id=os_id).first()
        if not item:
            return jsonify({'erro': 'Item não encontrado nesta OS'}), 404

        dados = request.get_json() or {}
        if 'trajetoOrigem' in dados:
            item.trajeto_origem = dados['trajetoOrigem'] or None
        if 'trajetoDestino' in dados:
            item.trajeto_destino = dados['trajetoDestino'] or None
        if 'trajetoTipo' in dados:
            item.trajeto_tipo = dados['trajetoTipo'] or None

        db.session.commit()
        registrar_auditoria(
            'UPDATE', 'OS',
            f'Atualizou trajeto do item #{item_id} da OS #{os_id}',
            entidade_tipo='itens_ordem_servico',
            entidade_id=item_id,
            dados_depois={'trajetoOrigem': item.trajeto_origem,
                          'trajetoDestino': item.trajeto_destino,
                          'trajetoTipo': item.trajeto_tipo}
        )
        return jsonify({'sucesso': True, 'item': item.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500


@os_bp.route('/<int:os_id>/pagamento', methods=['PUT'])
@login_requerido
@csrf_protegido
def atualizar_pagamento(os_id):
    """Atualiza dados de pagamento da O.S. (vencimento e pago)."""
    try:
        os_obj = OrdemServico.query.get_or_404(os_id)
        dados = request.get_json() or {}

        vencimento = (dados.get('pagamentoVencimento') or '').strip() or None
        pago = dados.get('pagamentoPago')

        os_obj.pagamento_vencimento = vencimento
        if pago is not None:
            os_obj.pagamento_pago = bool(pago)

        db.session.commit()

        registrar_auditoria(
            'UPDATE',
            'OS',
            f'Atualizou pagamento da O.S. #{os_obj.numero_os}',
            entidade_tipo='ordens_servico',
            entidade_id=os_obj.id,
            dados_depois={
                'pagamentoVencimento': os_obj.pagamento_vencimento,
                'pagamentoPago': os_obj.pagamento_pago
            }
        )

        return jsonify({'sucesso': True, 'os': os_obj.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500


# ============================================================
# PORTAL DA DETENTORA — endpoints do operador interno
# ============================================================

@os_bp.route('/<int:os_id>/enviar-empresa', methods=['POST'])
@login_requerido
@admin_requerido
@csrf_protegido
def enviar_para_empresa(os_id):
    """
    Operador envia a O.S. para aceite da detentora.
    Transição: emitida → enviada_empresa.
    A O.S. deve ter detentora_id preenchido.
    """
    os_obj = OrdemServico.query.get_or_404(os_id)

    # Aceitar detentora_id no payload para vincular na hora do envio
    dados = request.get_json(silent=True) or {}
    if not os_obj.detentora_id and dados.get('detentora_id'):
        os_obj.detentora_id = int(dados['detentora_id'])

    if not os_obj.detentora_id:
        return jsonify({'erro': 'Selecione a detentora antes de enviar.'}), 400

    usuario_portal = Usuario.query.filter_by(
        detentora_id=os_obj.detentora_id, perfil='empresa', ativo=True
    ).first()
    if not usuario_portal:
        detentora = Detentora.query.get(os_obj.detentora_id)
        nome_det = detentora.nome if detentora else 'esta detentora'
        return jsonify({
            'erro': f'A detentora "{nome_det}" não possui usuário ativo no portal. '
                    f'Acesse Gerenciar Usuários e crie um usuário com perfil "Empresa" vinculado a ela antes de enviar.'
        }), 400

    status_atual = os_obj.status or 'emitida'
    if not status_transicao_valida(status_atual, 'enviada_empresa'):
        return jsonify({
            'erro': f'Transição inválida: {STATUS_LABELS.get(status_atual, status_atual)} → Enviada à Empresa'
        }), 400

    dados_antes = {'status': status_atual}
    os_obj.status = 'enviada_empresa'

    db.session.commit()

    registrar_auditoria(
        'UPDATE', 'OS',
        f'O.S. #{os_obj.numero_os} enviada para aceite da detentora',
        entidade_tipo='ordens_servico',
        entidade_id=os_obj.id,
        dados_antes=dados_antes,
        dados_depois={'status': 'enviada_empresa'}
    )

    return jsonify({
        'sucesso': True,
        'status': os_obj.status,
        'statusLabel': STATUS_LABELS['enviada_empresa']
    }), 200


@os_bp.route('/<int:os_id>/reenviar-empresa', methods=['POST'])
@login_requerido
@admin_requerido
@csrf_protegido
def reenviar_para_empresa(os_id):
    """
    Operador reenvia a O.S. após revisão solicitada pela detentora.
    Transição: em_revisao → enviada_empresa.
    Usado quando o operador corrigiu o que foi apontado na revisão.
    """
    os_obj = OrdemServico.query.get_or_404(os_id)

    status_atual = os_obj.status or 'emitida'
    if not status_transicao_valida(status_atual, 'enviada_empresa'):
        return jsonify({
            'erro': f'Transição inválida: {STATUS_LABELS.get(status_atual, status_atual)} → Enviada à Empresa. '
                    f'Apenas O.S. em revisão podem ser reenviadas.'
        }), 400

    dados_antes = {'status': status_atual}
    os_obj.status = 'enviada_empresa'
    db.session.commit()

    registrar_auditoria(
        'UPDATE', 'OS',
        f'O.S. #{os_obj.numero_os} reenviada para aceite da detentora após revisão',
        entidade_tipo='ordens_servico',
        entidade_id=os_obj.id,
        dados_antes=dados_antes,
        dados_depois={'status': 'enviada_empresa'}
    )

    return jsonify({
        'sucesso': True,
        'status': os_obj.status,
        'statusLabel': STATUS_LABELS['enviada_empresa']
    }), 200


@os_bp.route('/<int:os_id>/atividade-portal', methods=['GET'])
@login_requerido
@admin_requerido
def atividade_portal(os_id):
    """
    Retorna o histórico completo de atividade do portal para uma O.S.:
    revisões, comentários da empresa e aceites.
    Acessível apenas para admin/operador interno.
    """
    from models import RevisaoEmpresa, ComentarioEmpresa, AceiteEmpresa

    os_obj = OrdemServico.query.get_or_404(os_id)

    revisoes = RevisaoEmpresa.query.filter_by(ordem_servico_id=os_id).order_by(RevisaoEmpresa.criado_em).all()
    comentarios = ComentarioEmpresa.query.filter_by(ordem_servico_id=os_id).order_by(ComentarioEmpresa.criado_em).all()
    aceites = AceiteEmpresa.query.filter_by(ordem_servico_id=os_id).all()

    return jsonify({
        'os_id': os_id,
        'status': os_obj.status or 'emitida',
        'numero_os': os_obj.numero_os,
        'evento': os_obj.evento,
        'revisoes': [r.to_dict() for r in revisoes],
        'comentarios': [c.to_dict() for c in comentarios],
        'aceites': [a.to_dict() for a in aceites],
    }), 200


@os_bp.route('/<int:os_id>/cancelar', methods=['POST'])
@login_requerido
@admin_requerido
@csrf_protegido
def cancelar_ordem(os_id):
    """
    Cancela uma O.S. após aceite da detentora. Somente admin.
    Status aceita | em_execucao → cancelada (terminal).
    A O.S. não pode ser editada nem reativada após cancelamento.

    Body JSON:
      - motivo: str (obrigatório)
    """
    os_obj = OrdemServico.query.get_or_404(os_id)
    status_atual = os_obj.status or 'emitida'

    if status_atual not in ('aceita', 'em_execucao'):
        return jsonify({
            'erro': f'Só é possível cancelar O.S. com status "Aceita" ou "Em Execução". '
                    f'Status atual: "{STATUS_LABELS.get(status_atual, status_atual)}".'
        }), 400

    dados = request.get_json() or {}
    motivo = (dados.get('motivo') or '').strip()
    if not motivo:
        return jsonify({'erro': 'O motivo do cancelamento é obrigatório.'}), 400
    if len(motivo) > 1000:
        return jsonify({'erro': 'motivo deve ter no máximo 1000 caracteres'}), 400

    os_obj.status = 'cancelada'
    db.session.commit()

    registrar_auditoria(
        'UPDATE', 'OS',
        f'O.S. #{os_obj.numero_os} cancelada pelo admin após aceite — motivo: {motivo}',
        entidade_tipo='ordens_servico',
        entidade_id=os_id,
        dados_antes={'status': status_atual},
        dados_depois={'status': 'cancelada', 'motivo': motivo}
    )

    return jsonify({'sucesso': True, 'status': 'cancelada'}), 200


@os_bp.route('/<int:os_id>/comentar', methods=['POST'])
@login_requerido
@csrf_protegido
def comentar_os(os_id):
    """
    Operador/admin adiciona comentário visível também para a empresa detentora.
    Usa o detentora_id da própria O.S. para manter o thread compartilhado.

    Body JSON:
      - texto: str (obrigatório)
    """
    from models import ComentarioEmpresa, get_datetime_br

    os_obj = OrdemServico.query.get_or_404(os_id)

    if not os_obj.detentora_id:
        return jsonify({'erro': 'Esta O.S. ainda não possui detentora vinculada'}), 400

    dados = request.get_json() or {}
    texto = (dados.get('texto') or '').strip()
    if not texto:
        return jsonify({'erro': 'texto é obrigatório'}), 400
    if len(texto) > 2000:
        return jsonify({'erro': 'texto deve ter no máximo 2000 caracteres'}), 400

    comentario = ComentarioEmpresa(
        ordem_servico_id=os_id,
        usuario_id=session['usuario_id'],
        detentora_id=os_obj.detentora_id,
        texto=texto,
        criado_em=get_datetime_br()
    )
    db.session.add(comentario)
    db.session.commit()

    registrar_auditoria(
        'CREATE', 'COMENTARIO_OS',
        f'Operador comentou na O.S. #{os_obj.numero_os}',
        entidade_tipo='comentarios_empresa',
        entidade_id=comentario.id,
        dados_depois=comentario.to_dict()
    )

    return jsonify({'sucesso': True, 'comentario': comentario.to_dict()}), 201


@os_bp.route('/monitoramento', methods=['GET'])
@login_requerido
@admin_requerido
def monitoramento_aceite():
    """
    Painel consolidado do operador: O.S. enviadas para detentoras.
    Exibe status: enviada_empresa, em_revisao, aceita, em_execucao, executada, recusada.

    Filtros (query params):
      - status: filtra por um ou mais status (separados por vírgula)
      - modulo: ex. 'coffee'
      - grupo: ex. '1'
      - detentora_id: ID da detentora
      - data_inicio / data_fim: período pela data de emissão (YYYY-MM-DD)
    """
    try:
        status_filtro = request.args.get('status', '')
        modulo = request.args.get('modulo', '')
        grupo = request.args.get('grupo', '')
        detentora_id = request.args.get('detentora_id', '')
        data_inicio = request.args.get('data_inicio', '')
        data_fim = request.args.get('data_fim', '')

        # Excluir O.S. ainda não enviadas
        statuses_monitoramento = [
            'enviada_empresa', 'em_revisao', 'aceita',
            'em_execucao', 'executada', 'recusada'
        ]

        query = OrdemServico.query.filter(OrdemServico.status.in_(statuses_monitoramento))

        if status_filtro:
            statuses = [s.strip() for s in status_filtro.split(',') if s.strip()]
            query = query.filter(OrdemServico.status.in_(statuses))

        if modulo:
            query = query.filter_by(modulo=modulo)

        if grupo:
            query = query.filter_by(grupo=grupo)

        if detentora_id:
            query = query.filter_by(detentora_id=int(detentora_id))

        if data_inicio:
            query = query.filter(OrdemServico.data_emissao >= datetime.fromisoformat(data_inicio))

        if data_fim:
            query = query.filter(OrdemServico.data_emissao <= datetime.fromisoformat(data_fim + 'T23:59:59'))

        ordens = query.order_by(OrdemServico.data_emissao.desc(), OrdemServico.id.desc()).all()

        # Montar resposta com resumo de aceite
        resultado = []
        for os_obj in ordens:
            item = os_obj.to_dict(incluir_itens=False)
            item['statusLabel'] = STATUS_LABELS.get(os_obj.status, os_obj.status)

            # Último aceite registrado (se houver)
            if os_obj.aceites:
                ultimo_aceite = max(os_obj.aceites, key=lambda a: a.data_hora or datetime.min)
                item['ultimoAceite'] = {
                    'nomeResponsavel': ultimo_aceite.nome_responsavel,
                    'dataHora': ultimo_aceite.data_hora.isoformat() if ultimo_aceite.data_hora else None,
                }
            else:
                item['ultimoAceite'] = None

            item['totalRevisoes'] = len(os_obj.revisoes)
            item['totalComentarios'] = len(os_obj.comentarios)
            resultado.append(item)

        # Totais por status para o dashboard
        totais = {}
        for st in statuses_monitoramento:
            totais[st] = sum(1 for r in resultado if r['status'] == st)

        return jsonify({
            'ordens': resultado,
            'totais': totais,
            'total': len(resultado)
        }), 200

    except Exception as e:
        return jsonify({'erro': str(e)}), 500
