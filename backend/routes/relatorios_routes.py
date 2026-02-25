"""
Routes para geração de relatórios do sistema
"""
from flask import Blueprint, jsonify, request, send_file
from models import db, OrdemServico, ItemOrdemServico, Item, EstoqueRegional, MovimentacaoEstoque, Categoria
from datetime import datetime
from io import BytesIO
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from sqlalchemy import func

from routes.auth_routes import login_requerido

relatorios_bp = Blueprint('relatorios', __name__)


@relatorios_bp.route('/api/relatorios/ordens-servico', methods=['GET'])
@login_requerido
def relatorio_ordens_servico():
    """
    Relatório de Ordens de Serviço com filtros opcionais:
    - data_inicio, data_fim
    - regiao (1-6)
    - contratada
    - servico
    - modulo
    """
    try:
        modulo = request.args.get('modulo', 'coffee')
        query = OrdemServico.query.filter_by(modulo=modulo)
        
        # Filtros
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        regiao = request.args.get('regiao')
        contratada = request.args.get('contratada')
        servico = request.args.get('servico')
        
        if data_inicio:
            query = query.filter(OrdemServico.data_emissao >= datetime.strptime(data_inicio, '%Y-%m-%d'))
        if data_fim:
            # ✅ Ajustar para o final do dia (23:59:59) para incluir registros de hoje
            dt_fim = datetime.strptime(data_fim, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
            query = query.filter(OrdemServico.data_emissao <= dt_fim)
        if regiao:
            query = query.filter(OrdemServico.regiao_estoque == int(regiao))
        if contratada:
            query = query.filter(OrdemServico.detentora.ilike(f'%{contratada}%'))
        if servico:
            query = query.filter(OrdemServico.servico.ilike(f'%{servico}%'))
        
        ordens = query.order_by(OrdemServico.data_emissao.desc()).all()
        
        # Estatísticas
        total_os = len(ordens)
        regioes_atendidas = len(set([os.regiao_estoque for os in ordens if os.regiao_estoque]))
        
        # Contagem por serviço
        servicos = {}
        for os in ordens:
            servicos[os.servico] = servicos.get(os.servico, 0) + 1
        
        # Contagem por contratada
        contratadas = {}
        for os in ordens:
            contratadas[os.detentora] = contratadas.get(os.detentora, 0) + 1
        
        return jsonify({
            'success': True,
            'ordens': [os.to_dict() for os in ordens],
            'estatisticas': {
                'total_os': total_os,
                'regioes_atendidas': regioes_atendidas,
                'por_servico': servicos,
                'por_contratada': contratadas
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@relatorios_bp.route('/api/relatorios/estoque-posicao', methods=['GET'])
@login_requerido
def relatorio_estoque_posicao():
    """
    Relatório de posição atual do estoque
    Pode filtrar por categoria ou região
    """
    try:
        modulo = request.args.get('modulo', 'coffee')
        categoria_id = request.args.get('categoria_id')
        regiao = request.args.get('regiao')
        
        query = db.session.query(
            Item.id,
            Item.descricao,
            Item.unidade,
            Categoria.nome.label('categoria_nome'),
            Categoria.natureza,
            EstoqueRegional.regiao_numero,
            EstoqueRegional.quantidade_inicial,
            EstoqueRegional.quantidade_gasto
        ).join(Categoria, Item.categoria_id == Categoria.id)\
         .join(EstoqueRegional, Item.id == EstoqueRegional.item_id)\
         .filter(Categoria.modulo == modulo)
        
        if categoria_id:
            query = query.filter(Item.categoria_id == int(categoria_id))
        if regiao:
            query = query.filter(EstoqueRegional.regiao_numero == int(regiao))
        
        resultados = query.all()
        
        # Processar dados
        estoque_dados = []
        total_itens = 0
        total_valor_inicial = 0
        total_valor_gasto = 0
        
        for r in resultados:
            # ✅ Tratamento seguro de valores
            try:
                # Converter valores nulos ou inválidos para 0
                inicial_str = str(r.quantidade_inicial or '0').strip()
                gasto_str = str(r.quantidade_gasto or '0').strip()
                
                # Evitar valores inválidos como '__'
                if not inicial_str or inicial_str == '__' or not inicial_str.replace(',', '').replace('.', '').replace('-', ''):
                    inicial = 0
                else:
                    inicial = float(inicial_str.replace('.', '').replace(',', '.'))
                
                if not gasto_str or gasto_str == '__' or not gasto_str.replace(',', '').replace('.', '').replace('-', ''):
                    gasto = 0
                else:
                    gasto = float(gasto_str.replace('.', '').replace(',', '.'))
            except (ValueError, AttributeError):
                # Se ainda houver erro, usar 0
                inicial = 0
                gasto = 0
            
            disponivel = inicial - gasto
            percentual_uso = (gasto / inicial * 100) if inicial > 0 else 0
            
            estoque_dados.append({
                'item_id': r.id,
                'descricao': r.descricao,
                'unidade': r.unidade,
                'categoria': r.categoria_nome,
                'natureza': r.natureza,
                'regiao': r.regiao_numero,
                'quantidade_inicial': inicial,
                'quantidade_gasto': gasto,
                'quantidade_disponivel': disponivel,
                'percentual_uso': round(percentual_uso, 2)
            })
            
            total_itens += 1
            total_valor_inicial += inicial
            total_valor_gasto += gasto
        
        return jsonify({
            'success': True,
            'estoque': estoque_dados,
            'resumo': {
                'total_itens': total_itens,
                'total_inicial': round(total_valor_inicial, 2),
                'total_gasto': round(total_valor_gasto, 2),
                'total_disponivel': round(total_valor_inicial - total_valor_gasto, 2),
                'percentual_uso_geral': round((total_valor_gasto / total_valor_inicial * 100) if total_valor_inicial > 0 else 0, 2)
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@relatorios_bp.route('/api/relatorios/movimentacoes', methods=['GET'])
@login_requerido
def relatorio_movimentacoes():
    """
    Relatório de movimentações de estoque
    Filtros: data_inicio, data_fim, item_id, regiao, tipo
    """
    try:
        modulo = request.args.get('modulo', 'coffee')
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        item_id = request.args.get('item_id')
        regiao = request.args.get('regiao')
        tipo = request.args.get('tipo')
        
        query = db.session.query(
            MovimentacaoEstoque,
            Item.descricao,
            OrdemServico.numero_os,
            EstoqueRegional.regiao_numero
        ).join(Item, MovimentacaoEstoque.item_id == Item.id)\
         .join(OrdemServico, MovimentacaoEstoque.ordem_servico_id == OrdemServico.id)\
         .join(EstoqueRegional, MovimentacaoEstoque.estoque_regional_id == EstoqueRegional.id)\
         .filter(OrdemServico.modulo == modulo)
        
        if data_inicio:
            query = query.filter(MovimentacaoEstoque.data_movimentacao >= datetime.strptime(data_inicio, '%Y-%m-%d'))
        if data_fim:
            # ✅ Ajustar para o final do dia (23:59:59)
            dt_fim = datetime.strptime(data_fim, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
            query = query.filter(MovimentacaoEstoque.data_movimentacao <= dt_fim)
        if item_id:
            query = query.filter(MovimentacaoEstoque.item_id == int(item_id))
        if regiao:
            query = query.filter(EstoqueRegional.regiao_numero == int(regiao))
        if tipo:
            query = query.filter(MovimentacaoEstoque.tipo == tipo.upper())
        
        movimentacoes = query.order_by(MovimentacaoEstoque.data_movimentacao.desc()).all()
        
        resultado = []
        total_saidas = 0
        total_entradas = 0
        
        for mov, desc, num_os, regiao_num in movimentacoes:
            resultado.append({
                'id': mov.id,
                'data': mov.data_movimentacao.strftime('%d/%m/%Y %H:%M'),
                'item_descricao': desc,
                'numero_os': num_os,
                'regiao': regiao_num,
                'quantidade': mov.quantidade,
                'tipo': mov.tipo,
                'observacao': mov.observacao
            })
            
            if mov.tipo == 'SAIDA':
                total_saidas += mov.quantidade
            else:
                total_entradas += mov.quantidade
        
        return jsonify({
            'success': True,
            'movimentacoes': resultado,
            'resumo': {
                'total_movimentacoes': len(resultado),
                'total_saidas': round(total_saidas, 2),
                'total_entradas': round(total_entradas, 2),
                'saldo': round(total_entradas - total_saidas, 2)
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@relatorios_bp.route('/api/relatorios/consumo-por-categoria', methods=['GET'])
@login_requerido
def relatorio_consumo_categoria():
    """
    Relatório consolidado de consumo por categoria
    """
    try:
        modulo = request.args.get('modulo', 'coffee')
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        
        query = db.session.query(
            Categoria.nome.label('categoria'),
            Categoria.natureza,
            Item.descricao,
            Item.unidade,
            func.sum(ItemOrdemServico.quantidade_total).label('total_consumido'),
            func.count(ItemOrdemServico.id).label('vezes_utilizado')
        ).join(Categoria, Item.categoria_id == Categoria.id)\
         .join(ItemOrdemServico, Item.id == ItemOrdemServico.item_id)\
         .join(OrdemServico, ItemOrdemServico.ordem_servico_id == OrdemServico.id)\
         .filter(Categoria.modulo == modulo)
        
        if data_inicio:
            query = query.filter(OrdemServico.data_emissao >= datetime.strptime(data_inicio, '%Y-%m-%d'))
        if data_fim:
            # ✅ Ajustar para o final do dia (23:59:59) para incluir registros de hoje
            dt_fim = datetime.strptime(data_fim, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
            query = query.filter(OrdemServico.data_emissao <= dt_fim)
        
        resultados = query.group_by(
            Categoria.nome,
            Categoria.natureza,
            Item.descricao,
            Item.unidade
        ).order_by(Categoria.nome, func.sum(ItemOrdemServico.quantidade_total).desc()).all()
        
        # Agrupar por categoria
        categorias_resumo = {}
        for r in resultados:
            if r.categoria not in categorias_resumo:
                categorias_resumo[r.categoria] = {
                    'categoria': r.categoria,
                    'natureza': r.natureza,
                    'itens': [],
                    'total_itens_diferentes': 0,
                    'total_consumo': 0
                }
            
            categorias_resumo[r.categoria]['itens'].append({
                'descricao': r.descricao,
                'unidade': r.unidade,
                'total_consumido': float(r.total_consumido or 0),
                'vezes_utilizado': r.vezes_utilizado
            })
            categorias_resumo[r.categoria]['total_itens_diferentes'] += 1
            categorias_resumo[r.categoria]['total_consumo'] += float(r.total_consumido or 0)
        
        return jsonify({
            'success': True,
            'categorias': list(categorias_resumo.values())
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@relatorios_bp.route('/api/relatorios/itens-mais-utilizados', methods=['GET'])
@login_requerido
def relatorio_itens_mais_utilizados():
    """
    Top 10 (ou N) itens mais utilizados
    """
    try:
        modulo = request.args.get('modulo', 'coffee')
        limite = int(request.args.get('limite', 10))
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        
        query = db.session.query(
            Item.descricao,
            Item.unidade,
            Categoria.nome.label('categoria'),
            func.sum(ItemOrdemServico.quantidade_total).label('total_consumido'),
            func.count(ItemOrdemServico.id).label('vezes_utilizado')
        ).join(ItemOrdemServico).join(Categoria).join(OrdemServico)\
         .filter(Categoria.modulo == modulo)
        
        if data_inicio:
            query = query.filter(OrdemServico.data_emissao >= datetime.strptime(data_inicio, '%Y-%m-%d'))
        if data_fim:
            # ✅ Ajustar para o final do dia (23:59:59)
            dt_fim = datetime.strptime(data_fim, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
            query = query.filter(OrdemServico.data_emissao <= dt_fim)
        
        resultados = query.group_by(
            Item.descricao,
            Item.unidade,
            Categoria.nome
        ).order_by(func.sum(ItemOrdemServico.quantidade_total).desc()).limit(limite).all()
        
        ranking = []
        for i, r in enumerate(resultados, 1):
            ranking.append({
                'posicao': i,
                'descricao': r.descricao,
                'unidade': r.unidade,
                'categoria': r.categoria,
                'total_consumido': float(r.total_consumido or 0),
                'vezes_utilizado': r.vezes_utilizado
            })
        
        return jsonify({
            'success': True,
            'ranking': ranking
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@relatorios_bp.route('/api/relatorios/pdf/estoque', methods=['GET'])
@login_requerido
def gerar_pdf_estoque():
    """
    Gera PDF do relatório de posição de estoque
    """
    try:
        modulo = request.args.get('modulo', 'coffee')
        regiao = request.args.get('regiao')
        categoria_id = request.args.get('categoria_id')
        
        # Buscar dados
        query = db.session.query(
            Item.descricao,
            Item.unidade,
            Categoria.nome.label('categoria_nome'),
            EstoqueRegional.regiao_numero,
            EstoqueRegional.quantidade_inicial,
            EstoqueRegional.quantidade_gasto
        ).join(Categoria, Item.categoria_id == Categoria.id)\
         .join(EstoqueRegional, Item.id == EstoqueRegional.item_id)\
         .filter(Categoria.modulo == modulo)
        
        if categoria_id:
            query = query.filter(Item.categoria_id == int(categoria_id))
        if regiao:
            query = query.filter(EstoqueRegional.regiao_numero == int(regiao))
        
        resultados = query.order_by(Categoria.nome, Item.descricao).all()
        
        # Criar PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=1.5*cm, bottomMargin=1.5*cm)
        elementos = []
        styles = getSampleStyleSheet()
        
        # Título
        titulo_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1a202c'),
            spaceAfter=20,
            alignment=1  # Centralizado
        )
        
        titulo = f"Relatório de Posição de Estoque"
        if regiao:
            titulo += f" - Região {regiao}"
        elementos.append(Paragraph(titulo, titulo_style))
        elementos.append(Spacer(1, 0.5*cm))
        
        # Data de geração
        data_geracao = datetime.now().strftime('%d/%m/%Y às %H:%M')
        elementos.append(Paragraph(f"Gerado em: {data_geracao}", styles['Normal']))
        elementos.append(Spacer(1, 0.5*cm))
        
        # Tabela
        dados_tabela = [['Categoria', 'Item', 'Unidade', 'Região', 'Inicial', 'Gasto', 'Disponível', '% Uso']]
        
        total_inicial = 0
        total_gasto = 0
        
        for r in resultados:
            # ✅ Tratamento seguro de valores
            try:
                # Converter valores nulos ou inválidos para 0
                inicial_str = str(r.quantidade_inicial or '0').strip()
                gasto_str = str(r.quantidade_gasto or '0').strip()
                
                # Evitar valores inválidos como '__'
                if not inicial_str or inicial_str == '__' or not inicial_str.replace(',', '').replace('.', '').replace('-', ''):
                    inicial = 0
                else:
                    inicial = float(inicial_str.replace('.', '').replace(',', '.'))
                
                if not gasto_str or gasto_str == '__' or not gasto_str.replace(',', '').replace('.', '').replace('-', ''):
                    gasto = 0
                else:
                    gasto = float(gasto_str.replace('.', '').replace(',', '.'))
            except (ValueError, AttributeError):
                # Se ainda houver erro, usar 0
                inicial = 0
                gasto = 0
            
            disponivel = inicial - gasto
            percentual = (gasto / inicial * 100) if inicial > 0 else 0
            
            total_inicial += inicial
            total_gasto += gasto
            
            dados_tabela.append([
                r.categoria_nome,
                r.descricao[:40],  # Limitar tamanho
                r.unidade,
                str(r.regiao_numero),
                f"{inicial:,.0f}",
                f"{gasto:,.0f}",
                f"{disponivel:,.0f}",
                f"{percentual:.1f}%"
            ])
        
        # Linha de total
        total_disponivel = total_inicial - total_gasto
        percentual_total = (total_gasto / total_inicial * 100) if total_inicial > 0 else 0
        dados_tabela.append([
            'TOTAL', '', '', '',
            f"{total_inicial:,.0f}",
            f"{total_gasto:,.0f}",
            f"{total_disponivel:,.0f}",
            f"{percentual_total:.1f}%"
        ])
        
        tabela = Table(dados_tabela, colWidths=[4*cm, 6*cm, 2*cm, 1.5*cm, 2*cm, 2*cm, 2*cm, 2*cm])
        tabela.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#667eea')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e2e8f0')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
        ]))
        
        elementos.append(tabela)
        doc.build(elementos)
        
        buffer.seek(0)
        return send_file(
            buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'relatorio_estoque_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        )
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@relatorios_bp.route('/api/relatorios/pdf/ordens-servico', methods=['GET'])
@login_requerido
def gerar_pdf_ordens_servico():
    """
    Gera PDF do relatório de Ordens de Serviço
    """
    try:
        modulo = request.args.get('modulo', 'coffee')
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        regiao = request.args.get('regiao')
        
        query = OrdemServico.query.filter_by(modulo=modulo)
        
        if data_inicio:
            query = query.filter(OrdemServico.data_emissao >= datetime.strptime(data_inicio, '%Y-%m-%d'))
        if data_fim:
            # ✅ Ajustar para o final do dia (23:59:59)
            dt_fim = datetime.strptime(data_fim, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
            query = query.filter(OrdemServico.data_emissao <= dt_fim)
        if regiao:
            query = query.filter(OrdemServico.regiao_estoque == int(regiao))
        
        ordens = query.order_by(OrdemServico.data_emissao.desc()).all()
        
        # Criar PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=1.5*cm, bottomMargin=1.5*cm)
        elementos = []
        styles = getSampleStyleSheet()
        
        # Título
        titulo_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1a202c'),
            spaceAfter=20,
            alignment=1
        )
        
        titulo = "Relatório de Ordens de Serviço"
        if data_inicio and data_fim:
            titulo += f" ({data_inicio} a {data_fim})"
        elementos.append(Paragraph(titulo, titulo_style))
        elementos.append(Spacer(1, 0.5*cm))
        
        # Resumo
        elementos.append(Paragraph(f"Total de O.S.: {len(ordens)}", styles['Normal']))
        elementos.append(Spacer(1, 0.3*cm))
        
        # Tabela
        dados_tabela = [['Nº O.S.', 'Data Emissão', 'Serviço', 'Evento', 'Contratada', 'Região', 'Itens']]
        
        for os in ordens:
            total_itens = len(os.itens)
            data_emissao = os.data_emissao.strftime('%d/%m/%Y') if os.data_emissao else '-'
            
            dados_tabela.append([
                os.numero_os,
                data_emissao,
                os.servico[:25] if os.servico else '-',
                os.evento[:25] if os.evento else '-',
                os.detentora[:25] if os.detentora else '-',
                str(os.regiao_estoque) if os.regiao_estoque else '-',
                str(total_itens)
            ])
        
        tabela = Table(dados_tabela, colWidths=[2.5*cm, 2.5*cm, 4*cm, 4*cm, 4*cm, 1.5*cm, 1.5*cm])
        tabela.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#667eea')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
        ]))
        
        elementos.append(tabela)
        doc.build(elementos)
        
        buffer.seek(0)
        return send_file(
            buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'relatorio_os_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        )
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
