import sqlite3
from datetime import datetime

def testar_todos_itens():
    """Testa todos os 17 itens do sistema"""
    
    conn = sqlite3.connect('instance/controle_itens.db')
    c = conn.cursor()
    
    try:
        print("\n" + "="*80)
        print("TESTE COMPLETO - TODOS OS 17 ITENS")
        print("="*80)
        
        # 1. Listar todos os itens
        c.execute('SELECT id, descricao, categoria_id FROM itens ORDER BY id')
        itens = c.fetchall()
        
        print(f"\n📦 Total de itens: {len(itens)}\n")
        
        problemas = []
        
        for item in itens:
            item_id, descricao, categoria_id = item
            
            print(f"{'='*80}")
            print(f"ITEM {item_id}: {descricao}")
            print("="*80)
            
            # Verificar categoria
            c.execute('SELECT id, nome, natureza FROM categorias WHERE id = ?', (categoria_id,))
            categoria = c.fetchone()
            
            if not categoria:
                print(f"  ❌ Categoria {categoria_id} não encontrada!")
                problemas.append(f"Item {item_id}: Categoria não existe")
                continue
            
            cat_id, cat_nome, cat_natureza = categoria
            print(f"  Categoria: {cat_nome}")
            print(f"  Código BEC: {cat_natureza}")
            
            # Verificar estoque
            c.execute('SELECT COUNT(*) FROM estoque_regional WHERE item_id = ?', (item_id,))
            count = c.fetchone()[0]
            
            if count < 6:
                print(f"  ❌ FALTA ESTOQUE! Só tem {count}/6 regiões")
                problemas.append(f"Item {item_id}: Falta estoque")
            else:
                print(f"  ✅ Estoque OK (6 regiões)")
            
            # Teste de busca por ID
            c.execute('SELECT id FROM itens WHERE id = ?', (item_id,))
            if c.fetchone():
                print(f"  ✅ Busca por ID funciona")
            else:
                print(f"  ❌ Busca por ID falha!")
                problemas.append(f"Item {item_id}: Busca por ID falha")
            
            print()
        
        # Resumo
        print("="*80)
        print("RESUMO")
        print("="*80)
        
        if problemas:
            print(f"\n❌ {len(problemas)} PROBLEMAS ENCONTRADOS:\n")
            for p in problemas:
                print(f"  • {p}")
        else:
            print("\n✅ TODOS OS 17 ITENS ESTÃO PERFEITOS!")
            print("\n✅ Pode emitir O.S. com qualquer item!")
        
        print("\n" + "="*80)
        
        return len(problemas) == 0
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        conn.close()

if __name__ == '__main__':
    testar_todos_itens()
