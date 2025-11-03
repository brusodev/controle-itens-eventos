import sqlite3

conn = sqlite3.connect('instance/controle_itens.db')
c = conn.cursor()

print("\n=== VERIFICAÇÃO O.S. 4/2025 ===\n")

# IDs salvos
c.execute('SELECT id, descricao, item_codigo FROM itens WHERE id IN (13, 16)')
print("IDs SALVOS NA O.S.:")
for i in c.fetchall():
    print(f'  ID {i[0]}: {i[1]} (código: {i[2]})')

# Itens corretos
print("\nITENS CORRETOS (busca por descrição):")
c.execute('SELECT id, descricao, item_codigo FROM itens WHERE descricao LIKE "%Kit%" OR descricao LIKE "%gua mineral em copos%"')
for i in c.fetchall():
    print(f'  ID {i[0]}: {i[1]} (código: {i[2]})')

# Detalhes da O.S.
print("\nDETALHES DA O.S. 4/2025:")
c.execute('''
    SELECT ios.id, ios.item_id, ios.descricao, ios.quantidade_solicitada, i.descricao as desc_real
    FROM itens_ordem_servico ios
    LEFT JOIN itens i ON ios.item_id = i.id
    WHERE ios.ordem_servico_id = 4
''')
for row in c.fetchall():
    print(f'\n  Registro ID: {row[0]}')
    print(f'  Item ID salvo: {row[1]}')
    print(f'  Descrição salva na O.S.: {row[2]}')
    print(f'  Quantidade: {row[3]}')
    print(f'  Descrição REAL do item ID={row[1]}: {row[4]}')
    if row[2] != row[4]:
        print(f'  ❌ DIVERGÊNCIA!')

conn.close()
