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


class ErroQuantidadeInvalida(ValueError):
    """Quantidade em formato irreconhecivel vinda de payload/formulario."""
    pass


def converter_quantidade_para_float(quantidade_str, estrito=False):
    """
    Converte quantidade de ENTRADA (payload JSON, formulario) para float.

    As quantidades sao Numeric no banco -- esta funcao existe para o que chega
    de fora, onde ainda vem texto. Desambigua os dois formatos:

        '1.250,50' -> 1250.5   (BR: ponto = milhar, virgula = decimal)
        '1250.50'  -> 1250.5   (en-US: ponto = decimal)
        '20.000'   -> 20000.0  (BR: milhar, 3 digitos apos o ponto)
        '10.5'     -> 10.5     (decimal, nao 105 como na versao anterior)

    A versao antiga removia TODO ponto e todo sinal '-', entao '10.5' virava
    105 e '-50' virava 50, e devolvia 0.0 para qualquer entrada invalida --
    mascarando erro em vez de reporta-lo.

    Args:
        quantidade_str: valor a converter
        estrito (bool): se True, levanta ErroQuantidadeInvalida em vez de
                        devolver 0.0 para entrada irreconhecivel

    Returns:
        float
    """
    if quantidade_str is None:
        if estrito:
            raise ErroQuantidadeInvalida('Quantidade ausente')
        return 0.0

    if isinstance(quantidade_str, (int, float)):
        return float(quantidade_str)

    texto = str(quantidade_str).strip().replace(' ', '')

    if not texto or texto in ('__', 'None'):
        if estrito:
            raise ErroQuantidadeInvalida(
                'Quantidade invalida: {!r}'.format(quantidade_str))
        return 0.0

    negativo = texto.startswith('-')
    texto = texto.lstrip('+-')

    if not texto.replace(',', '').replace('.', '').isdigit():
        if estrito:
            raise ErroQuantidadeInvalida(
                'Quantidade invalida: {!r}'.format(quantidade_str))
        return 0.0

    if ',' in texto:
        # Virgula presente: formato BR, ponto e separador de milhar.
        texto = texto.replace('.', '').replace(',', '.')
    elif texto.count('.') > 1:
        # Mais de um ponto: so pode ser separador de milhar (1.234.567)
        texto = texto.replace('.', '')
    elif '.' in texto:
        inteiro, _, decimal = texto.partition('.')
        # Exatamente 3 digitos apos o ponto e sem outro separador: milhar BR
        # ('20.000'). Caso contrario e decimal ('10.5', '1250.50').
        if len(decimal) == 3 and inteiro:
            texto = inteiro + decimal

    try:
        numero = float(texto)
    except ValueError:
        if estrito:
            raise ErroQuantidadeInvalida(
                'Quantidade invalida: {!r}'.format(quantidade_str))
        return 0.0

    return -numero if negativo else numero


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


def subquery_gasto_ledger(estoque_id_col, rotulo='gasto_ledger'):
    """
    Expressao SQL (scalar subquery) do consumo derivado do ledger, para uso em
    consultas/relatorios: SUM(SAIDA) - SUM(ENTRADA) correlacionado ao estoque.

    Mantem os relatorios na MESMA fonte de verdade da validacao de emissao (o
    ledger), em vez do cache quantidade_gasto -- que pode divergir. Uso:

        gasto = subquery_gasto_ledger(EstoqueRegional.id)
        query = db.session.query(..., gasto)
        ...
        valor = row.gasto_ledger

    Args:
        estoque_id_col: coluna do estoque_regional.id na consulta externa
        rotulo (str): label da coluna resultante
    """
    return (
        db.select(
            func.coalesce(
                func.sum(
                    case(
                        (MovimentacaoEstoque.tipo == 'SAIDA', MovimentacaoEstoque.quantidade),
                        else_=-MovimentacaoEstoque.quantidade,
                    )
                ),
                0.0,
            )
        )
        .where(MovimentacaoEstoque.estoque_regional_id == estoque_id_col)
        .correlate_except(MovimentacaoEstoque)
        .scalar_subquery()
        .label(rotulo)
    )


def sincronizar_cache_gasto(estoque):
    """
    Realinha o cache quantidade_gasto com o ledger.

    Nao faz commit -- cabe ao chamador, como no resto deste modulo.
    """
    gasto = calcular_gasto_ledger(estoque.id)
    estoque.quantidade_gasto = max(0.0, gasto)
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
    
    inicial = float(estoque.quantidade_inicial or 0)
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
    inicial = float(estoque.quantidade_inicial or 0)
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
        inicial = float(estoque.quantidade_inicial or 0)
        gasto = calcular_gasto_ledger(estoque.id)
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
