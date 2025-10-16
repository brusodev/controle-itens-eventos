import sqlite3

conn = sqlite3.connect('instance/controle_itens.db')
cursor = conn.cursor()

print("="*80)
print("🔍 INVESTIGAÇÃO COMPLETA - O.S. 11/2025")
print("="*80)

# Buscar item da O.S.
cursor.execute("""
    SELECT 
        ios.id,
        ios.item_id,
        ios.descricao AS descricao_salva_os,
        ios.item_bec,
        i.descricao AS descricao_item_cadastro,
        i.item_codigo AS item_codigo_cadastro
    FROM itens_ordem_servico ios
    JOIN itens i ON i.id = ios.item_id
    WHERE ios.ordem_servico_id = (SELECT id FROM ordens_servico WHERE numero_os = '11/2025')
""")

result = cursor.fetchone()

print("\n📋 DADOS DO ITEM NA O.S. 11/2025:")
print("-" * 80)
print(f"ID do registro: {result[0]}")
print(f"Item ID (FK): {result[1]}")
print(f"")
print(f"DESCRIÇÃO SALVA NA O.S.:     '{result[2]}'")
print(f"ITEM BEC:                    '{result[3]}'")
print(f"")
print(f"DESCRIÇÃO NO CADASTRO ITEM:  '{result[4]}'")
print(f"CÓDIGO ITEM NO CADASTRO:     '{result[5]}'")

if result[2] == result[4]:
    print("\n✅ Descrição CORRETA - O.S. e Cadastro estão iguais")
else:
    print("\n❌ PROBLEMA ENCONTRADO!")
    print(f"   A descrição salva na O.S. é diferente do cadastro do item!")

# Verificar se há outro item com a descrição mostrada no PDF
print("\n" + "="*80)
print("🔍 PROCURANDO ITEM 'Água mineral em garrafas de 500 ml'")
print("="*80)

cursor.execute("""
    SELECT id, item_codigo, descricao
    FROM itens
    WHERE descricao LIKE '%gua%mineral%500%'
""")

agua_item = cursor.fetchone()
if agua_item:
    print(f"\n✅ Encontrado:")
    print(f"   ID: {agua_item[0]}")
    print(f"   Código: {agua_item[1]}")
    print(f"   Descrição: {agua_item[2]}")
    
    if result[1] == agua_item[0]:
        print(f"\n⚠️  O item_id da O.S. ({result[1]}) É o item de Água!")
        print("   Isso significa que você selecionou Água 500ml, NÃO Coffee Break!")
    else:
        print(f"\n✅ O item_id da O.S. ({result[1]}) NÃO é o item de Água ({agua_item[0]})")

conn.close()

print("\n" + "="*80)
