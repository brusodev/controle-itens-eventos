import sqlite3

conn = sqlite3.connect('instance/controle_itens.db')
c = conn.cursor()

print("\n=== VERIFICANDO ESTOQUE DE TODOS OS ITENS ===\n")

# Buscar todos os itens
c.execute('SELECT id, descricao FROM itens ORDER BY id')
itens = c.fetchall()

print(f'Total de itens cadastrados: {len(itens)}\n')

# Para cada item, verificar estoque em todas as 6 regiões
itens_sem_estoque = []

for item in itens:
    item_id, descricao = item
    
    # Verificar quais regiões têm estoque
    c.execute('SELECT regiao_numero FROM estoque_regional WHERE item_id = ? ORDER BY regiao_numero', (item_id,))
    regioes_com_estoque = [r[0] for r in c.fetchall()]
    
    # Verificar quais regiões estão faltando
    regioes_faltando = [r for r in range(1, 7) if r not in regioes_com_estoque]
    
    if regioes_faltando:
        itens_sem_estoque.append({
            'id': item_id,
            'descricao': descricao,
            'regioes_faltando': regioes_faltando
        })

if itens_sem_estoque:
    print("❌ ITENS COM ESTOQUE INCOMPLETO:\n")
    for item in itens_sem_estoque:
        print(f"ID {item['id']}: {item['descricao']}")
        print(f"  Faltam regiões: {item['regioes_faltando']}\n")
    
    print(f"\nTotal de itens com problemas: {len(itens_sem_estoque)}")
    print("\n" + "="*70)
    print("ADICIONANDO ESTOQUE INICIAL '0' NAS REGIÕES FALTANTES...")
    print("="*70)
    
    for item in itens_sem_estoque:
        for regiao in item['regioes_faltando']:
            c.execute('''
                INSERT INTO estoque_regional (item_id, regiao_numero, quantidade_inicial, quantidade_gasto)
                VALUES (?, ?, '0', '0')
            ''', (item['id'], regiao))
            
            print(f"  ✅ Item {item['id']} - Região {regiao}")
    
    conn.commit()
    print("\n✅ ESTOQUE ADICIONADO COM SUCESSO!")
    print("Agora todos os itens estão disponíveis em todas as regiões.")
        
else:
    print("✅ TODOS OS ITENS TÊM ESTOQUE EM TODAS AS 6 REGIÕES!")

conn.close()
