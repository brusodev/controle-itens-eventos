import sqlite3

def corrigir_movimentacao_os4():
    """Corrige a movimentação errada da O.S. 4/2025"""
    
    conn = sqlite3.connect('instance/controle_itens.db')
    c = conn.cursor()
    
    try:
        print("\n=== CORRIGINDO MOVIMENTAÇÃO O.S. 4/2025 ===\n")
        
        # 1. REVERTER movimentação errada (item_id=13)
        print("🔄 PASSO 1: Revertendo movimentação errada (Rosquinha)...")
        
        # Buscar estoque da rosquinha (região 1)
        c.execute('''
            SELECT id, quantidade_gasto 
            FROM estoque_regional 
            WHERE item_id = 13 AND regiao_numero = 1
        ''')
        
        est_rosquinha = c.fetchone()
        if est_rosquinha:
            est_id_rosquinha, gasto_rosquinha = est_rosquinha
            
            # Converter para float
            gasto_float = float(gasto_rosquinha.replace('.', '').replace(',', '.'))
            
            # Devolver 50 unidades
            novo_gasto_rosquinha = gasto_float - 50
            
            # Converter para formato BR
            novo_gasto_str = f"{novo_gasto_rosquinha:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
            
            # Atualizar estoque
            c.execute('''
                UPDATE estoque_regional 
                SET quantidade_gasto = ?
                WHERE id = ?
            ''', (novo_gasto_str, est_id_rosquinha))
            
            print(f"   ✅ Rosquinha - Gasto revertido: {gasto_rosquinha} → {novo_gasto_str}")
        else:
            print("   ⚠️  Estoque de rosquinha não encontrado")
        
        # 2. DELETAR movimentação errada
        print("\n🗑️  PASSO 2: Deletando registro de movimentação errada...")
        c.execute('DELETE FROM movimentacoes_estoque WHERE id = 1')
        print("   ✅ Movimentação ID=1 deletada")
        
        # 3. CRIAR movimentação correta (água)
        print("\n➕ PASSO 3: Criando movimentação correta (Água 200ml)...")
        
        # Buscar estoque de água (região 1)
        c.execute('''
            SELECT id, quantidade_gasto 
            FROM estoque_regional 
            WHERE item_id = 5 AND regiao_numero = 1
        ''')
        
        est_agua = c.fetchone()
        if not est_agua:
            print("   ❌ ERRO: Estoque de água não encontrado!")
            return False
        
        est_id_agua, gasto_agua = est_agua
        
        # Converter para float
        gasto_float_agua = float(gasto_agua.replace('.', '').replace(',', '.'))
        
        # Adicionar 50 unidades
        novo_gasto_agua = gasto_float_agua + 50
        
        # Converter para formato BR
        novo_gasto_agua_str = f"{novo_gasto_agua:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
        
        # Atualizar estoque
        c.execute('''
            UPDATE estoque_regional 
            SET quantidade_gasto = ?
            WHERE id = ?
        ''', (novo_gasto_agua_str, est_id_agua))
        
        # Criar movimentação
        c.execute('''
            INSERT INTO movimentacoes_estoque 
            (ordem_servico_id, item_id, estoque_regional_id, quantidade, tipo, data_movimentacao)
            VALUES (4, 5, ?, 50.0, 'SAIDA', datetime('now'))
        ''', (est_id_agua,))
        
        print(f"   ✅ Água 200ml - Gasto atualizado: {gasto_agua} → {novo_gasto_agua_str}")
        print(f"   ✅ Movimentação criada (50 unidades)")
        
        conn.commit()
        
        print("\n" + "="*60)
        print("✅ CORREÇÃO CONCLUÍDA COM SUCESSO!")
        print("="*60)
        print("\n📊 RESUMO:")
        print(f"   • Rosquinha: Devolvidas 50 unidades ao estoque")
        print(f"   • Água 200ml: Abatidas 50 unidades do estoque")
        print(f"   • O.S. 4/2025: item_id correto (5) + movimentação correta")
        print("\n💡 IMPORTANTE: Pressione Ctrl+Shift+R no navegador!")
        
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
    corrigir_movimentacao_os4()
