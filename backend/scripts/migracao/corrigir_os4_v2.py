import sqlite3

def corrigir_os4_v2():
    """Corrige NOVAMENTE a O.S. 4/2025"""
    
    conn = sqlite3.connect('instance/controle_itens.db')
    c = conn.cursor()
    
    try:
        print("\n=== CORRIGINDO O.S. 4/2025 (V2) ===\n")
        
        # 1. REVERTER movimentações erradas
        print("🔄 PASSO 1: Revertendo movimentações erradas...")
        
        # Buscar movimentações da O.S. 4
        c.execute('''
            SELECT id, item_id, quantidade
            FROM movimentacoes_estoque
            WHERE ordem_servico_id = 4
        ''')
        
        movs = c.fetchall()
        
        for mov in movs:
            mov_id, item_id, qtd = mov
            
            # Buscar estoque
            c.execute('''
                SELECT id, quantidade_gasto, regiao_numero
                FROM estoque_regional
                WHERE item_id = ? AND regiao_numero = 1
            ''', (item_id,))
            
            est = c.fetchone()
            if est:
                est_id, gasto_str, regiao = est
                
                # Converter e reverter
                gasto = float(gasto_str.replace('.', '').replace(',', '.'))
                novo_gasto = gasto - qtd
                novo_gasto_str = f"{novo_gasto:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
                
                c.execute('UPDATE estoque_regional SET quantidade_gasto = ? WHERE id = ?', 
                         (novo_gasto_str, est_id))
                
                print(f"   ✅ Item {item_id}: {gasto_str} → {novo_gasto_str}")
        
        # Deletar movimentações
        c.execute('DELETE FROM movimentacoes_estoque WHERE ordem_servico_id = 4')
        print(f"   ✅ Deletadas {len(movs)} movimentações")
        
        # 2. CORRIGIR item_id dos itens
        print("\n🔧 PASSO 2: Corrigindo IDs dos itens...")
        
        # Kit Lanche: 16 → 8
        c.execute('UPDATE itens_ordem_servico SET item_id = 8 WHERE id = 15')
        print("   ✅ Kit Lanche: item_id 16 → 8")
        
        # Água 200ml: 13 → 5
        c.execute('UPDATE itens_ordem_servico SET item_id = 5 WHERE id = 16')
        print("   ✅ Água 200ml: item_id 13 → 5")
        
        # 3. CRIAR movimentações corretas
        print("\n➕ PASSO 3: Criando movimentações corretas...")
        
        # Processar cada item
        itens = [(8, 50.0), (5, 50.0)]  # (item_id, quantidade)
        
        for item_id, qtd in itens:
            # Buscar estoque
            c.execute('''
                SELECT id, quantidade_gasto
                FROM estoque_regional
                WHERE item_id = ? AND regiao_numero = 1
            ''', (item_id,))
            
            est = c.fetchone()
            if est:
                est_id, gasto_str = est
                
                # Converter e abater
                gasto = float(gasto_str.replace('.', '').replace(',', '.'))
                novo_gasto = gasto + qtd
                novo_gasto_str = f"{novo_gasto:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
                
                # Atualizar estoque
                c.execute('UPDATE estoque_regional SET quantidade_gasto = ? WHERE id = ?',
                         (novo_gasto_str, est_id))
                
                # Criar movimentação
                c.execute('''
                    INSERT INTO movimentacoes_estoque
                    (ordem_servico_id, item_id, estoque_regional_id, quantidade, tipo, data_movimentacao)
                    VALUES (4, ?, ?, ?, 'SAIDA', datetime('now'))
                ''', (item_id, est_id, qtd))
                
                # Buscar descrição
                c.execute('SELECT descricao FROM itens WHERE id = ?', (item_id,))
                desc = c.fetchone()[0]
                
                print(f"   ✅ {desc}: +{qtd} unidades")
        
        conn.commit()
        
        print("\n" + "="*60)
        print("✅ CORREÇÃO CONCLUÍDA!")
        print("="*60)
        print("\n📊 RESUMO:")
        print("   • Item 1: Kit Lanche (ID 8) - 50 unidades")
        print("   • Item 2: Água 200ml (ID 5) - 50 unidades")
        print("   • Estoque abatido corretamente")
        print("   • Movimentações criadas")
        print("\n⚠️  IMPORTANTE: LIMPE O CACHE DO NAVEGADOR!")
        
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        conn.close()

if __name__ == '__main__':
    corrigir_os4_v2()
