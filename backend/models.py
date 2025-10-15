from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Categoria(db.Model):
    """Categorias de itens (ex: coffee_break_bebidas_quentes)"""
    __tablename__ = 'categorias'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), unique=True, nullable=False)
    tipo = db.Column(db.String(50), nullable=False)  # 'alimentacao', 'estoque', etc
    natureza = db.Column(db.String(10))  # Código da natureza da despesa
    
    # Relacionamento
    itens = db.relationship('Item', backref='categoria', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'tipo': self.tipo,
            'natureza': self.natureza
        }


class Item(db.Model):
    """Itens do estoque/alimentação"""
    __tablename__ = 'itens'
    
    id = db.Column(db.Integer, primary_key=True)
    categoria_id = db.Column(db.Integer, db.ForeignKey('categorias.id'), nullable=False)
    item_codigo = db.Column(db.String(20), nullable=False)  # "1", "2", etc
    descricao = db.Column(db.String(200), nullable=False)
    unidade = db.Column(db.String(50), nullable=False)
    
    # Relacionamentos
    estoques = db.relationship('EstoqueRegional', backref='item', lazy=True, cascade='all, delete-orphan')
    itens_os = db.relationship('ItemOrdemServico', backref='item', lazy=True)
    
    def to_dict(self, incluir_estoques=True):
        data = {
            'id': self.id,
            'categoria_id': self.categoria_id,
            'item': self.item_codigo,
            'descricao': self.descricao,
            'unidade': self.unidade
        }
        
        if incluir_estoques:
            data['regioes'] = {
                str(est.regiao_numero): {
                    'inicial': est.quantidade_inicial,
                    'gasto': est.quantidade_gasto
                }
                for est in self.estoques
            }
        
        return data


class EstoqueRegional(db.Model):
    """Controle de estoque por região"""
    __tablename__ = 'estoque_regional'
    
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('itens.id'), nullable=False)
    regiao_numero = db.Column(db.Integer, nullable=False)  # 1 a 6
    quantidade_inicial = db.Column(db.String(20), nullable=False)
    quantidade_gasto = db.Column(db.String(20), default='0')
    
    __table_args__ = (
        db.UniqueConstraint('item_id', 'regiao_numero', name='_item_regiao_uc'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'item_id': self.item_id,
            'regiao': self.regiao_numero,
            'inicial': self.quantidade_inicial,
            'gasto': self.quantidade_gasto
        }
    
    @property
    def disponivel(self):
        """Calcula quantidade disponível"""
        try:
            inicial = float(self.quantidade_inicial.replace('.', '').replace(',', '.'))
            gasto = float(self.quantidade_gasto.replace('.', '').replace(',', '.'))
            return str(inicial - gasto)
        except:
            return '0'


class OrdemServico(db.Model):
    """Ordens de Serviço emitidas"""
    __tablename__ = 'ordens_servico'
    
    id = db.Column(db.Integer, primary_key=True)
    numero_os = db.Column(db.String(50), unique=True, nullable=False)
    
    # Dados do contrato
    contrato = db.Column(db.String(100))
    data_assinatura = db.Column(db.String(100))  # Data da assinatura do contrato
    prazo_vigencia = db.Column(db.String(100))   # Ex: "12 MESES"
    detentora = db.Column(db.String(200))
    cnpj = db.Column(db.String(20))
    servico = db.Column(db.String(200))          # Ex: "COFFEE BREAK"
    grupo = db.Column(db.String(50))             # Número do grupo
    
    # Dados do evento
    evento = db.Column(db.String(200))
    data = db.Column(db.String(100))  # Pode ser intervalo
    horario = db.Column(db.String(50))  # Horário do evento
    local = db.Column(db.Text)
    justificativa = db.Column(db.Text)
    observacoes = db.Column(db.Text)  # ✅ Campo de observações
    
    # Responsáveis
    gestor_contrato = db.Column(db.String(200))
    fiscal_contrato = db.Column(db.String(200))
    fiscal_tipo = db.Column(db.String(50), default='Fiscal do Contrato')  # ✅ Tipo de fiscal
    responsavel = db.Column(db.String(200))  # Responsável pela O.S.
    
    # Controle
    data_emissao = db.Column(db.DateTime, default=datetime.utcnow)
    data_emissao_completa = db.Column(db.String(50))
    
    # Relacionamentos
    itens = db.relationship('ItemOrdemServico', backref='ordem_servico', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, incluir_itens=True):
        data = {
            'id': self.id,
            'numeroOS': self.numero_os,
            'contrato': self.contrato,
            'dataAssinatura': self.data_assinatura,
            'prazoVigencia': self.prazo_vigencia,
            'detentora': self.detentora,
            'cnpj': self.cnpj,
            'servico': self.servico,
            'grupo': self.grupo,
            'evento': self.evento,
            'data': self.data,
            'horario': self.horario,
            'local': self.local,
            'justificativa': self.justificativa,
            'observacoes': self.observacoes,  # ✅ Adicionar observações
            'gestorContrato': self.gestor_contrato,
            'fiscalContrato': self.fiscal_contrato,
            'fiscalTipo': self.fiscal_tipo,  # ✅ Adicionar tipo de fiscal
            'responsavel': self.responsavel,
            'dataEmissao': self.data_emissao.isoformat() if self.data_emissao else None,
            'dataEmissaoCompleta': self.data_emissao_completa
        }
        
        if incluir_itens:
            data['itens'] = [item.to_dict() for item in self.itens]
        
        return data


class ItemOrdemServico(db.Model):
    """Itens utilizados em cada Ordem de Serviço"""
    __tablename__ = 'itens_ordem_servico'
    
    id = db.Column(db.Integer, primary_key=True)
    ordem_servico_id = db.Column(db.Integer, db.ForeignKey('ordens_servico.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('itens.id'), nullable=False)
    
    categoria = db.Column(db.String(100))
    item_codigo = db.Column(db.String(20))
    item_bec = db.Column(db.String(50))  # Código da natureza da despesa (BEC)
    descricao = db.Column(db.String(200))
    unidade = db.Column(db.String(50))
    diarias = db.Column(db.Integer, default=1)  # Multiplicador de diárias
    quantidade_solicitada = db.Column(db.Float)  # Quantidade por diária
    quantidade_total = db.Column(db.Float)  # Quantidade total (diarias × qtd_solicitada)
    
    def to_dict(self):
        return {
            'id': self.id,
            'categoria': self.categoria,
            'itemId': self.item_codigo,
            'itemBec': self.item_bec,
            'descricao': self.descricao,
            'unidade': self.unidade,
            'diarias': self.diarias or 1,
            'qtdSolicitada': self.quantidade_solicitada,
            'qtdTotal': self.quantidade_total
        }
