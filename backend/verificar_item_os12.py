import sqlite3

conn = sqlite3.connect('instance/controle_itens.db')
cursor = conn.cursor()

print("="*80)
print("🔍 VERIFICAÇÃO COMPLETA DA O.S. 12/2025")
print("="*80)

# Buscar item cadastrado na O.S.
cursor.execute("""
    SELECT ios.item_id, i.descricao, ios.descricao as descricao_salva, ios.item_bec
    FROM itens_ordem_servico ios
    JOIN itens i ON i.id = ios.item_id
    WHERE ios.ordem_servico_id = (SELECT id FROM ordens_servico WHERE numero_os = '12/2025')
""")

item_os = cursor.fetchone()

print(f"\n📦 ITEM CADASTRADO NA O.S.:")
print(f"   item_id: {item_os[0]}")
print(f"   Descrição no cadastro de itens: {item_os[1]}")
print(f"   Descrição salva na O.S.: {item_os[2]}")
print(f"   Item BEC: {item_os[3]}")

# Verificar IDs dos itens
cursor.execute("SELECT id, descricao FROM itens WHERE descricao LIKE '%Coffee%Tipo 2%'")
coffee = cursor.fetchone()

cursor.execute("SELECT id, descricao FROM itens WHERE descricao LIKE '%gua%500%'")
agua = cursor.fetchone()

print(f"\n📋 IDs DOS ITENS:")
print(f"   Coffee Break Tipo 2: ID = {coffee[0]}")
print(f"   Água 500ml: ID = {agua[0]}")

print("\n" + "="*80)
if item_os[0] == agua[0]:
    print("✅ O.S. tem o item CORRETO (Água 500ml)")
    if item_os[2] != agua[1]:
        print("⚠️  MAS a descrição salva está errada!")
        print(f"   Descrição salva: {item_os[2]}")
        print(f"   Deveria ser: {agua[1]}")
else:
    print("❌ BUG DETECTADO!")
    print(f"   O.S. salvou item_id = {item_os[0]} ({item_os[1]})")
    print(f"   Mas o PDF mostra 'Água 500ml'")
    print(f"   Deveria ser item_id = {agua[0]}")
    print("\n💡 Isso indica que o frontend ainda está enviando o item_id errado!")
    print("   O cache do navegador pode não ter sido limpo.")

conn.close()

print("="*80)
