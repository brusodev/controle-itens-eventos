import sqlite3

conn = sqlite3.connect('instance/controle_itens.db')
c = conn.cursor()

# Buscar O.S. 5/2025
c.execute('SELECT id, numero_os, grupo, data_emissao FROM ordens_servico WHERE numero_os = "5/2025"')
os = c.fetchone()

if not os:
    print("\n❌ O.S. 5/2025 NÃO ENCONTRADA!")
    conn.close()
    exit()

print(f'\n=== O.S. 5/2025 ===\n')
print(f'ID: {os[0]}')
print(f'Número: {os[1]}')
print(f'Grupo: {os[2]}')
print(f'Data: {os[3]}')

# Buscar itens
c.execute('''
    SELECT ios.id, ios.item_id, i.descricao as desc_real, ios.descricao as desc_salva, 
           ios.quantidade_solicitada, ios.item_bec
    FROM itens_ordem_servico ios
    LEFT JOIN itens i ON ios.item_id = i.id
    WHERE ios.ordem_servico_id = ?
''', (os[0],))

print(f'\n=== ITENS DA O.S. ===')
itens = c.fetchall()
for it in itens:
    print(f'\nRegistro {it[0]}:')
    print(f'  item_id: {it[1]}')
    print(f'  Desc REAL (banco ID={it[1]}): {it[2]}')
    print(f'  Desc SALVA (O.S.): {it[3]}')
    print(f'  Quantidade: {it[4]}')
    print(f'  Item BEC: {it[5]}')
    if it[2] != it[3]:
        print(f'  ❌ DIVERGÊNCIA!')
    else:
        print(f'  ✅ OK')

# Buscar movimentações
c.execute('SELECT COUNT(*) FROM movimentacoes_estoque WHERE ordem_servico_id = ?', (os[0],))
mov_count = c.fetchone()[0]

print(f'\n=== MOVIMENTAÇÕES ===')
print(f'Total: {mov_count}')

if mov_count > 0:
    c.execute('''
        SELECT m.id, m.item_id, i.descricao, m.quantidade, m.tipo
        FROM movimentacoes_estoque m
        LEFT JOIN itens i ON m.item_id = i.id
        WHERE m.ordem_servico_id = ?
    ''', (os[0],))
    
    print('\nDetalhes:')
    for mov in c.fetchall():
        print(f'  Mov {mov[0]}: Item {mov[1]} ({mov[2]}) - {mov[3]} unidades - {mov[4]}')

# Verificar qual deveria ser o ID correto da água 200ml
print('\n=== VERIFICAÇÃO - ÁGUA 200ML ===')
c.execute('SELECT id, descricao, item_codigo FROM itens WHERE descricao LIKE "%gua mineral em copos de 200%"')
agua = c.fetchone()
if agua:
    print(f'ID correto: {agua[0]}')
    print(f'Descrição: {agua[1]}')
    print(f'Código: {agua[2]}')
    
    # Verificar estoque atual
    c.execute('SELECT quantidade_gasto FROM estoque_regional WHERE item_id = ? AND regiao_numero = ?', (agua[0], os[2]))
    est = c.fetchone()
    if est:
        print(f'Estoque Região {os[2]} - Gasto atual: {est[0]}')

conn.close()
