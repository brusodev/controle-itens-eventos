import sqlite3

def corrigir_os5():
    """Corrige a O.S. 5/2025 - Água com ID errado (13 em vez de 5)"""
    
    conn = sqlite3.connect('instance/controle_itens.db')
    c = conn.cursor()
    
    try:
        print("\n=== CORRIGINDO O.S. 5/2025 ===\n")
        
        # 1. REVERTER movimentação errada da Rosquinha (item_id=13)
        print("🔄 PASSO 1: Revertendo movimentação errada (Rosquinha)...")
        
        # Buscar estoque da rosquinha região 1
        c.execute('''
            SELECT id, quantidade_gasto
            FROM estoque_regional
            WHERE item_id = 13 AND regiao_numero = 1
        ''')
        
        est_rosquinha = c.fetchone()
        if est_rosquinha:
            est_id, gasto_str = est_rosquinha
            
            # Converter e devolver 800 unidades
            gasto = float(gasto_str.replace('.', '').replace(',', '.'))
            novo_gasto = gasto - 800
            novo_gasto_str = f"{novo_gasto:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
            
            c.execute('UPDATE estoque_regional SET quantidade_gasto = ? WHERE id = ?',
                     (novo_gasto_str, est_id))
            
            print(f"   ✅ Rosquinha: {gasto_str} → {novo_gasto_str} (devolvidas 800 unidades)")
        
        # Deletar movimentação errada (Mov 4)
        c.execute('DELETE FROM movimentacoes_estoque WHERE id = 4')
        print("   ✅ Movimentação errada deletada")
        
        # 2. CORRIGIR item_id da água
        print("\n🔧 PASSO 2: Corrigindo item_id da Água...")
        
        c.execute('UPDATE itens_ordem_servico SET item_id = 5 WHERE id = 18')
        print("   ✅ Água 200ml: item_id 13 → 5")
        
        # 3. CRIAR movimentação correta da água
        print("\n➕ PASSO 3: Criando movimentação correta (Água 200ml)...")
        
        # Buscar estoque de água região 1
        c.execute('''
            SELECT id, quantidade_gasto
            FROM estoque_regional
            WHERE item_id = 5 AND regiao_numero = 1
        ''')
        
        est_agua = c.fetchone()
        if est_agua:
            est_id, gasto_str = est_agua
            
            # Converter e abater 800 unidades
            gasto = float(gasto_str.replace('.', '').replace(',', '.'))
            novo_gasto = gasto + 800
            novo_gasto_str = f"{novo_gasto:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
            
            # Atualizar estoque
            c.execute('UPDATE estoque_regional SET quantidade_gasto = ? WHERE id = ?',
                     (novo_gasto_str, est_id))
            
            # Criar movimentação
            c.execute('''
                INSERT INTO movimentacoes_estoque
                (ordem_servico_id, item_id, estoque_regional_id, quantidade, tipo, data_movimentacao)
                VALUES (5, 5, ?, 800.0, 'SAIDA', datetime('now'))
            ''', (est_id,))
            
            print(f"   ✅ Água 200ml: {gasto_str} → {novo_gasto_str} (abatidas 800 unidades)")
        
        conn.commit()
        
        print("\n" + "="*70)
        print("✅ O.S. 5/2025 CORRIGIDA COM SUCESSO!")
        print("="*70)
        print("\n📊 RESUMO:")
        print("   • Rosquinha: Devolvidas 800 unidades ao estoque")
        print("   • Água 200ml: Abatidas 800 unidades do estoque (correto)")
        print("   • Item ID corrigido: 13 → 5")
        print("   • Movimentação criada corretamente")
        
        print("\n" + "="*70)
        print("🚨 ATENÇÃO CRÍTICA:")
        print("="*70)
        print("   O NAVEGADOR ESTÁ USANDO CACHE ANTIGO!")
        print("   Você DEVE limpar o cache ANTES de emitir outra O.S.")
        print("   Caso contrário, o mesmo erro vai acontecer novamente!")
        print("\n   COMO LIMPAR:")
        print("   1. Feche TODO o navegador")
        print("   2. Reabra e pressione Ctrl+Shift+Delete")
        print("   3. Marque 'Imagens e arquivos em cache'")
        print("   4. Clique em 'Limpar dados'")
        print("   5. OU use janela anônima (Ctrl+Shift+N)")
        
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
    corrigir_os5()
