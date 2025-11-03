import sqlite3

conn = sqlite3.connect('instance/controle_itens.db')
c = conn.cursor()

print("\n=== ITENS DE ÁGUA NO BANCO ===\n")

c.execute('''
    SELECT id, descricao, item_codigo
    FROM itens
    WHERE descricao LIKE '%gua%'
    ORDER BY id
''')

result = c.fetchall()

for r in result:
    print(f"ID: {r[0]}")
    print(f"Descrição: {r[1]}")
    print(f"Código BEC: {r[2]}")
    print("-" * 60)

conn.close()
