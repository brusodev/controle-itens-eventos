"""
Serviço de Controle de Estoque
Gerencia a movimentação de estoque vinculada às Ordens de Serviço
com validações rigorosas e rastreamento completo.
"""

from models import db, EstoqueRegional, MovimentacaoEstoque, Item
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
    gasto = converter_quantidade_para_float(estoque.quantidade_gasto)
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
    
    # Atualizar quantidade gasta
    gasto_atual = converter_quantidade_para_float(estoque.quantidade_gasto)
    novo_gasto = gasto_atual + quantidade
    
    # Validação adicional: garantir que não ultrapasse o inicial
    inicial = converter_quantidade_para_float(estoque.quantidade_inicial)
    if novo_gasto > inicial:
        raise ErroEstoqueInsuficiente(
            f"Operação resultaria em gasto ({formatar_quantidade(novo_gasto)}) "
            f"maior que o inicial ({formatar_quantidade(inicial)})"
        )
    
    estoque.quantidade_gasto = formatar_quantidade(novo_gasto)
    
    # Registrar movimentação
    movimentacao = MovimentacaoEstoque(
        ordem_servico_id=ordem_servico_id,
        item_id=item_id,
        estoque_regional_id=estoque.id,
        quantidade=quantidade,
        tipo='SAIDA',
        observacao=observacao or f"Baixa automática - O.S. {ordem_servico_id}"
    )
    db.session.add(movimentacao)
    
    return estoque, movimentacao


def reverter_baixa_estoque(ordem_servico_id):
    """
    Reverte todas as baixas de estoque de uma O.S. (útil para cancelamento/edição)
    
    Args:
        ordem_servico_id (int): ID da ordem de serviço
        
    Returns:
        int: Número de movimentações revertidas
    """
    # Buscar todas as movimentações de saída da O.S.
    movimentacoes = MovimentacaoEstoque.query.filter_by(
        ordem_servico_id=ordem_servico_id,
        tipo='SAIDA'
    ).all()
    
    total_revertido = 0
    
    for mov in movimentacoes:
        # Reverter no estoque
        estoque = EstoqueRegional.query.get(mov.estoque_regional_id)
        if estoque:
            gasto_atual = converter_quantidade_para_float(estoque.quantidade_gasto)
            novo_gasto = max(0.0, gasto_atual - mov.quantidade)
            estoque.quantidade_gasto = formatar_quantidade(novo_gasto)
            
            # Registrar movimentação de entrada (reversão)
            reversao = MovimentacaoEstoque(
                ordem_servico_id=ordem_servico_id,
                item_id=mov.item_id,
                estoque_regional_id=mov.estoque_regional_id,
                quantidade=mov.quantidade,
                tipo='ENTRADA',
                observacao=f"Reversão de movimentação #{mov.id}"
            )
            db.session.add(reversao)
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
    
    # FASE 1: Validar disponibilidade de TODOS os itens
    erros = []
    itens_validados = []
    
    for item_os in itens_os:
        item_id = item_os.item_id
        quantidade = item_os.quantidade_total
        
        valido, mensagem, estoque, disponivel = validar_disponibilidade_estoque(
            item_id, regiao_numero, quantidade
        )
        
        if not valido:
            erros.append(mensagem)
        else:
            itens_validados.append({
                'item_os': item_os,
                'item_id': item_id,
                'quantidade': quantidade,
                'estoque': estoque
            })
    
    # Se houver qualquer erro, não prosseguir
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
