import sqlite3

conn = sqlite3.connect('instance/controle_itens.db')
cursor = conn.cursor()

print("="*80)
print("🔧 CORRIGINDO O.S. 12/2025")
print("="*80)

# IDs dos itens
coffee_id = 2
agua_id = 6

# 1. Reverter estoque do Coffee Break (região 3)
print("\n[1/4] Revertendo Coffee Break (região 3)...")
cursor.execute("""
    UPDATE estoque_regional
    SET quantidade_gasto = '0'
    WHERE item_id = ? AND regiao_numero = 3
""", (coffee_id,))
print("   ✅ Coffee Break (região 3) voltou ao estoque")

# 2. Deletar movimentação antiga
print("\n[2/4] Removendo movimentação antiga...")
cursor.execute("""
    DELETE FROM movimentacoes_estoque
    WHERE ordem_servico_id = (SELECT id FROM ordens_servico WHERE numero_os = '12/2025')
""")
print("   ✅ Movimentação removida")

# 3. Atualizar item_id e descrição na O.S.
print("\n[3/4] Atualizando item para Água 500ml...")
cursor.execute("""
    UPDATE itens_ordem_servico
    SET item_id = ?
    WHERE ordem_servico_id = (SELECT id FROM ordens_servico WHERE numero_os = '12/2025')
""", (agua_id,))
print(f"   ✅ item_id atualizado: {coffee_id} → {agua_id}")

# 4. Abatem estoque de Água 500ml (região 3)
print("\n[4/4] Abatendo Água 500ml (região 3)...")
cursor.execute("""
    UPDATE estoque_regional
    SET quantidade_gasto = '15,00'
    WHERE item_id = ? AND regiao_numero = 3
""", (agua_id,))

# 5. Criar movimentação para Água 500ml
cursor.execute("""
    SELECT id FROM estoque_regional
    WHERE item_id = ? AND regiao_numero = 3
""", (agua_id,))
estoque_id = cursor.fetchone()[0]

cursor.execute("""
    INSERT INTO movimentacoes_estoque 
    (ordem_servico_id, item_id, estoque_regional_id, quantidade, tipo, observacao)
    VALUES (
        (SELECT id FROM ordens_servico WHERE numero_os = '12/2025'),
        ?,
        ?,
        15.0,
        'SAIDA',
        'Emissão O.S. 12/2025'
    )
""", (agua_id, estoque_id))

print("   ✅ Água 500ml abatida (região 3)")
print("   ✅ Movimentação registrada")

conn.commit()

# Verificação
print("\n" + "="*80)
print("✅ VERIFICAÇÃO FINAL")
print("="*80)

cursor.execute("""
    SELECT ios.item_id, i.descricao, ios.item_bec
    FROM itens_ordem_servico ios
    JOIN itens i ON i.id = ios.item_id
    WHERE ios.ordem_servico_id = (SELECT id FROM ordens_servico WHERE numero_os = '12/2025')
""")
item = cursor.fetchone()

print(f"\n📋 O.S. 12/2025:")
print(f"   item_id: {item[0]}")
print(f"   Descrição: {item[1]} ✅")
print(f"   Item BEC: {item[2]}")

# Estoques
print(f"\n📦 ESTOQUE Coffee Break Tipo 2 (região 3):")
cursor.execute("SELECT quantidade_inicial, quantidade_gasto FROM estoque_regional WHERE item_id = 2 AND regiao_numero = 3")
e = cursor.fetchone()
print(f"   Inicial: {e[0]}")
print(f"   Gasto: {e[1]}")

print(f"\n📦 ESTOQUE Água 500ml (região 3):")
cursor.execute("SELECT quantidade_inicial, quantidade_gasto FROM estoque_regional WHERE item_id = 6 AND regiao_numero = 3")
e = cursor.fetchone()
print(f"   Inicial: {e[0]}")
print(f"   Gasto: {e[1]} ✅")

conn.close()

print("\n" + "="*80)
print("✅ CORREÇÃO FINALIZADA!")
print("="*80)
print("\n📌 IMPORTANTE:")
print("   1. Reinicie o navegador completamente (feche TODAS as abas)")
print("   2. Ou pressione Ctrl+Shift+Delete e limpe o cache")
print("   3. Ou acesse com Ctrl+Shift+R (hard refresh)")
print("   4. O arquivo app.js foi atualizado com versão ?v=1.1")
print("="*80)
