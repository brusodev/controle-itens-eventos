import sqlite3

# Conectar ao banco
conn = sqlite3.connect('instance/controle_itens.db')
cursor = conn.cursor()

print("="*60)
print("📊 ESTRUTURA DA TABELA movimentacoes_estoque")
print("="*60)

# Ver estrutura da tabela
cursor.execute("PRAGMA table_info(movimentacoes_estoque)")
colunas = cursor.fetchall()

for col in colunas:
    print(f"  • {col[1]} ({col[2]})")

print("\n" + "="*60)
print("📋 VERIFICAÇÃO DA O.S. 11/2025")
print("="*60)

# Buscar O.S.
cursor.execute("SELECT id, numero_os, grupo, regiao_estoque FROM ordens_servico WHERE numero_os = '11/2025'")
os_data = cursor.fetchone()

if os_data:
    os_id, numero, grupo, regiao = os_data
    print(f"\n✅ O.S. {numero}:")
    print(f"  ID: {os_id}")
    print(f"  Grupo: {grupo}")
    print(f"  Região Estoque: {regiao}")
    
    # Buscar movimentações (SEM regiao_estoque)
    cursor.execute("""
        SELECT tipo, quantidade, item_id, data_movimentacao 
        FROM movimentacoes_estoque 
        WHERE ordem_servico_id = ?
    """, (os_id,))
    
    movs = cursor.fetchall()
    
    print(f"\n📦 Movimentações: {len(movs)}")
    
    if not movs:
        print("\n❌ NENHUMA movimentação encontrada!")
        print("⚠️ O ESTOQUE NÃO FOI ABATIDO!")
    else:
        for tipo, qtd, item_id, data in movs:
            cursor.execute("SELECT descricao FROM itens WHERE id = ?", (item_id,))
            item_nome = cursor.fetchone()[0]
            
            print(f"\n  ✅ {tipo}: {item_nome}")
            print(f"     Quantidade: {qtd}")
            print(f"     Data: {data}")
            
            # Verificar estoque (usar região da O.S.)
            cursor.execute("""
                SELECT quantidade_inicial, quantidade_atual 
                FROM estoque_regional 
                WHERE item_id = ? AND regiao = ?
            """, (item_id, regiao))
            
            estoque = cursor.fetchone()
            if estoque:
                inicial, atual = estoque
                print(f"\n     📊 Estoque Região {regiao}:")
                print(f"        Inicial: {inicial}")
                print(f"        Atual: {atual}")
                print(f"        Abatido: {inicial - atual}")

conn.close()
