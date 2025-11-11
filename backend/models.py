from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta, timezone
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

# Fuso horário de São Paulo (Brazil/East): UTC-3
TIMEZONE_BR = timezone(timedelta(hours=-3))

def get_datetime_br():
    """Retorna o horário atual em São Paulo (UTC-3)"""
    return datetime.now(TIMEZONE_BR).replace(tzinfo=None)

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
            'unidade': self.unidade,
            'natureza': self.categoria.natureza  # Código BEC da categoria
        }
        
        if incluir_estoques:
            data['regioes'] = {
                str(est.regiao_numero): {
                    'inicial': est.quantidade_inicial,
                    'gasto': est.quantidade_gasto,
                    'preco': est.preco if hasattr(est, 'preco') else '0'
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
    preco = db.Column(db.String(20), default='0')  # Preço unitário por região
    
    __table_args__ = (
        db.UniqueConstraint('item_id', 'regiao_numero', name='_item_regiao_uc'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'item_id': self.item_id,
            'regiao': self.regiao_numero,
            'inicial': self.quantidade_inicial,
            'gasto': self.quantidade_gasto,
            'preco': self.preco
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


class Detentora(db.Model):
    """Empresas detentoras de contratos"""
    __tablename__ = 'detentoras'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Dados do Contrato
    contrato_num = db.Column(db.String(100), nullable=False)
    data_assinatura = db.Column(db.String(20))
    prazo_vigencia = db.Column(db.String(20))
    
    # Dados da Empresa
    nome = db.Column(db.String(200), nullable=False)
    cnpj = db.Column(db.String(20), nullable=False)
    servico = db.Column(db.String(100), default='COFFEE BREAK')
    
    # Grupo (campo principal para seleção)
    grupo = db.Column(db.String(100), nullable=False, index=True)
    
    # Campos de auditoria
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    atualizado_em = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ativo = db.Column(db.Boolean, default=True)
    
    # Relacionamento com Ordens de Serviço
    ordens_servico = db.relationship('OrdemServico', backref='detentora_obj', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'contratoNum': self.contrato_num,
            'dataAssinatura': self.data_assinatura,
            'prazoVigencia': self.prazo_vigencia,
            'nome': self.nome,
            'cnpj': self.cnpj,
            'servico': self.servico,
            'grupo': self.grupo,
            'ativo': self.ativo,
            'criadoEm': self.criado_em.isoformat() if self.criado_em else None,
            'atualizadoEm': self.atualizado_em.isoformat() if self.atualizado_em else None
        }


class OrdemServico(db.Model):
    """Ordens de Serviço emitidas"""
    __tablename__ = 'ordens_servico'
    
    id = db.Column(db.Integer, primary_key=True)
    numero_os = db.Column(db.String(50), unique=True, nullable=False)
    
    # Referência à Detentora (opcional - mantém compatibilidade)
    detentora_id = db.Column(db.Integer, db.ForeignKey('detentoras.id'), nullable=True)
    
    # Dados do contrato (mantidos para compatibilidade com O.S. antigas)
    contrato = db.Column(db.String(100))
    data_assinatura = db.Column(db.String(100))  # Data da assinatura do contrato
    prazo_vigencia = db.Column(db.String(100))   # Ex: "12 MESES"
    detentora = db.Column(db.String(200))
    cnpj = db.Column(db.String(20))
    servico = db.Column(db.String(200))          # Ex: "COFFEE BREAK"
    grupo = db.Column(db.String(50))             # Número do grupo
    regiao_estoque = db.Column(db.Integer)       # Região do estoque (1-6) vinculada ao grupo
    
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
    motivo_exclusao = db.Column(db.Text)  # ✅ Motivo da exclusão registrado pelo admin
    data_exclusao = db.Column(db.DateTime)  # ✅ Data da exclusão
    
    # Relacionamentos
    itens = db.relationship('ItemOrdemServico', backref='ordem_servico', lazy=True, cascade='all, delete-orphan')
    movimentacoes = db.relationship('MovimentacaoEstoque', backref='ordem_servico', lazy=True, cascade='all, delete-orphan')
    
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
            'regiaoEstoque': self.regiao_estoque,  # Região do estoque vinculada
            'dataEmissao': self.data_emissao.isoformat() if self.data_emissao else None,
            'dataEmissaoCompleta': self.data_emissao_completa,
            'motivoExclusao': self.motivo_exclusao,  # ✅ Motivo da exclusão
            'dataExclusao': self.data_exclusao.isoformat() if self.data_exclusao else None  # ✅ Data da exclusão
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
    valor_unitario = db.Column(db.String(20), default='0')  # ✅ NOVO: Preço unitário do item na época da emissão
    
    def to_dict(self):
        return {
            'id': self.id,
            'categoria': self.categoria,
            'itemId': self.item_id,  # ✅ CORRIGIDO: retornar ID do banco, não código BEC
            'itemCodigo': self.item_codigo,  # ✅ Adicionar código BEC separado
            'itemBec': self.item_bec,
            'descricao': self.descricao,
            'unidade': self.unidade,
            'diarias': self.diarias or 1,
            'qtdSolicitada': self.quantidade_solicitada,
            'qtdTotal': self.quantidade_total,
            'valorUnit': self.valor_unitario or '0'  # ✅ NOVO: Retornar valor unitário
        }


class MovimentacaoEstoque(db.Model):
    """Histórico de movimentações de estoque vinculadas a O.S."""
    __tablename__ = 'movimentacoes_estoque'
    
    id = db.Column(db.Integer, primary_key=True)
    ordem_servico_id = db.Column(db.Integer, db.ForeignKey('ordens_servico.id', ondelete='CASCADE'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('itens.id'), nullable=False)
    estoque_regional_id = db.Column(db.Integer, db.ForeignKey('estoque_regional.id'), nullable=False)
    
    quantidade = db.Column(db.Float, nullable=False)  # Quantidade movimentada
    tipo = db.Column(db.String(20), nullable=False)  # 'SAIDA' ou 'ENTRADA' (reversão)
    data_movimentacao = db.Column(db.DateTime, default=datetime.utcnow)
    observacao = db.Column(db.Text)  # Motivo da movimentação (ex: "Emissão O.S. 1/2025")
    
    # Relacionamentos
    item = db.relationship('Item', backref='movimentacoes')
    estoque = db.relationship('EstoqueRegional', backref='movimentacoes')
    
    def to_dict(self):
        return {
            'id': self.id,
            'ordemServicoId': self.ordem_servico_id,
            'itemId': self.item_id,
            'estoqueRegionalId': self.estoque_regional_id,
            'quantidade': self.quantidade,
            'tipo': self.tipo,
            'dataMovimentacao': self.data_movimentacao.isoformat() if self.data_movimentacao else None,
            'observacao': self.observacao
        }


class Usuario(db.Model):
    """Modelo de Usuário do sistema"""
    __tablename__ = 'usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    senha_hash = db.Column(db.String(255), nullable=False)
    cargo = db.Column(db.String(100), nullable=True)  # Gestor, Operador, Fiscal, etc
    perfil = db.Column(db.String(20), default='comum', nullable=False)  # 'admin' ou 'comum'
    ativo = db.Column(db.Boolean, default=True)
    
    # Auditoria
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    atualizado_em = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ultimo_acesso = db.Column(db.DateTime, nullable=True)
    
    def set_senha(self, senha):
        """Define a senha (com hash)"""
        self.senha_hash = generate_password_hash(senha, method='pbkdf2:sha256')
    
    def verificar_senha(self, senha):
        """Verifica se a senha está correta"""
        return check_password_hash(self.senha_hash, senha)
    
    def is_admin(self):
        """Verifica se o usuário é administrador"""
        return self.perfil == 'admin'
    
    def to_dict(self):
        """Converte usuário para dicionário (sem dados sensíveis)"""
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'cargo': self.cargo,
            'perfil': self.perfil,
            'ativo': self.ativo,
            'criado_em': self.criado_em.isoformat() if self.criado_em else None,
            'atualizado_em': self.atualizado_em.isoformat() if self.atualizado_em else None,
            'ultimo_acesso': self.ultimo_acesso.isoformat() if self.ultimo_acesso else None
        }
    
    def __repr__(self):
        return f'<Usuario {self.email}>'


class Auditoria(db.Model):
    """Registro de auditoria de ações no sistema"""
    __tablename__ = 'auditoria'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    usuario_email = db.Column(db.String(100), nullable=False)  # Redundância para histórico
    usuario_nome = db.Column(db.String(100), nullable=False)
    
    acao = db.Column(db.String(50), nullable=False)  # 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
    modulo = db.Column(db.String(50), nullable=False)  # 'OS', 'ITEM', 'DETENTORA', 'USUARIO', 'AUTH'
    entidade_tipo = db.Column(db.String(50))  # Nome da tabela/modelo afetado
    entidade_id = db.Column(db.Integer)  # ID do registro afetado
    
    descricao = db.Column(db.Text, nullable=False)  # Descrição legível da ação
    dados_antes = db.Column(db.Text)  # JSON com dados antes da alteração (UPDATE/DELETE)
    dados_depois = db.Column(db.Text)  # JSON com dados depois da alteração (CREATE/UPDATE)
    
    ip_address = db.Column(db.String(45))  # IPv4 ou IPv6
    user_agent = db.Column(db.String(200))
    
    data_hora = db.Column(db.DateTime, nullable=False, default=get_datetime_br, index=True)
    
    # Relacionamento
    usuario = db.relationship('Usuario', backref='auditorias', foreign_keys=[usuario_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'usuario_email': self.usuario_email,
            'usuario_nome': self.usuario_nome,
            'acao': self.acao,
            'modulo': self.modulo,
            'entidade_tipo': self.entidade_tipo,
            'entidade_id': self.entidade_id,
            'descricao': self.descricao,
            'dados_antes': self.dados_antes,
            'dados_depois': self.dados_depois,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'data_hora': self.data_hora.isoformat() if self.data_hora else None
        }
    
    def __repr__(self):
        return f'<Auditoria {self.id} - {self.acao} {self.modulo} por {self.usuario_email}>'

