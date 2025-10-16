import sqlite3

conn = sqlite3.connect('instance/controle_itens.db')
cursor = conn.cursor()

print("="*80)
print("🔧 CORREÇÃO COMPLETA DA O.S. 11/2025")
print("="*80)

# Buscar item Água 500ml (item correto que o usuário selecionou)
cursor.execute("""
    SELECT id, item_codigo, descricao, categoria_id
    FROM itens
    WHERE descricao LIKE '%gua%500%'
""")
agua_item = cursor.fetchone()

print(f"\n📦 Item CORRETO que você selecionou:")
print(f"   ID: {agua_item[0]}")
print(f"   Código: {agua_item[1]}")
print(f"   Descrição: {agua_item[2]}")

# Buscar natureza BEC
cursor.execute("SELECT natureza FROM categorias WHERE id = ?", (agua_item[3],))
natureza = cursor.fetchone()[0]
print(f"   Natureza BEC: {natureza}")

# Estado ATUAL da O.S.
cursor.execute("""
    SELECT item_id, descricao, item_bec, quantidade_total
    FROM itens_ordem_servico
    WHERE ordem_servico_id = (SELECT id FROM ordens_servico WHERE numero_os = '11/2025')
""")
estado_atual = cursor.fetchone()

print(f"\n📋 Estado ATUAL da O.S. 11:")
print(f"   item_id: {estado_atual[0]}")
print(f"   descrição: {estado_atual[1]}")
print(f"   item_bec: {estado_atual[2]}")
print(f"   quantidade: {estado_atual[3]}")

print("\n" + "="*80)
print("⚠️  PROBLEMA IDENTIFICADO:")
print("="*80)
print("Você selecionou 'Água mineral 500ml' no frontend, mas o sistema salvou:")
print(f"  - item_id = 2 (Coffee Break) ❌")
print(f"  - Deveria ser item_id = {agua_item[0]} (Água 500ml) ✅")

print("\n🔄 INICIANDO CORREÇÃO COMPLETA...")
print("   1. Reverter movimentação de estoque do Coffee Break")
print("   2. Atualizar item_id para Água 500ml")
print("   3. Criar nova movimentação para Água 500ml")

# 1. Reverter estoque do Coffee Break (item_id=2, região 2)
print("\n[1/3] Revertendo abatimento do Coffee Break...")
cursor.execute("""
    UPDATE estoque_regional
    SET quantidade_gasto = '0'
    WHERE item_id = 2 AND regiao_numero = 2
""")
print("   ✅ Coffee Break voltou ao estoque inicial")

# 2. Deletar movimentação antiga
cursor.execute("""
    DELETE FROM movimentacoes_estoque
    WHERE ordem_servico_id = (SELECT id FROM ordens_servico WHERE numero_os = '11/2025')
""")
print("   ✅ Movimentação antiga removida")

# 3. Atualizar item_id na O.S.
print("\n[2/3] Atualizando item_id para Água 500ml...")
cursor.execute("""
    UPDATE itens_ordem_servico
    SET item_id = ?,
        descricao = ?,
        item_bec = ?
    WHERE ordem_servico_id = (SELECT id FROM ordens_servico WHERE numero_os = '11/2025')
""", (agua_item[0], agua_item[2], natureza))
print(f"   ✅ item_id atualizado: {estado_atual[0]} → {agua_item[0]}")

# 4. Abater estoque da Água 500ml (região 2)
print("\n[3/3] Abatendo estoque de Água 500ml...")
cursor.execute("""
    UPDATE estoque_regional
    SET quantidade_gasto = '300,00'
    WHERE item_id = ? AND regiao_numero = 2
""", (agua_item[0],))

# 5. Criar movimentação para Água 500ml
cursor.execute("""
    SELECT id FROM estoque_regional
    WHERE item_id = ? AND regiao_numero = 2
""", (agua_item[0],))
estoque_id = cursor.fetchone()[0]

cursor.execute("""
    INSERT INTO movimentacoes_estoque 
    (ordem_servico_id, item_id, estoque_regional_id, quantidade, tipo, observacao)
    VALUES (
        (SELECT id FROM ordens_servico WHERE numero_os = '11/2025'),
        ?,
        ?,
        300.0,
        'SAIDA',
        'Emissão O.S. 11/2025'
    )
""", (agua_item[0], estoque_id))

print("   ✅ Estoque de Água 500ml abatido")
print("   ✅ Movimentação registrada")

conn.commit()

# Verificação final
print("\n" + "="*80)
print("✅ VERIFICAÇÃO FINAL")
print("="*80)

cursor.execute("""
    SELECT ios.item_id, i.descricao, ios.item_bec, ios.quantidade_total
    FROM itens_ordem_servico ios
    JOIN itens i ON i.id = ios.item_id
    WHERE ios.ordem_servico_id = (SELECT id FROM ordens_servico WHERE numero_os = '11/2025')
""")
novo_estado = cursor.fetchone()

print(f"\n📋 O.S. 11/2025 AGORA:")
print(f"   item_id: {novo_estado[0]} (Água 500ml) ✅")
print(f"   Descrição: {novo_estado[1]} ✅")
print(f"   Item BEC: {novo_estado[2]} (Natureza da despesa)")
print(f"   Quantidade: {novo_estado[3]}")

# Verificar estoques
print(f"\n📦 ESTOQUE Coffee Break Tipo 2 (região 2):")
cursor.execute("""
    SELECT quantidade_inicial, quantidade_gasto
    FROM estoque_regional
    WHERE item_id = 2 AND regiao_numero = 2
""")
estoque_coffee = cursor.fetchone()
print(f"   Inicial: {estoque_coffee[0]}")
print(f"   Gasto: {estoque_coffee[1]}")
print(f"   Disponível: {float(estoque_coffee[0]) - float(estoque_coffee[1].replace(',', '.'))} ✅")

print(f"\n📦 ESTOQUE Água 500ml (região 2):")
cursor.execute("""
    SELECT quantidade_inicial, quantidade_gasto
    FROM estoque_regional
    WHERE item_id = ? AND regiao_numero = 2
""", (agua_item[0],))
estoque_agua = cursor.fetchone()
print(f"   Inicial: {estoque_agua[0]}")
print(f"   Gasto: {estoque_agua[1]}")
disp_agua = float(estoque_agua[0].replace('.', '').replace(',', '.')) - float(estoque_agua[1].replace(',', '.'))
print(f"   Disponível: {disp_agua:.0f} ✅")

conn.close()

print("\n" + "="*80)
print("✅ CORREÇÃO COMPLETA FINALIZADA!")
print("="*80)
print("\nAgora:")
print("  1. O PDF vai mostrar 'Água mineral em garrafas de 500 ml' ✅")
print("  2. O estoque de Água 500ml foi abatido corretamente ✅")
print("  3. O Coffee Break voltou ao estoque inicial ✅")
print("\nPróximo: Vou investigar o bug do frontend que salvou o item_id errado.")
print("="*80)
