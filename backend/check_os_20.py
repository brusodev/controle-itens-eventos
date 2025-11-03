import sqlite3

conn = sqlite3.connect('instance/controle_itens.db')
c = conn.cursor()

print('\n' + '='*70)
print('🔍 INVESTIGAÇÃO: O.S. 20/2025')
print('='*70 + '\n')

# Buscar ID da O.S.
c.execute("SELECT id, grupo FROM ordens_servico WHERE numero_os='20/2025'")
result = c.fetchone()

if not result:
    print('❌ O.S. não encontrada!')
    conn.close()
    exit()

os_id, grupo = result
print(f'ID da O.S.: {os_id}')
print(f'Grupo: {grupo}\n')

# Buscar itens
print('-'*70)
print('📦 ITENS CADASTRADOS NA O.S.:')
print('-'*70 + '\n')

c.execute("""
    SELECT item_id, descricao, quantidade_solicitada, diarias, quantidade_total
    FROM itens_ordem_servico
    WHERE ordem_servico_id = ?
""", (os_id,))

itens = c.fetchall()

for idx, item in enumerate(itens, 1):
    item_id, desc, qtd_sol, diarias, qtd_total = item
    
    print(f'Item #{idx}:')
    print(f'  item_id: {item_id}')
    print(f'  Descrição salva: "{desc}"')
    print(f'  Qtd solicitada: {qtd_sol}')
    print(f'  Diárias: {diarias}')
    print(f'  Qtd total: {qtd_total}')
    
    # Buscar descrição real do banco
    c.execute("SELECT descricao FROM itens WHERE id = ?", (item_id,))
    desc_real = c.fetchone()
    
    if desc_real:
        print(f'  >>> ITEM REAL: "{desc_real[0]}"')
        
        if desc != desc_real[0]:
            print(f'  ⚠️  ALERTA: DESCRIÇÕES DIFERENTES!')
    else:
        print(f'  ❌ Item não encontrado!')
    
    print()

# Verificar duplicações
print('-'*70)
print('🔍 ANÁLISE DE DUPLICAÇÃO:')
print('-'*70 + '\n')

item_ids = [i[0] for i in itens]

from collections import Counter
contador = Counter(item_ids)

duplicados = {k: v for k, v in contador.items() if v > 1}

if duplicados:
    print('⚠️  ITENS DUPLICADOS:')
    for item_id, count in duplicados.items():
        c.execute("SELECT descricao FROM itens WHERE id = ?", (item_id,))
        desc = c.fetchone()[0]
        print(f'  - Item ID {item_id} ("{desc}"): aparece {count} vezes')
else:
    print('✅ Nenhum item duplicado')

# Mostrar IDs de referência
print('\n' + '-'*70)
print('📋 REFERÊNCIA - IDs DOS ITENS:')
print('-'*70 + '\n')

c.execute("SELECT id, descricao FROM itens WHERE descricao LIKE '%Coffee Break%' OR descricao LIKE '%Água%' ORDER BY id")
refs = c.fetchall()

for item_id, desc in refs:
    print(f'  ID {item_id}: {desc}')

print('\n' + '='*70 + '\n')

conn.close()
