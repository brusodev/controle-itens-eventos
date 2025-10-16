import sqlite3

conn = sqlite3.connect('instance/controle_itens.db')
cursor = conn.cursor()

print("="*80)
print("🔍 INVESTIGAÇÃO DA O.S. 12/2025")
print("="*80)

# Buscar dados da O.S.
cursor.execute("""
    SELECT id, numero_os, grupo, regiao_estoque
    FROM ordens_servico
    WHERE numero_os = '12/2025'
""")
os_data = cursor.fetchone()

print(f"\n📋 O.S. 12/2025:")
print(f"   ID: {os_data[0]}")
print(f"   Número: {os_data[1]}")
print(f"   Grupo: {os_data[2]}")
print(f"   Região Estoque (salva): {os_data[3]}")

# Buscar movimentação
cursor.execute("""
    SELECT m.tipo, m.quantidade, e.regiao_numero, i.descricao, e.id as estoque_id
    FROM movimentacoes_estoque m
    JOIN estoque_regional e ON e.id = m.estoque_regional_id
    JOIN itens i ON i.id = m.item_id
    WHERE m.ordem_servico_id = ?
""", (os_data[0],))

mov = cursor.fetchone()

print(f"\n📦 Movimentação de Estoque:")
print(f"   Item: {mov[3]}")
print(f"   Tipo: {mov[0]}")
print(f"   Quantidade: {mov[1]}")
print(f"   Região ABATIDA: {mov[2]}")
print(f"   Estoque ID: {mov[4]}")

print("\n" + "="*80)
if os_data[3] == mov[2]:
    print("✅ CORRETO: Região abatida corresponde ao grupo da O.S.")
else:
    print("❌ PROBLEMA IDENTIFICADO!")
    print(f"   Grupo da O.S.: {os_data[2]}")
    print(f"   Região esperada: {os_data[3]}")
    print(f"   Região abatida: {mov[2]} ❌")
    print(f"\n   O sistema deveria abatem da região {os_data[3]}, mas abateu da região {mov[2]}!")

# Verificar estoques da Água 500ml em todas as regiões
print("\n" + "="*80)
print("📊 ESTOQUE DE ÁGUA 500ML EM TODAS AS REGIÕES")
print("="*80)

cursor.execute("""
    SELECT id FROM itens
    WHERE descricao LIKE '%gua%500%'
""")
item_id = cursor.fetchone()[0]

cursor.execute("""
    SELECT regiao_numero, quantidade_inicial, quantidade_gasto
    FROM estoque_regional
    WHERE item_id = ?
    ORDER BY regiao_numero
""", (item_id,))

print(f"\n{'REGIÃO':<10} {'INICIAL':<15} {'GASTO':<15} {'DISPONÍVEL':<15}")
print("-" * 60)

for regiao, inicial, gasto in cursor.fetchall():
    inicial_num = float(inicial.replace('.', '').replace(',', '.'))
    gasto_num = float(gasto.replace(',', '.')) if gasto != '0' else 0
    disponivel = inicial_num - gasto_num
    
    marcador = " ⚠️ ABATIDO" if gasto_num > 0 else ""
    print(f"{regiao:<10} {inicial_num:<15,.0f} {gasto_num:<15,.2f} {disponivel:<15,.0f}{marcador}")

conn.close()

print("\n" + "="*80)
