import sqlite3

conn = sqlite3.connect('instance/controle_itens.db')
cursor = conn.cursor()

print("="*100)
print("📊 RELATÓRIO COMPLETO DE ESTOQUE - TODAS AS REGIÕES")
print("="*100)

# Buscar todos os itens com estoque
cursor.execute("""
    SELECT DISTINCT i.id, i.descricao, c.nome as categoria
    FROM itens i
    JOIN categorias c ON c.id = i.categoria_id
    ORDER BY i.id
""")

itens = cursor.fetchall()

for item_id, descricao, categoria in itens:
    print(f"\n{'='*100}")
    print(f"🏷️  ITEM {item_id}: {descricao}")
    print(f"   Categoria: {categoria}")
    print(f"{'='*100}")
    
    # Buscar estoque regional
    cursor.execute("""
        SELECT regiao_numero, quantidade_inicial, quantidade_gasto
        FROM estoque_regional
        WHERE item_id = ?
        ORDER BY regiao_numero
    """, (item_id,))
    
    estoques = cursor.fetchall()
    
    if not estoques:
        print("   ⚠️ Sem estoque cadastrado")
        continue
    
    print(f"\n{'REGIÃO':<10} {'INICIAL':<15} {'GASTO':<15} {'DISPONÍVEL':<15}")
    print("-" * 60)
    
    total_inicial = 0
    total_gasto = 0
    
    for regiao, inicial, gasto in estoques:
        try:
            if isinstance(inicial, str):
                inicial_num = float(inicial.replace('.', '').replace(',', '.'))
            else:
                inicial_num = float(inicial) if inicial else 0
                
            if isinstance(gasto, str):
                gasto_num = float(gasto.replace(',', '.'))
            else:
                gasto_num = float(gasto) if gasto else 0
        except:
            inicial_num = 0
            gasto_num = 0
        
        disponivel = inicial_num - gasto_num
        
        # Destacar se tiver gasto
        if gasto_num > 0:
            print(f"{regiao:<10} {inicial_num:<15,.0f} {gasto_num:<15,.2f} {disponivel:<15,.0f} ⚠️ ABATIDO")
        else:
            print(f"{regiao:<10} {inicial_num:<15,.0f} {gasto_num:<15,.2f} {disponivel:<15,.0f}")
        
        total_inicial += inicial_num
        total_gasto += gasto_num
    
    print("-" * 60)
    print(f"{'TOTAL':<10} {total_inicial:<15,.0f} {total_gasto:<15,.2f} {total_inicial - total_gasto:<15,.0f}")
    
    # Mostrar movimentações se houver
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
        print(f"\n📦 Movimentações:")
        for tipo, qtd, data, os_num, regiao in movs:
            print(f"   • {tipo}: {qtd:.0f} unidades (O.S. {os_num}) - Região {regiao} - {data}")

conn.close()

print("\n" + "="*100)
print("✅ FIM DO RELATÓRIO")
print("="*100)
