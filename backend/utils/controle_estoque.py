"""
Serviço de Controle de Estoque
Gerencia a movimentação de estoque vinculada às Ordens de Serviço
com validações rigorosas e rastreamento completo.
"""

from models import db, EstoqueRegional, MovimentacaoEstoque, Item
from sqlalchemy import func, case
from collections import defaultdict
from datetime import datetime


class ErroEstoqueInsuficiente(Exception):
    """Exceção levantada quando não há estoque suficiente"""
    pass


class ErroRegiaoInvalida(Exception):
    """Exceção levantada quando a região especificada é inválida"""
    pass


def validar_regiao(regiao_numero):
    """
    Valida se a região está no intervalo permitido (1-6)
    
    Args:
        regiao_numero (int): Número da região
        
    Raises:
        ErroRegiaoInvalida: Se a região não estiver entre 1 e 6
    """
    if not regiao_numero or regiao_numero < 1 or regiao_numero > 6:
        raise ErroRegiaoInvalida(f"Região {regiao_numero} inválida. Deve estar entre 1 e 6.")


def converter_quantidade_para_float(quantidade_str):
    """
    Converte string de quantidade para float
    Suporta formatos: "1.000,50" ou "1000.50"
    Trata valores inválidos como '__', None, strings vazias
    
    Args:
        quantidade_str (str): Quantidade em formato string
        
    Returns:
        float: Quantidade convertida (0.0 para valores inválidos)
    """
    try:
        if isinstance(quantidade_str, (int, float)):
            return float(quantidade_str) if quantidade_str else 0.0
        
        # Converter para string e limpar
        quantidade_str = str(quantidade_str or '0').strip()
        
        # Verificar se é um valor inválido
        if not quantidade_str or quantidade_str == '__' or quantidade_str == 'None':
            return 0.0
        
        # Remover espaços e hífens desnecessários
        quantidade_str = quantidade_str.replace(' ', '').replace('-', '')
        
        # Se ficar vazio após limpeza, retornar 0
        if not quantidade_str or quantidade_str == '__' or not quantidade_str.replace(',', '').replace('.', ''):
            return 0.0
        
        # Remove pontos de milhar e converte vírgula para ponto
        return float(quantidade_str.replace('.', '').replace(',', '.'))
    except (ValueError, AttributeError, TypeError):
        return 0.0


def formatar_quantidade(quantidade_float):
    """
    Formata float para string no padrão brasileiro
    
    Args:
        quantidade_float (float): Quantidade em float
        
    Returns:
        str: Quantidade formatada (ex: "1.250,50")
    """
    return f"{quantidade_float:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')


def calcular_gasto_ledger(estoque_regional_id):
    """
    Consumo real de um estoque, derivado das movimentacoes.

    Esta e a UNICA fonte de verdade do saldo: soma(SAIDA) - soma(ENTRADA).
    O campo EstoqueRegional.quantidade_gasto e apenas um cache denormalizado
    mantido a partir daqui, nunca por acumulacao cega.

    Args:
        estoque_regional_id (int): ID do registro de estoque regional

    Returns:
        float: quantidade consumida (>= 0)
    """
    if not estoque_regional_id:
        return 0.0

    total = db.session.query(
        func.coalesce(
            func.sum(
                case(
                    (MovimentacaoEstoque.tipo == 'SAIDA', MovimentacaoEstoque.quantidade),
                    else_=-MovimentacaoEstoque.quantidade,
                )
            ),
            0.0,
        )
    ).filter(
        MovimentacaoEstoque.estoque_regional_id == estoque_regional_id
    ).scalar()

    return float(total or 0.0)


def sincronizar_cache_gasto(estoque):
    """
    Realinha o cache quantidade_gasto com o ledger.

    Nao faz commit -- cabe ao chamador, como no resto deste modulo.
    """
    gasto = calcular_gasto_ledger(estoque.id)
    estoque.quantidade_gasto = formatar_quantidade(gasto)
    return gasto


def obter_estoque_disponivel(item_id, regiao_numero):
    """
    Obtém a quantidade disponível de um item em uma região específica
    
    Args:
        item_id (int): ID do item
        regiao_numero (int): Número da região (1-6)
        
    Returns:
        tuple: (EstoqueRegional, float disponível)
        
    Raises:
        ErroRegiaoInvalida: Se a região for inválida
    """
    validar_regiao(regiao_numero)
    
    estoque = EstoqueRegional.query.filter_by(
        item_id=item_id,
        regiao_numero=regiao_numero
    ).first()
    
    if not estoque:
        # Se não existe estoque para essa região/item, criar com valores zerados
        return None, 0.0
    
    inicial = converter_quantidade_para_float(estoque.quantidade_inicial)
    # Saldo derivado do ledger, nunca do cache quantidade_gasto: o cache pode
    # estar dessincronizado (ajuste manual, dados legados), o ledger nao.
    gasto = calcular_gasto_ledger(estoque.id)
    disponivel = inicial - gasto

    return estoque, max(0.0, disponivel)


def validar_disponibilidade_estoque(item_id, regiao_numero, quantidade_necessaria):
    """
    Valida se há estoque suficiente disponível
    
    Args:
        item_id (int): ID do item
        regiao_numero (int): Número da região
        quantidade_necessaria (float): Quantidade que será consumida
        
    Returns:
        tuple: (bool é_valido, str mensagem, EstoqueRegional estoque, float disponivel)
        
    Raises:
        ErroRegiaoInvalida: Se a região for inválida
    """
    estoque, disponivel = obter_estoque_disponivel(item_id, regiao_numero)
    
    if not estoque:
        item = Item.query.get(item_id)
        item_desc = item.descricao if item else f"Item ID {item_id}"
        return False, f"Estoque não configurado para {item_desc} na região {regiao_numero}", None, 0.0
    
    if disponivel < quantidade_necessaria:
        item = Item.query.get(item_id)
        item_desc = item.descricao if item else f"Item ID {item_id}"
        return False, (
            f"Estoque insuficiente para {item_desc} na região {regiao_numero}. "
            f"Disponível: {formatar_quantidade(disponivel)}, "
            f"Necessário: {formatar_quantidade(quantidade_necessaria)}"
        ), estoque, disponivel
    
    return True, "OK", estoque, disponivel


def dar_baixa_estoque(ordem_servico_id, item_id, regiao_numero, quantidade, observacao=None):
    """
    Dá baixa no estoque de um item específico em uma região
    Registra a movimentação para rastreamento
    
    Args:
        ordem_servico_id (int): ID da ordem de serviço
        item_id (int): ID do item
        regiao_numero (int): Número da região (1-6)
        quantidade (float): Quantidade a ser baixada
        observacao (str, optional): Observação sobre a movimentação
        
    Raises:
        ErroRegiaoInvalida: Se a região for inválida
        ErroEstoqueInsuficiente: Se não houver estoque suficiente
    """
    # Validar disponibilidade
    valido, mensagem, estoque, disponivel = validar_disponibilidade_estoque(
        item_id, regiao_numero, quantidade
    )
    
    if not valido:
        raise ErroEstoqueInsuficiente(mensagem)
    
    # Consumo apos esta baixa, calculado a partir do ledger
    gasto_atual = calcular_gasto_ledger(estoque.id)
    novo_gasto = gasto_atual + quantidade

    # Validacao adicional: garantir que nao ultrapasse o inicial
    inicial = converter_quantidade_para_float(estoque.quantidade_inicial)
    if novo_gasto > inicial:
        raise ErroEstoqueInsuficiente(
            f"Operacao resultaria em gasto ({formatar_quantidade(novo_gasto)}) "
            f"maior que o inicial ({formatar_quantidade(inicial)})"
        )

    # Registrar movimentacao PRIMEIRO: o ledger e a fonte de verdade
    movimentacao = MovimentacaoEstoque(
        ordem_servico_id=ordem_servico_id,
        item_id=item_id,
        estoque_regional_id=estoque.id,
        quantidade=quantidade,
        tipo='SAIDA',
        observacao=observacao or f"Baixa automatica - O.S. {ordem_servico_id}"
    )
    db.session.add(movimentacao)
    db.session.flush()

    # Cache derivado do ledger ja com a movimentacao acima incluida
    sincronizar_cache_gasto(estoque)

    return estoque, movimentacao


def calcular_consumo_liquido_os(ordem_servico_id, estoque_regional_id):
    """
    Consumo liquido VIGENTE de uma O.S. sobre um estoque especifico.

    SAIDA - ENTRADA restrito a esta O.S. Se a O.S. ja foi revertida, o
    resultado e 0 -- e por isso que reverter duas vezes nao credita nada.
    """
    total = db.session.query(
        func.coalesce(
            func.sum(
                case(
                    (MovimentacaoEstoque.tipo == 'SAIDA', MovimentacaoEstoque.quantidade),
                    else_=-MovimentacaoEstoque.quantidade,
                )
            ),
            0.0,
        )
    ).filter(
        MovimentacaoEstoque.ordem_servico_id == ordem_servico_id,
        MovimentacaoEstoque.estoque_regional_id == estoque_regional_id,
    ).scalar()

    return float(total or 0.0)


def reverter_baixa_estoque(ordem_servico_id):
    """
    Devolve ao estoque o consumo vigente de uma O.S. (edicao/cancelamento/exclusao).

    IDEMPOTENTE. A versao anterior somava TODAS as movimentacoes 'SAIDA' da O.S.,
    inclusive as ja revertidas por edicoes anteriores, e devolvia N x a quantidade
    original -- criando saldo fantasma que permitia emitir O.S. acima do contrato.

    Agora reverte o liquido (SAIDA - ENTRADA) por estoque_regional: se nada esta
    consumido, nada e devolvido.

    Args:
        ordem_servico_id (int): ID da ordem de servico

    Returns:
        int: numero de estoques efetivamente revertidos
    """
    # Estoques distintos tocados por esta O.S.
    estoque_ids = [
        row[0]
        for row in db.session.query(MovimentacaoEstoque.estoque_regional_id)
        .filter(MovimentacaoEstoque.ordem_servico_id == ordem_servico_id)
        .distinct()
        .all()
    ]

    total_revertido = 0

    for estoque_regional_id in estoque_ids:
        liquido = calcular_consumo_liquido_os(ordem_servico_id, estoque_regional_id)

        # Nada consumido (ja revertido, ou zerado): nao ha o que devolver.
        if liquido <= 0:
            continue

        estoque = EstoqueRegional.query.get(estoque_regional_id)
        if not estoque:
            continue

        # Item de referencia para a movimentacao compensatoria
        ultima = (
            MovimentacaoEstoque.query
            .filter_by(ordem_servico_id=ordem_servico_id,
                       estoque_regional_id=estoque_regional_id)
            .order_by(MovimentacaoEstoque.id.desc())
            .first()
        )

        reversao = MovimentacaoEstoque(
            ordem_servico_id=ordem_servico_id,
            item_id=ultima.item_id if ultima else estoque.item_id,
            estoque_regional_id=estoque_regional_id,
            quantidade=liquido,
            tipo='ENTRADA',
            observacao=f"Reversao do consumo vigente da O.S. {ordem_servico_id}"
        )
        db.session.add(reversao)
        db.session.flush()

        # Cache derivado do ledger ja com a reversao incluida
        sincronizar_cache_gasto(estoque)
        total_revertido += 1

    return total_revertido


def processar_baixas_os(ordem_servico_id, itens_os, regiao_numero, numero_os=None):
    """
    Processa todas as baixas de estoque para uma O.S.
    Valida disponibilidade de TODOS os itens ANTES de fazer qualquer baixa
    
    Args:
        ordem_servico_id (int): ID da ordem de serviço
        itens_os (list): Lista de itens da O.S. com quantidade_total
        regiao_numero (int): Número da região do grupo
        numero_os (str, optional): Número da O.S. para mensagens
        
    Returns:
        list: Lista de movimentações criadas
        
    Raises:
        ErroRegiaoInvalida: Se a região for inválida
        ErroEstoqueInsuficiente: Se algum item não tiver estoque suficiente
    """
    validar_regiao(regiao_numero)

    # FASE 1: Validar disponibilidade de TODOS os itens.
    # Agrupa por item_id antes de comparar: duas linhas do mesmo item na mesma
    # O.S. consomem o mesmo saldo, e validar cada uma isoladamente contra o
    # saldo cheio deixaria passar o dobro do disponivel.
    erros = []
    itens_validados = []

    quantidade_por_item = defaultdict(float)
    for item_os in itens_os:
        quantidade_por_item[item_os.item_id] += float(item_os.quantidade_total or 0)

    for item_id, quantidade_agregada in quantidade_por_item.items():
        valido, mensagem, estoque, disponivel = validar_disponibilidade_estoque(
            item_id, regiao_numero, quantidade_agregada
        )
        if not valido:
            erros.append(mensagem)

    if not erros:
        for item_os in itens_os:
            itens_validados.append({
                'item_os': item_os,
                'item_id': item_os.item_id,
                'quantidade': item_os.quantidade_total,
                'estoque': None,
            })

    # Se houver qualquer erro, nao prosseguir
    if erros:
        raise ErroEstoqueInsuficiente(
            f"Não foi possível emitir a O.S. devido a problemas de estoque:\n" + 
            "\n".join(f"• {erro}" for erro in erros)
        )
    
    # FASE 2: Realizar as baixas (só chega aqui se TUDO estiver OK)
    movimentacoes = []
    numero_os_label = numero_os or ordem_servico_id
    
    for item_validado in itens_validados:
        item_os = item_validado['item_os']
        estoque, movimentacao = dar_baixa_estoque(
            ordem_servico_id=ordem_servico_id,
            item_id=item_validado['item_id'],
            regiao_numero=regiao_numero,
            quantidade=item_validado['quantidade'],
            observacao=f"Emissão O.S. {numero_os_label} - {item_os.descricao}"
        )
        movimentacoes.append(movimentacao)
    
    return movimentacoes


def obter_relatorio_estoque_por_regiao(regiao_numero):
    """
    Gera relatório de estoque de uma região específica
    
    Args:
        regiao_numero (int): Número da região
        
    Returns:
        list: Lista de dicionários com informações de estoque
    """
    validar_regiao(regiao_numero)
    
    estoques = EstoqueRegional.query.filter_by(regiao_numero=regiao_numero).all()
    
    relatorio = []
    for estoque in estoques:
        inicial = converter_quantidade_para_float(estoque.quantidade_inicial)
        gasto = converter_quantidade_para_float(estoque.quantidade_gasto)
        disponivel = inicial - gasto
        percentual_usado = (gasto / inicial * 100) if inicial > 0 else 0
        
        item = Item.query.get(estoque.item_id)
        
        relatorio.append({
            'item_id': estoque.item_id,
            'item_descricao': item.descricao if item else 'N/A',
            'item_codigo': item.item_codigo if item else 'N/A',
            'unidade': item.unidade if item else 'N/A',
            'inicial': formatar_quantidade(inicial),
            'inicial_float': inicial,
            'gasto': formatar_quantidade(gasto),
            'gasto_float': gasto,
            'disponivel': formatar_quantidade(disponivel),
            'disponivel_float': disponivel,
            'percentual_usado': round(percentual_usado, 2),
            'status': 'CRÍTICO' if disponivel <= 0 else 'BAIXO' if percentual_usado > 80 else 'OK'
        })
    
    return sorted(relatorio, key=lambda x: x['percentual_usado'], reverse=True)
