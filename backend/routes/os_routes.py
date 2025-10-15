from flask import Blueprint, request, jsonify, send_file
from models import db, OrdemServico, ItemOrdemServico, Item, EstoqueRegional, Categoria
from datetime import datetime
from sqlalchemy import func
from pdf_generator import gerar_pdf_os

os_bp = Blueprint('ordens_servico', __name__)

def gerar_proximo_numero_os():
    """Gera automaticamente o próximo número de O.S. no formato N/ANO"""
    ano_atual = datetime.now().year
    
    # Buscar o último número do ano atual
    ultima_os = OrdemServico.query.filter(
        OrdemServico.numero_os.like(f'%/{ano_atual}')
    ).order_by(OrdemServico.id.desc()).first()
    
    if ultima_os:
        # Extrair o número da última O.S. (formato: "N/ANO")
        try:
            numero_atual = int(ultima_os.numero_os.split('/')[0])
            proximo_numero = numero_atual + 1
        except (ValueError, IndexError):
            # Se não conseguir extrair, começar do 1
            proximo_numero = 1
    else:
        # Primeira O.S. do ano
        proximo_numero = 1
    
    return f"{proximo_numero}/{ano_atual}"

@os_bp.route('/proximo-numero', methods=['GET'])
def obter_proximo_numero():
    """Retorna o próximo número de O.S. disponível"""
    try:
        proximo_numero = gerar_proximo_numero_os()
        return jsonify({'proximoNumero': proximo_numero}), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@os_bp.route('/', methods=['GET'])
def listar_ordens():
    """Lista todas as ordens de serviço"""
    try:
        busca = request.args.get('busca', '')
        
        query = OrdemServico.query
        
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
def obter_ordem(os_id):
    """Obtém uma ordem de serviço específica"""
    try:
        os = OrdemServico.query.get_or_404(os_id)
        return jsonify(os.to_dict()), 200
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 404


@os_bp.route('/', methods=['POST'])
def criar_ordem():
    """Cria uma nova ordem de serviço e atualiza estoque"""
    try:
        dados = request.json
        
        # DEBUG: Imprimir dados recebidos
        print("\n" + "="*60)
        print("📥 DADOS RECEBIDOS NA API - POST /ordens-servico/")
        print("="*60)
        print(f"Itens recebidos: {len(dados.get('itens', []))}")
        for idx, item in enumerate(dados.get('itens', []), 1):
            print(f"\nItem {idx}:")
            print(f"  Descrição: {item.get('descricao', 'N/A')}")
            print(f"  Diárias: {item.get('diarias', 'MISSING')}")
            print(f"  Qtd Solicitada: {item.get('qtdSolicitada', 'MISSING')}")
            print(f"  Qtd Total: {item.get('qtdTotal', 'MISSING')}")
        print("="*60 + "\n")
        
        # Gerar próximo número automaticamente (ignorar o enviado pelo frontend)
        numero_os_gerado = gerar_proximo_numero_os()
        print(f"🔢 Número da O.S. gerado automaticamente: {numero_os_gerado}")
        
        # Criar ordem de serviço
        os = OrdemServico(
            numero_os=numero_os_gerado,  # ✅ Usar número gerado
            contrato=dados.get('contrato'),
            data_assinatura=dados.get('dataAssinatura'),
            prazo_vigencia=dados.get('prazoVigencia'),
            detentora=dados.get('detentora'),
            cnpj=dados.get('cnpj'),
            servico=dados.get('servico'),
            grupo=dados.get('grupo'),
            evento=dados.get('evento'),
            data=dados.get('data'),
            horario=dados.get('horario'),
            local=dados.get('local'),
            justificativa=dados.get('justificativa'),
            observacoes=dados.get('observacoes'),  # ✅ Adicionar observações
            gestor_contrato=dados.get('gestorContrato'),
            fiscal_contrato=dados.get('fiscalContrato'),
            fiscal_tipo=dados.get('fiscalTipo', 'Fiscal do Contrato'),  # ✅ Adicionar tipo de fiscal
            responsavel=dados.get('responsavel'),
            data_emissao_completa=datetime.now().isoformat()
        )
        db.session.add(os)
        db.session.flush()  # Para obter o ID
        
        # Adicionar itens da O.S. e atualizar estoque
        for item_os_data in dados.get('itens', []):
            # Buscar o item no banco de dados
            item = Item.query.filter_by(item_codigo=item_os_data['itemId']).first()
            if not item:
                db.session.rollback()
                return jsonify({'erro': f'Item {item_os_data["itemId"]} não encontrado'}), 404
            
            # Criar registro do item na O.S.
            item_os = ItemOrdemServico(
                ordem_servico_id=os.id,
                item_id=item.id,  # ID do item no banco
                categoria=item_os_data['categoria'],
                item_codigo=item_os_data['itemId'],
                item_bec=item_os_data.get('itemBec', ''),  # Código BEC
                descricao=item_os_data['descricao'],
                unidade=item_os_data.get('unidade', 'Unidade'),
                diarias=item_os_data.get('diarias', 1),  # Multiplicador de diárias
                quantidade_solicitada=item_os_data.get('qtdSolicitada'),  # Qtd por diária
                quantidade_total=item_os_data['qtdTotal']  # Qtd total
            )
            db.session.add(item_os)
            
            # Atualizar estoque
            atualizar_estoque_item(
                categoria_nome=item_os_data['categoria'],
                item_codigo=item_os_data['itemId'],
                quantidade=item_os_data['qtdTotal']
            )
        
        db.session.commit()
        return jsonify(os.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500


def atualizar_estoque_item(categoria_nome, item_codigo, quantidade):
    """Função auxiliar para atualizar estoque ao emitir O.S."""
    # Buscar categoria
    categoria = Categoria.query.filter_by(nome=categoria_nome).first()
    if not categoria:
        return
    
    # Buscar item
    item = Item.query.filter_by(
        categoria_id=categoria.id,
        item_codigo=item_codigo
    ).first()
    
    if not item:
        return
    
    # Buscar regiões com estoque disponível
    estoques = EstoqueRegional.query.filter_by(item_id=item.id).all()
    
    regioes_disponiveis = []
    for est in estoques:
        try:
            inicial = float(est.quantidade_inicial.replace('.', '').replace(',', '.'))
            gasto = float(est.quantidade_gasto.replace('.', '').replace(',', '.'))
            if inicial > 0 and (inicial - gasto) > 0:
                regioes_disponiveis.append(est)
        except:
            continue
    
    # Distribuir quantidade entre regiões
    if regioes_disponiveis:
        qtd_por_regiao = quantidade / len(regioes_disponiveis)
        
        for est in regioes_disponiveis:
            try:
                gasto_atual = float(est.quantidade_gasto.replace('.', '').replace(',', '.'))
                novo_gasto = gasto_atual + qtd_por_regiao
                est.quantidade_gasto = str(novo_gasto).replace('.', ',')
            except:
                continue


@os_bp.route('/<int:os_id>', methods=['PUT'])
def atualizar_ordem(os_id):
    """Atualiza uma ordem de serviço existente"""
    try:
        os = OrdemServico.query.get_or_404(os_id)
        dados = request.get_json()
        
        # Reverter estoque dos itens antigos
        for item_os in os.itens:
            reverter_estoque_item(
                categoria_nome=item_os.categoria,
                item_codigo=item_os.item_codigo,
                quantidade=item_os.quantidade_total
            )
        
        # Deletar itens antigos
        for item_os in os.itens:
            db.session.delete(item_os)
        
        # Atualizar dados principais da O.S.
        # NOTA: numero_os NÃO é alterado - é gerado automaticamente na criação
        os.contrato = dados.get('contrato', os.contrato)
        os.data_assinatura = dados.get('dataAssinatura', os.data_assinatura)
        os.prazo_vigencia = dados.get('prazoVigencia', os.prazo_vigencia)
        os.detentora = dados.get('detentora', os.detentora)
        os.cnpj = dados.get('cnpj', os.cnpj)
        os.servico = dados.get('servico', os.servico)
        os.grupo = dados.get('grupo', os.grupo)
        os.evento = dados.get('evento', os.evento)
        os.data = dados.get('data', os.data)
        os.horario = dados.get('horario', os.horario)
        os.local = dados.get('local', os.local)
        os.justificativa = dados.get('justificativa', os.justificativa)
        os.observacoes = dados.get('observacoes', os.observacoes)  # ✅ Adicionar observações
        os.gestor_contrato = dados.get('gestorContrato', os.gestor_contrato)
        os.fiscal_contrato = dados.get('fiscalContrato', os.fiscal_contrato)
        os.fiscal_tipo = dados.get('fiscalTipo', os.fiscal_tipo)  # ✅ Adicionar tipo de fiscal
        os.responsavel = dados.get('responsavel', os.responsavel)
        
        # Adicionar novos itens e atualizar estoque
        for item_os_data in dados.get('itens', []):
            # Buscar o item no banco de dados
            item = Item.query.filter_by(item_codigo=item_os_data['itemId']).first()
            if not item:
                db.session.rollback()
                return jsonify({'erro': f'Item {item_os_data["itemId"]} não encontrado'}), 404
            
            # Criar registro do item na O.S.
            item_os = ItemOrdemServico(
                ordem_servico_id=os.id,
                item_id=item.id,
                categoria=item_os_data['categoria'],
                item_codigo=item_os_data['itemId'],
                item_bec=item_os_data.get('itemBec', ''),  # Código BEC
                descricao=item_os_data['descricao'],
                unidade=item_os_data.get('unidade', 'Unidade'),
                diarias=item_os_data.get('diarias', 1),  # Multiplicador de diárias
                quantidade_solicitada=item_os_data.get('qtdSolicitada'),  # Qtd por diária
                quantidade_total=item_os_data['qtdTotal']  # Qtd total
            )
            db.session.add(item_os)
            
            # Atualizar estoque com nova quantidade
            atualizar_estoque_item(
                categoria_nome=item_os_data['categoria'],
                item_codigo=item_os_data['itemId'],
                quantidade=item_os_data['qtdTotal']
            )
        
        db.session.commit()
        
        return jsonify(os.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500


@os_bp.route('/<int:os_id>', methods=['DELETE'])
def deletar_ordem(os_id):
    """Deleta uma ordem de serviço (opcional: reverter estoque)"""
    try:
        os = OrdemServico.query.get_or_404(os_id)
        
        # Opcional: reverter estoque antes de deletar
        reverter = request.args.get('reverter_estoque', 'false').lower() == 'true'
        
        if reverter:
            for item_os in os.itens:
                reverter_estoque_item(
                    categoria_nome=item_os.categoria,
                    item_codigo=item_os.item_codigo,
                    quantidade=item_os.quantidade_total
                )
        
        db.session.delete(os)
        db.session.commit()
        return jsonify({'mensagem': 'O.S. deletada com sucesso'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500


def reverter_estoque_item(categoria_nome, item_codigo, quantidade):
    """Função auxiliar para reverter estoque ao deletar O.S."""
    categoria = Categoria.query.filter_by(nome=categoria_nome).first()
    if not categoria:
        return
    
    item = Item.query.filter_by(
        categoria_id=categoria.id,
        item_codigo=item_codigo
    ).first()
    
    if not item:
        return
    
    estoques = EstoqueRegional.query.filter_by(item_id=item.id).all()
    
    if estoques:
        qtd_por_regiao = quantidade / len(estoques)
        
        for est in estoques:
            try:
                gasto_atual = float(est.quantidade_gasto.replace('.', '').replace(',', '.'))
                novo_gasto = max(0, gasto_atual - qtd_por_regiao)
                est.quantidade_gasto = str(novo_gasto).replace('.', ',')
            except:
                continue


@os_bp.route('/estatisticas', methods=['GET'])
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
        
        # Retornar PDF
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=not is_print,  # Se print=true, abre inline; senão, baixa
            download_name=filename
        )
    
    except Exception as e:
        print(f"❌ Erro ao gerar PDF: {e}")
        return jsonify({'erro': str(e)}), 500
