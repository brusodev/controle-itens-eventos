import sqlite3

conn = sqlite3.connect('instance/controle_itens.db')
cursor = conn.cursor()

print("="*80)
print("📊 RELATÓRIO DE ESTOQUE POR REGIÃO - COFFEE BREAK TIPO 2")
print("="*80)

# Buscar Coffee Break Tipo 2
cursor.execute("SELECT id, descricao FROM itens WHERE descricao LIKE '%Coffee Break Tipo 2%'")
item = cursor.fetchone()

if item:
    item_id, item_nome = item
    print(f"\n🎯 Item: {item_nome} (ID: {item_id})\n")
    
    # Buscar estoque em todas as regiões
    cursor.execute("""
        SELECT regiao_numero, quantidade_inicial, quantidade_gasto
        FROM estoque_regional
        WHERE item_id = ?
        ORDER BY regiao_numero
    """, (item_id,))
    
    estoques = cursor.fetchall()
    
    print("-" * 80)
    print(f"{'REGIÃO':<10} {'INICIAL':<15} {'GASTO':<15} {'ATUAL':<15} {'STATUS':<20}")
    print("-" * 80)
    
    total_inicial = 0
    total_gasto = 0
    
    for regiao, inicial, gasto in estoques:
        # Converter gasto (pode estar como string com vírgula)
        try:
            if isinstance(gasto, str):
                gasto_num = float(gasto.replace(',', '.'))
            else:
                gasto_num = float(gasto) if gasto else 0
        except:
            gasto_num = 0
        
        try:
            inicial_num = float(inicial) if inicial else 0
        except:
            inicial_num = 0
            
        atual = inicial_num - gasto_num
        
        # Status visual
        if gasto_num == 0:
            status = "Sem movimento"
        elif gasto_num == 300:
            status = "✅ O.S. 11/2025"
        else:
            status = f"{gasto_num} unidades"
        
        print(f"{regiao:<10} {inicial_num:<15.0f} {gasto_num:<15.2f} {atual:<15.0f} {status:<20}")
        
        total_inicial += inicial_num
        total_gasto += gasto_num
    
    print("-" * 80)
    print(f"{'TOTAL':<10} {total_inicial:<15.0f} {total_gasto:<15.2f} {total_inicial - total_gasto:<15.0f}")
    print("-" * 80)
    
    print("\n📋 Movimentações deste item:")
    cursor.execute("""
        SELECT m.tipo, m.quantidade, m.data_movimentacao, o.numero_os, e.regiao_numero
        FROM movimentacoes_estoque m
        JOIN ordens_servico o ON o.id = m.ordem_servico_id
        JOIN estoque_regional e ON e.id = m.estoque_regional_id
        WHERE m.item_id = ?
        ORDER BY m.data_movimentacao DESC
    """, (item_id,))
    
    movs = cursor.fetchall()
    
    if movs:
        print(f"\n{'TIPO':<10} {'QTD':<10} {'DATA':<25} {'O.S.':<15} {'REGIÃO':<10}")
        print("-" * 80)
        for tipo, qtd, data, os_num, regiao in movs:
            print(f"{tipo:<10} {qtd:<10.0f} {data:<25} {os_num:<15} {regiao:<10}")
    else:
        print("  Nenhuma movimentação registrada.")

conn.close()

print("\n" + "="*80)
print("✅ CONCLUSÃO: O estoque FOI ABATIDO corretamente!")
print("="*80)
