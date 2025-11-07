import sqlite3
import sys
from datetime import datetime

def processar_estoque_os4():
    """Processa o estoque para a O.S. 4/2025 (50 águas 200ml)"""
    
    conn = sqlite3.connect('instance/controle_itens.db')
    c = conn.cursor()
    
    try:
        print("\n=== PROCESSANDO ESTOQUE - O.S. 4/2025 ===\n")
        
        # Verificar se a O.S. existe e está correta
        c.execute('''
            SELECT ios.item_id, ios.quantidade_solicitada, i.descricao, os.grupo
            FROM itens_ordem_servico ios
            JOIN itens i ON ios.item_id = i.id
            JOIN ordens_servico os ON ios.ordem_servico_id = os.id
            WHERE ios.ordem_servico_id = 4
        ''')
        
        resultado = c.fetchone()
        if not resultado:
            print("❌ ERRO: O.S. 4 não encontrada!")
            return False
            
        item_id, quantidade, descricao, grupo = resultado
        
        print(f"📋 O.S. 4/2025 - Grupo {grupo}")
        print(f"   Item: {descricao}")
        print(f"   Quantidade: {quantidade}")
        print(f"   Item ID: {item_id}")
        
        if item_id != 5:
            print(f"\n❌ ERRO: item_id deveria ser 5 (água 200ml), mas está {item_id}")
            return False
        
        # Verificar se já existe movimentação para esta O.S.
        c.execute('''
            SELECT COUNT(*) FROM movimentacoes_estoque 
            WHERE ordem_servico_id = 4
        ''')
        
        if c.fetchone()[0] > 0:
            print("\n⚠️  AVISO: Já existem movimentações para esta O.S.")
            resposta = input("Continuar mesmo assim? (s/n): ")
            if resposta.lower() != 's':
                print("Operação cancelada.")
                return False
        
        # Buscar estoque regional
        c.execute('''
            SELECT id, quantidade_gasto 
            FROM estoque_regional 
            WHERE item_id = 5 AND regiao_numero = ?
        ''', (grupo,))
        
        estoque = c.fetchone()
        if not estoque:
            print(f"\n❌ ERRO: Estoque da região {grupo} não encontrado para água 200ml!")
            return False
        
        estoque_id, gasto_atual = estoque
        
        # Converter gasto atual (formato BR) para float
        gasto_float = float(gasto_atual.replace('.', '').replace(',', '.'))
        
        # Calcular novo gasto
        novo_gasto = gasto_float + quantidade
        
        # Converter de volta para formato BR
        novo_gasto_str = f"{novo_gasto:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
        
        print(f"\n💰 Atualização de Estoque:")
        print(f"   Gasto atual: {gasto_atual}")
        print(f"   + {quantidade} unidades")
        print(f"   Novo gasto: {novo_gasto_str}")
        
        # Atualizar estoque
        c.execute('''
            UPDATE estoque_regional 
            SET quantidade_gasto = ?
            WHERE id = ?
        ''', (novo_gasto_str, estoque_id))
        
        # Criar movimentação
        c.execute('''
            INSERT INTO movimentacoes_estoque 
            (ordem_servico_id, item_id, estoque_regional_id, quantidade, tipo, data_movimentacao)
            VALUES (?, ?, ?, ?, 'SAIDA', datetime('now'))
        ''', (4, 5, estoque_id, quantidade))
        
        conn.commit()
        
        print("\n✅ ESTOQUE PROCESSADO COM SUCESSO!")
        print(f"   Região {grupo} - Água 200ml")
        print(f"   Abatidas {quantidade} unidades")
        print(f"   Novo gasto total: {novo_gasto_str}")
        
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
    processar_estoque_os4()
