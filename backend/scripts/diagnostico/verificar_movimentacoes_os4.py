import sqlite3

conn = sqlite3.connect('instance/controle_itens.db')
c = conn.cursor()

print("\n=== MOVIMENTAÇÕES DA O.S. 4/2025 ===\n")

c.execute('''
    SELECT m.id, m.item_id, i.descricao, m.quantidade, m.tipo, m.data_movimentacao
    FROM movimentacoes_estoque m
    LEFT JOIN itens i ON m.item_id = i.id
    WHERE m.ordem_servico_id = 4
    ORDER BY m.id
''')

movs = c.fetchall()

if movs:
    for mov in movs:
        print(f"ID: {mov[0]}")
        print(f"Item ID: {mov[1]} - {mov[2]}")
        print(f"Quantidade: {mov[3]}")
        print(f"Tipo: {mov[4]}")
        print(f"Data: {mov[5]}")
        print("-" * 50)
else:
    print("❌ Nenhuma movimentação encontrada!")

print("\n=== ESTOQUE ATUAL - ÁGUA 200ML (REGIÃO 1) ===\n")

c.execute('''
    SELECT quantidade_gasto, quantidade_disponivel
    FROM estoque_regional
    WHERE item_id = 5 AND regiao_numero = 1
''')

estoque = c.fetchone()
if estoque:
    print(f"Gasto: {estoque[0]}")
    print(f"Disponível: {estoque[1]}")

conn.close()
