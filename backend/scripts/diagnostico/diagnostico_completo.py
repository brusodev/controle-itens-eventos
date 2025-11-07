import sqlite3

# Conectar ao banco
conn = sqlite3.connect('instance/controle_itens.db')
cursor = conn.cursor()

print("="*60)
print("📊 ESTRUTURA DA TABELA estoque_regional")
print("="*60)

cursor.execute("PRAGMA table_info(estoque_regional)")
colunas = cursor.fetchall()

for col in colunas:
    print(f"  • {col[1]} ({col[2]})")

print("\n" + "="*60)
print("📋 O.S. 11/2025 - VERIFICAÇÃO COMPLETA")
print("="*60)

# Buscar O.S.
cursor.execute("SELECT id, numero_os, grupo, regiao_estoque FROM ordens_servico WHERE numero_os = '11/2025'")
os_id, numero, grupo, regiao = cursor.fetchone()

print(f"\n✅ O.S. {numero}:")
print(f"  Grupo: {grupo}, Região: {regiao}")

# Buscar movimentações
cursor.execute("""
    SELECT m.tipo, m.quantidade, m.item_id, i.descricao, m.estoque_regional_id
    FROM movimentacoes_estoque m
    JOIN itens i ON i.id = m.item_id
    WHERE m.ordem_servico_id = ?
""", (os_id,))

movs = cursor.fetchall()

print(f"\n📦 Movimentações: {len(movs)}")

for tipo, qtd, item_id, item_nome, estoque_id in movs:
    print(f"\n  ✅ {tipo}: {item_nome}")
    print(f"     Quantidade movimentada: {qtd}")
    print(f"     Estoque ID: {estoque_id}")
    
    # Buscar dados do estoque
    cursor.execute("SELECT * FROM estoque_regional WHERE id = ?", (estoque_id,))
    estoque = cursor.fetchone()
    
    if estoque:
        print(f"\n     📊 Estoque Regional (ID: {estoque_id}):")
        # Mostrar todas as colunas
        cursor.execute("PRAGMA table_info(estoque_regional)")
        colunas = cursor.fetchall()
        for i, col in enumerate(colunas):
            print(f"        {col[1]}: {estoque[i]}")

# Verificar estoque ANTES da migration
print("\n" + "="*60)
print("🔍 DIAGNÓSTICO")
print("="*60)

cursor.execute("SELECT COUNT(*) FROM estoque_regional WHERE regiao IS NOT NULL")
tem_regiao = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM estoque_regional WHERE quantidade_inicial IS NOT NULL")
tem_inicial = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM estoque_regional")
total = cursor.fetchone()[0]

print(f"\nTotal de registros em estoque_regional: {total}")
print(f"Registros com campo 'regiao': {tem_regiao}")
print(f"Registros com campo 'quantidade_inicial': {tem_inicial}")

if tem_inicial == 0:
    print("\n❌ PROBLEMA: A migração não foi executada!")
    print("   A tabela estoque_regional não tem a coluna quantidade_inicial")

conn.close()
