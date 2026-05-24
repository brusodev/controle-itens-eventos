from flask import Blueprint, request, jsonify, send_file
from models import db, OrdemServico, ItemOrdemServico, Item, EstoqueRegional, Categoria, MovimentacaoEstoque, get_datetime_br
from datetime import datetime
from sqlalchemy import func
from pdf_generator import gerar_pdf_os
from routes.auth_routes import login_requerido, admin_requerido  # ✅ Importar decorators
from utils.auditoria import registrar_auditoria
import sys
import os
import json

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


def gerar_proximo_numero_os(modulo=None):
    """Gera automaticamente o próximo número de O.S. no formato N/ANO, por módulo"""
    ano_atual = datetime.now().year

    # Buscar o último número do ano atual para o módulo específico
    query = OrdemServico.query.filter(
        OrdemServico.numero_os.like(f'%/{ano_atual}')
    )
    if modulo:
        query = query.filter(OrdemServico.modulo == modulo)

    ultima_os = query.order_by(OrdemServico.id.desc()).first()

    if ultima_os:
        # Extrair o número da última O.S. (formato: "N/ANO")
        try:
            numero_atual = int(ultima_os.numero_os.split('/')[0])
            proximo_numero = numero_atual + 1
        except (ValueError, IndexError):
            proximo_numero = 1
    else:
        # Primeira O.S. do ano para este módulo
        proximo_numero = 1

    return f"{proximo_numero}/{ano_atual}"


@os_bp.route('/proximo-numero', methods=['GET'])
@login_requerido
def obter_proximo_numero():
    """Retorna o próximo número de O.S. disponível para o módulo"""
    try:
        modulo = request.args.get('modulo', 'coffee')
        proximo_numero = gerar_proximo_numero_os(modulo)
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
        
        if busca:
            query = query.filter(
                db.or_(
                    OrdemServico.numero_os.ilike(f'%{busca}%'),
                    OrdemServico.evento.ilike(f'%{busca}%'),
                    OrdemServico.detentora.ilike(f'%{busca}%')
                )
            )
        
        ordens = query.order_by(OrdemServico.data_emissao.desc()).all()
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
        
        # Gerar próximo número automaticamente (por módulo)
        modulo_os = dados.get('modulo') or request.args.get('modulo', 'coffee')
        numero_os_gerado = gerar_proximo_numero_os(modulo_os)
        print(f"🔢 Número da O.S. gerado automaticamente: {numero_os_gerado}")
        
        # ✅ VALIDAR E OBTER REGIÃO DO GRUPO
        grupo = dados.get('grupo')
        try:
            regiao_estoque = int(grupo) if grupo else None
            if not regiao_estoque or regiao_estoque < 1 or regiao_estoque > 6:
                return jsonify({
                    'erro': f'Grupo/Região inválida: {grupo}. Deve ser um número entre 1 e 6.'
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                'erro': f'Grupo inválido: {grupo}. Deve ser um número entre 1 e 6.'
            }), 400
        
        print(f"🗺️  Região do estoque: {regiao_estoque}")
        
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
            regiao_estoque=regiao_estoque,  # ✅ VINCULAR REGIÃO
            evento=dados.get('evento'),
            data=dados.get('data'),
            horario=dados.get('horario'),
            local=dados.get('local'),
            justificativa=dados.get('justificativa'),
            observacoes=dados.get('observacoes'),
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
                valor_unitario=valor_unitario  # ✅ NOVO: Salvar valor unitário
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
    try:
        os = OrdemServico.query.get_or_404(os_id)
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
            if not regiao_estoque or regiao_estoque < 1 or regiao_estoque > 6:
                db.session.rollback()
                return jsonify({
                    'erro': f'Grupo/Região inválida: {grupo}. Deve ser um número entre 1 e 6.'
                }), 400
        except (ValueError, TypeError):
            db.session.rollback()
            return jsonify({
                'erro': f'Grupo inválido: {grupo}. Deve ser um número entre 1 e 6.'
            }), 400
        
        os.grupo = grupo
        os.regiao_estoque = regiao_estoque
        
        os.evento = dados.get('evento', os.evento)
        os.data = dados.get('data', os.data)
        os.horario = dados.get('horario', os.horario)
        os.local = dados.get('local', os.local)
        os.justificativa = dados.get('justificativa', os.justificativa)
        os.observacoes = dados.get('observacoes', os.observacoes)
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
                valor_unitario=valor_unitario  # ✅ NOVO: Salvar valor unitário
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
@admin_requerido  # ✅ Apenas administradores podem deletar O.S.
def deletar_ordem(os_id):
    """Deleta uma ordem de serviço e reverte o estoque automaticamente"""
    try:
        os = OrdemServico.query.get_or_404(os_id)
        numero_os = os.numero_os
        evento = os.evento
        
        # ✅ Receber motivo da exclusão
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
        
        # Preparar dados para o PDF
        dados_pdf = os.to_dict(incluir_itens=True)
        
        # Gerar PDF
        pdf_buffer = gerar_pdf_os(dados_pdf)
        
        # Nome do arquivo
        numero_os_limpo = dados_pdf['numeroOS'].replace('/', '-')
        filename = f"OS_{numero_os_limpo}.pdf"
        
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
