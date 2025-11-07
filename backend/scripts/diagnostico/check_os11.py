import sqlite3

# Conectar ao banco
conn = sqlite3.connect('instance/controle_itens.db')
cursor = conn.cursor()

print("="*60)
print("📋 VERIFICAÇÃO DA O.S. 11/2025")
print("="*60)

# Buscar O.S.
cursor.execute("SELECT id, numero_os, grupo, regiao_estoque FROM ordens_servico WHERE numero_os = '11/2025'")
os_data = cursor.fetchone()

if not os_data:
    print("❌ O.S. 11/2025 NÃO encontrada no banco!")
else:
    os_id, numero, grupo, regiao = os_data
    print(f"\n✅ O.S. Encontrada:")
    print(f"  ID: {os_id}")
    print(f"  Número: {numero}")
    print(f"  Grupo: {grupo}")
    print(f"  Região Estoque: {regiao}")
    
    print("\n" + "="*60)
    print("📦 MOVIMENTAÇÕES DE ESTOQUE")
    print("="*60)
    
    # Buscar movimentações
    cursor.execute("""
        SELECT tipo, quantidade, regiao_estoque, item_id, data_movimentacao 
        FROM movimentacoes_estoque 
        WHERE ordem_servico_id = ?
    """, (os_id,))
    
    movs = cursor.fetchall()
    
    if not movs:
        print("\n❌ PROBLEMA: NENHUMA movimentação de estoque encontrada!")
        print("⚠️ O ESTOQUE NÃO FOI ABATIDO!")
    else:
        print(f"\n✅ {len(movs)} movimentação(ões) registrada(s):\n")
        
        for tipo, qtd, regiao_mov, item_id, data in movs:
            # Buscar nome do item
            cursor.execute("SELECT descricao FROM itens WHERE id = ?", (item_id,))
            item_nome = cursor.fetchone()[0]
            
            print(f"  • Tipo: {tipo}")
            print(f"    Item: {item_nome} (ID: {item_id})")
            print(f"    Quantidade: {qtd}")
            print(f"    Região: {regiao_mov}")
            print(f"    Data: {data}")
            
            # Buscar estoque atual
            cursor.execute("""
                SELECT quantidade_inicial, quantidade_atual 
                FROM estoque_regional 
                WHERE item_id = ? AND regiao = ?
            """, (item_id, regiao_mov))
            
            estoque_data = cursor.fetchone()
            if estoque_data:
                inicial, atual = estoque_data
                abatido = inicial - atual
                print(f"\n    📊 Estoque Região {regiao_mov}:")
                print(f"      Inicial: {inicial}")
                print(f"      Atual: {atual}")
                print(f"      Abatido: {abatido}")
                
                if abatido == qtd:
                    print(f"      ✅ Estoque abatido CORRETAMENTE!")
                else:
                    print(f"      ❌ ERRO: Abatido {abatido} mas deveria ser {qtd}!")
            print()

conn.close()
