"""
Gerador de PDF para Ordens de Serviço
Gera PDFs com texto selecionável (não imagem) para fácil conversão para Excel
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak, KeepTogether, CondPageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
from datetime import datetime
import os
from models import EstoqueRegional


class PDFOrdemServico:
    """Classe para gerar PDF de Ordem de Serviço com texto selecionável"""
    
    def __init__(self):
        self.width, self.height = A4
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _get_safe(self, dados, key, default=''):
        """Retorna valor do dict garantindo que não seja None"""
        value = dados.get(key, default)
        return value if value is not None else default
    
    def _formatar_data(self, data_str, formato='curto'):
        """
        Formata data de timestamp ISO para dd/mm/yyyy ou formato extenso
        
        Args:
            data_str: String com a data
            formato: 'curto' para dd/mm/yyyy ou 'extenso' para "15 de janeiro de 2025"
        """
        if not data_str:
            dt = datetime.now()
        else:
            # Se já está no formato dd/mm/yyyy, parseia
            if '/' in str(data_str) and len(str(data_str).split('/')) == 3:
                try:
                    dt = datetime.strptime(str(data_str), '%d/%m/%Y')
                except:
                    dt = datetime.now()
            else:
                try:
                    # Tenta parsear ISO timestamp
                    if 'T' in str(data_str):
                        dt = datetime.fromisoformat(str(data_str).replace('Z', '+00:00'))
                    # Tenta formato yyyy-mm-dd
                    elif '-' in str(data_str):
                        dt = datetime.strptime(str(data_str).split()[0], '%Y-%m-%d')
                    else:
                        dt = datetime.now()
                except:
                    dt = datetime.now()
        
        if formato == 'extenso':
            # Formato: "15 de janeiro de 2025"
            meses = {
                1: 'janeiro', 2: 'fevereiro', 3: 'março', 4: 'abril',
                5: 'maio', 6: 'junho', 7: 'julho', 8: 'agosto',
                9: 'setembro', 10: 'outubro', 11: 'novembro', 12: 'dezembro'
            }
            return f"{dt.day} de {meses[dt.month]} de {dt.year}"
        else:
            # Formato curto: dd/mm/yyyy
            return dt.strftime('%d/%m/%Y')
    
    def _setup_custom_styles(self):
        """Configura estilos personalizados para o PDF"""
        
        # Estilo para título
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=10,  # Reduzido de 12 para 10
            textColor=colors.HexColor('#000000'),
            spaceAfter=4,  # Reduzido de 8 para 4
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para subtítulo
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Normal'],
            fontSize=7.5,  # Reduzido de 9 para 7.5
            textColor=colors.HexColor('#000000'),
            spaceAfter=3,  # Reduzido de 6 para 3
            alignment=TA_CENTER,
            fontName='Helvetica',
            leading=9  # Espaçamento entre linhas
        ))
        
        # Estilo para texto normal
        self.styles.add(ParagraphStyle(
            name='CustomNormal',
            parent=self.styles['Normal'],
            fontSize=7,  # Reduzido de 8 para 7
            textColor=colors.HexColor('#000000'),
            spaceAfter=2,  # Reduzido de 3 para 2
            fontName='Helvetica'
        ))
        
        # Estilo para labels (negrito)
        self.styles.add(ParagraphStyle(
            name='CustomLabel',
            parent=self.styles['Normal'],
            fontSize=7,  # Reduzido de 8 para 7
            textColor=colors.HexColor('#000000'),
            fontName='Helvetica-Bold'
        ))
    
    def gerar_pdf(self, dados_os, output_path=None):
        """
        Gera PDF da Ordem de Serviço
        
        Args:
            dados_os (dict): Dicionário com dados da O.S.
            output_path (str): Caminho do arquivo. Se None, retorna BytesIO
        
        Returns:
            BytesIO ou None (se salvou em arquivo)
        """
        
        # Criar buffer ou arquivo
        if output_path:
            buffer = output_path
        else:
            buffer = BytesIO()
        
        # Criar documento com margens reduzidas
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=12*mm,  # Reduzido de 20mm para 12mm
            leftMargin=12*mm,   # Reduzido de 20mm para 12mm
            topMargin=10*mm,    # Reduzido de 15mm para 10mm
            bottomMargin=14*mm, # Margem inferior para caber numeração de página
            title=f"Ordem de Serviço {dados_os.get('numeroOS', 'N/A')}"
        )
        
        # Container para elementos
        story = []
        
        # Cabeçalho
        story.extend(self._criar_cabecalho(dados_os))
        story.append(Spacer(1, 2*mm))  # Reduzido de 5mm para 2mm
        
        # Dados do contrato
        story.extend(self._criar_secao_contrato(dados_os))
        story.append(Spacer(1, 1.5*mm))  # Reduzido de 3mm para 1.5mm
        
        # Dados do evento
        story.extend(self._criar_secao_evento(dados_os))
        story.append(Spacer(1, 1.5*mm))  # Reduzido de 3mm para 1.5mm
        
        # Tabela de itens
        story.extend(self._criar_tabela_itens(dados_os))
        story.append(Spacer(1, 1.5*mm))
        
        # Justificativa (pode ficar separada se for muito longa)
        story.extend(self._criar_secao_justificativa(dados_os))
        story.append(Spacer(1, 1.5*mm))
        
        # Observações (se existir)
        if dados_os.get('observacoes'):
            story.extend(self._criar_secao_observacoes(dados_os))
            story.append(Spacer(1, 1.5*mm))
        
        # Assinaturas — SEMPRE manter juntas (nunca separar data/nomes/cargos)
        # KeepTogether garante que, se não couber no espaço restante, vai tudo para a próxima página
        bloco_assinaturas = [Spacer(1, 1*mm)]
        bloco_assinaturas.extend(self._criar_secao_assinaturas(dados_os))
        story.append(KeepTogether(bloco_assinaturas))
        
        # Construir PDF com numeração de página
        numero_os = self._get_safe(dados_os, 'numeroOS', 'N/A')

        def _rodape_pagina(canvas, doc):
            """Adiciona número da página no rodapé"""
            canvas.saveState()
            canvas.setFont('Helvetica', 6)
            page_num = canvas.getPageNumber()
            text = f"O.S. {numero_os} - Página {page_num}"
            canvas.drawCentredString(doc.pagesize[0] / 2, 8 * mm, text)
            canvas.restoreState()

        doc.build(story, onFirstPage=_rodape_pagina, onLaterPages=_rodape_pagina)
        
        if not output_path:
            buffer.seek(0)
            return buffer
        
        return None
    
    def _criar_cabecalho(self, dados):
        """Cria cabeçalho do documento com logo e info box"""
        elements = []
        
        # Criar tabela para layout: [Logo | Título | Info Box]
        # Dados de emissão formatados
        data_emissao = self._formatar_data(self._get_safe(dados, 'dataEmissao'))
        numero_os = self._get_safe(dados, 'numeroOS', 'N/A')
        
        # Logo (timbrado)
        logo_path = os.path.join(os.path.dirname(__file__), 'static', 'timbrado.png')
        if os.path.exists(logo_path):
            logo = Image(logo_path, width=20*mm, height=20*mm)  # Reduzido de 25mm para 20mm
        else:
            # Placeholder se não houver logo
            logo = Paragraph('<b>SP</b>', self.styles['CustomLabel'])
        
        # Título central
        titulo = Paragraph(
            "GOVERNO DO ESTADO DE SÃO PAULO<br/>SECRETARIA DE ESTADO DA EDUCAÇÃO<br/>COORDENADORIA GERAL DE SUPORTE ADMINISTRATIVO<br/><br/><b>ORDEM DE SERVIÇO</b>",
            self.styles['CustomSubtitle']
        )
        
        
        # Info box (direita)
        info_box_data = [
            [Paragraph('<b>DATA DE EMISSÃO:</b>', self.styles['CustomLabel'])],
            [Paragraph(data_emissao, self.styles['CustomNormal'])],
            [Paragraph('<b>NÚMERO:</b>', self.styles['CustomLabel'])],
            [Paragraph(numero_os, self.styles['CustomNormal'])]
        ]
        
        info_table = Table(info_box_data, colWidths=[32*mm])  # Reduzido de 35mm para 32mm
        info_table.setStyle(TableStyle([
            ('BORDER', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f0f0')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 2),  # Reduzido de 3 para 2
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),  # Reduzido de 3 para 2
        ]))
        
        # Tabela principal do cabeçalho
        header_data = [[logo, titulo, info_table]]
        header_table = Table(header_data, colWidths=[25*mm, 110*mm, 35*mm])  # Ajustado proporcionalmente
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),   # Logo à esquerda
            ('ALIGN', (1, 0), (1, 0), 'CENTER'), # Título centralizado
            ('ALIGN', (2, 0), (2, 0), 'RIGHT'),  # Info box à direita
        ]))
        
        elements.append(header_table)
        
        return elements
    
    def _criar_secao_contrato(self, dados):
        """Cria seção de dados do contrato"""
        elements = []
        
        # Formatar data de assinatura
        data_assinatura = self._formatar_data(self._get_safe(dados, 'dataAssinatura'))
        
        data = [
            [Paragraph('<b>CONTRATO Nº:</b>', self.styles['CustomLabel']), 
             Paragraph(self._get_safe(dados, 'contrato'), self.styles['CustomNormal']),
             Paragraph('<b>DATA ASSINATURA:</b>', self.styles['CustomLabel']), 
             Paragraph(data_assinatura, self.styles['CustomNormal'])],
            
            [Paragraph('<b>DETENTORA:</b>', self.styles['CustomLabel']), 
             Paragraph(self._get_safe(dados, 'detentora'), self.styles['CustomNormal']), '', ''],

            [Paragraph('<b>SERVIÇO:</b>', self.styles['CustomLabel']), 
             Paragraph(self._get_safe(dados, 'servico'), self.styles['CustomNormal']),
             Paragraph('<b>PRAZO VIGÊNCIA:</b>', self.styles['CustomLabel']),
             Paragraph(self._get_safe(dados, 'prazoVigencia'), self.styles['CustomNormal'])],
            
            [Paragraph('<b>CNPJ:</b>', self.styles['CustomLabel']), 
             Paragraph(self._get_safe(dados, 'cnpj'), self.styles['CustomNormal']),
             Paragraph('<b>GRUPO:</b>', self.styles['CustomLabel']), 
             Paragraph(self._get_safe(dados, 'grupo'), self.styles['CustomNormal'])]
        ]
        
        table = Table(data, colWidths=[40*mm, 50*mm, 35*mm, 45*mm])
        table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 2),  # Reduzido de 4 para 2
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),  # Reduzido de 4 para 2
            ('LEFTPADDING', (0, 0), (-1, -1), 3),  # Reduzido de 5 para 3
            ('SPAN', (1, 1), (3, 1)),  # DATA span 3 colunas
        ]))
        
        elements.append(table)
        return elements
    
    def _criar_secao_evento(self, dados):
        """Cria seção de dados do evento"""
        elements = []
        
        # Converter quebras de linha no horário para HTML
        horario = self._get_safe(dados, 'horario')
        horario_html = horario.replace('\n', '<br/>') if horario else ''
        
        data = [
            [Paragraph('<b>EVENTO:</b>', self.styles['CustomLabel']), 
             Paragraph(self._get_safe(dados, 'evento'), self.styles['CustomNormal']), '', ''],
            
            [Paragraph('<b>DATA:</b>', self.styles['CustomLabel']), 
             Paragraph(self._get_safe(dados, 'data'), self.styles['CustomNormal']), '', ''],
            
            [Paragraph('<b>HORÁRIO:</b>', self.styles['CustomLabel']), 
             Paragraph(horario_html, self.styles['CustomNormal']), '', ''],
            
            [Paragraph('<b>LOCAL DO EVENTO:</b>', self.styles['CustomLabel']), 
             Paragraph(self._get_safe(dados, 'local'), self.styles['CustomNormal']), '', ''],
            
            [Paragraph('<b>RESPONSÁVEL:</b>', self.styles['CustomLabel']), 
             Paragraph(self._get_safe(dados, 'responsavel'), self.styles['CustomNormal']), '', '']
        ]
        
        table = Table(data, colWidths=[40*mm, 50*mm, 35*mm, 45*mm])
        table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 2),  # Reduzido de 4 para 2
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),  # Reduzido de 4 para 2
            ('LEFTPADDING', (0, 0), (-1, -1), 3),  # Reduzido de 5 para 3
            ('SPAN', (1, 0), (3, 0)),  # EVENTO span 3 colunas
            ('SPAN', (1, 1), (3, 1)),  # DATA span 3 colunas
            ('SPAN', (1, 2), (3, 2)),  # HORÁRIO span 3 colunas
            ('SPAN', (1, 3), (3, 3)),  # LOCAL span 3 colunas
            ('SPAN', (1, 4), (3, 4)),  # RESPONSÁVEL span 3 colunas
        ]))
        
        elements.append(table)
        return elements
    
    def _criar_tabela_itens(self, dados):
        """Cria tabela de itens da O.S."""
        elements = []
        
        # Cabeçalho da tabela
        header = [
            Paragraph('<b>Nº</b>', self.styles['CustomLabel']),
            Paragraph('<b>DESCRIÇÃO</b>', self.styles['CustomLabel']),
            Paragraph('<b>ITEM BEC</b>', self.styles['CustomLabel']),
            Paragraph('<b>DIÁRIAS</b>', self.styles['CustomLabel']),
            Paragraph('<b>QTDE<br/>SOLICITADA</b>', self.styles['CustomLabel']),
            Paragraph('<b>QTDE<br/>SOLICITADA<br/>TOTAL</b>', self.styles['CustomLabel']),
            Paragraph('<b>VALOR UNIT.</b>', self.styles['CustomLabel']),
            Paragraph('<b>VALOR<br/>TOTAL</b>', self.styles['CustomLabel'])
        ]
        
        data = [header]
        
        # Buscar região do estoque da O.S.
        regiao_estoque = dados.get('regiaoEstoque')
        
        # Itens
        valor_total = 0
        for idx, item in enumerate(dados.get('itens', []), 1):
            diarias = int(item.get('diarias', 1))
            # Priorizar qtdSolicitada se existir, senão calcular a partir de qtdTotal
            qtd_solicitada = float(item.get('qtdSolicitada', 0)) if item.get('qtdSolicitada') is not None else (float(item.get('qtdTotal', 0)) / diarias if diarias > 0 else 0)
            qtd_total = float(item.get('qtdTotal', 0))
            
            # Buscar preço do banco de dados baseado no item_id e região
            valor_unit = 0.0
            item_id = item.get('itemId')
            if item_id and regiao_estoque:
                estoque = EstoqueRegional.query.filter_by(
                    item_id=item_id,
                    regiao_numero=regiao_estoque
                ).first()
                
                if estoque and estoque.preco:
                    try:
                        # Converter preco (string) para float
                        preco_str = estoque.preco.replace('.', '').replace(',', '.')
                        valor_unit = float(preco_str)
                    except:
                        valor_unit = 0.0
            
            total_item = qtd_total * valor_unit
            valor_total += total_item
            
            # Formatar números com separador de milhares
            qtd_sol_fmt = f"{qtd_solicitada:,.0f}".replace(',', '.')
            qtd_total_fmt = f"{qtd_total:,.0f}".replace(',', '.')
            
            row = [
                Paragraph(str(idx), self.styles['CustomNormal']),
                Paragraph(item.get('descricao', ''), self.styles['CustomNormal']),
                Paragraph(str(item.get('itemBec', '')), self.styles['CustomNormal']),
                Paragraph(str(diarias), self.styles['CustomNormal']),
                Paragraph(qtd_sol_fmt, self.styles['CustomNormal']),
                Paragraph(qtd_total_fmt, self.styles['CustomNormal']),
                Paragraph(f'R$ {valor_unit:.2f}', self.styles['CustomNormal']),
                Paragraph(f'R$ {total_item:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.'), self.styles['CustomNormal'])
            ]
            data.append(row)
        
        # Total
        total_row = [
            '', '', '', '', '', '',
            Paragraph('<b>VALOR TOTAL:</b>', self.styles['CustomLabel']),
            Paragraph(f'<b>R$ {valor_total:,.2f}</b>'.replace(',', 'X').replace('.', ',').replace('X', '.'), self.styles['CustomLabel'])
        ]
        data.append(total_row)
        
        # Larguras: Nº, Descrição, Item BEC, Diárias, Qtde Sol, Qtde Total, Valor Unit, Valor Total
        table = Table(data, colWidths=[10*mm, 50*mm, 18*mm, 15*mm, 20*mm, 20*mm, 22*mm, 28*mm], repeatRows=1)
        table.setStyle(TableStyle([
            # Cabeçalho
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#c6e0b4')),  # Verde claro como no print
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 6.5),  # Reduzido de 7 para 6.5
            ('BOTTOMPADDING', (0, 0), (-1, 0), 2),  # Reduzido de 4 para 2
            ('TOPPADDING', (0, 0), (-1, 0), 2),  # Reduzido de 4 para 2
            
            # Corpo
            ('GRID', (0, 0), (-1, -2), 0.5, colors.grey),
            ('BACKGROUND', (0, 1), (-1, -2), colors.HexColor('#e2efd9')),  # Verde muito claro como no print
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),  # Nº centralizado
            ('ALIGN', (1, 1), (1, -1), 'LEFT'),    # Descrição à esquerda
            ('ALIGN', (2, 1), (2, -1), 'CENTER'),  # Item BEC centralizado
            ('ALIGN', (3, 1), (3, -1), 'CENTER'),  # Diárias centralizado
            ('ALIGN', (4, 1), (4, -1), 'RIGHT'),   # Qtde Solicitada à direita
            ('ALIGN', (5, 1), (5, -1), 'RIGHT'),   # Qtde Total à direita
            ('ALIGN', (6, 1), (6, -1), 'RIGHT'),   # Valor Unit à direita
            ('ALIGN', (7, 1), (7, -1), 'RIGHT'),   # Valor Total à direita
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 1), (-1, -1), 1),  # Reduzido de 2 para 1
            ('BOTTOMPADDING', (0, 1), (-1, -1), 1),  # Reduzido de 2 para 1
            ('LEFTPADDING', (0, 0), (-1, -1), 1.5),  # Reduzido de 2 para 1.5
            ('RIGHTPADDING', (0, 0), (-1, -1), 1.5),  # Reduzido de 2 para 1.5
            
            # Linha de total
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#c6e0b4')),  # Verde claro
            ('LINEABOVE', (0, -1), (-1, -1), 1.5, colors.black),
            ('ALIGN', (6, -1), (6, -1), 'RIGHT'),
            ('ALIGN', (7, -1), (7, -1), 'RIGHT'),
            ('SPAN', (0, -1), (5, -1)),  # Merge primeiras 6 colunas
        ]))
        
        elements.append(table)
        return elements
    
    def _criar_secao_justificativa(self, dados):
        """Cria seção de justificativa"""
        elements = []
        
        # Estilo compacto para justificativa
        justificativa_style = ParagraphStyle(
            'JustificativaCompacta',
            parent=self.styles['CustomNormal'],
            fontSize=6.5,  # Reduzido de 7 para 6.5
            leading=8,     # Reduzido de 9 para 8
            spaceAfter=1
        )
        
        elements.append(Paragraph('<b>JUSTIFICATIVA:</b>', self.styles['CustomLabel']))
        
        justificativa = self._get_safe(dados, 'justificativa')
        # Substituir quebras de linha por <br/>
        justificativa_html = justificativa.replace('\n', '<br/>')
        
        elements.append(Paragraph(justificativa_html, justificativa_style))
        
        return elements
    
    def _criar_secao_observacoes(self, dados):
        """Cria seção de observações"""
        elements = []
        
        # Estilo compacto para observações (mesmo estilo da justificativa)
        observacoes_style = ParagraphStyle(
            'ObservacoesCompacta',
            parent=self.styles['CustomNormal'],
            fontSize=6.5,  # Reduzido de 7 para 6.5
            leading=8,     # Reduzido de 9 para 8
            spaceAfter=1
        )
        
        elements.append(Paragraph('<b>OBSERVAÇÕES:</b>', self.styles['CustomLabel']))
        
        observacoes = self._get_safe(dados, 'observacoes')
        # Substituir quebras de linha por <br/>
        observacoes_html = observacoes.replace('\n', '<br/>')
        
        elements.append(Paragraph(observacoes_html, observacoes_style))
        
        return elements
    
    def _criar_secao_assinaturas(self, dados):
        """Cria seção de assinaturas dinâmicas (N signatários em linhas de 2)"""
        elements = []

        # Texto de local e data (centralizado) - formato extenso
        data_emissao = self._formatar_data(self._get_safe(dados, 'dataEmissao'), formato='extenso')
        data_paragraph = Paragraph(
            f'São Paulo, {data_emissao}.',
            ParagraphStyle(
                'DataAssinatura',
                parent=self.styles['CustomNormal'],
                alignment=TA_CENTER,
                fontSize=7,
                spaceAfter=4*mm
            )
        )
        elements.append(data_paragraph)

        # Obter lista de signatários (novo campo JSON ou fallback legado)
        signatarios = dados.get('signatarios', [])
        if not signatarios:
            # Fallback para campos legados
            gestor = self._get_safe(dados, 'gestorContrato')
            fiscal = self._get_safe(dados, 'fiscalContrato')
            fiscal_tipo = self._get_safe(dados, 'fiscalTipo', 'Fiscal do Contrato')
            if gestor:
                signatarios.append({'cargo': 'Gestor do Contrato', 'nome': gestor})
            if fiscal:
                signatarios.append({'cargo': fiscal_tipo, 'nome': fiscal})

        if not signatarios:
            return elements

        # Criar estilo centralizado para assinaturas
        sig_style = ParagraphStyle(
            'Assinatura',
            parent=self.styles['CustomNormal'],
            alignment=TA_CENTER,
            fontSize=8
        )

        # Renderizar em linhas de 2
        for i in range(0, len(signatarios), 2):
            par = signatarios[i:i+2]

            if len(par) == 2:
                sig_data = [
                    ['_' * 25, '_' * 25],
                    [Paragraph(f'<b>{par[0]["nome"]}</b>', sig_style),
                     Paragraph(f'<b>{par[1]["nome"]}</b>', sig_style)],
                    [Paragraph(par[0]['cargo'], sig_style),
                     Paragraph(par[1]['cargo'], sig_style)]
                ]
                sig_table = Table(sig_data, colWidths=[85*mm, 85*mm])
            else:
                # Ímpar: centralizar o último
                sig_data = [
                    ['_' * 25],
                    [Paragraph(f'<b>{par[0]["nome"]}</b>', sig_style)],
                    [Paragraph(par[0]['cargo'], sig_style)]
                ]
                sig_table = Table(sig_data, colWidths=[85*mm])

            sig_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 1), (-1, -1), 2),
            ]))

            elements.append(sig_table)
            # Espaço entre linhas de assinaturas
            if i + 2 < len(signatarios):
                elements.append(Spacer(1, 3*mm))

        return elements


def gerar_pdf_os(dados_os):
    """
    Função utilitária para gerar PDF de O.S.
    
    Args:
        dados_os (dict): Dados da ordem de serviço
    
    Returns:
        BytesIO: Buffer com PDF gerado
    """
    gerador = PDFOrdemServico()
    return gerador.gerar_pdf(dados_os)
