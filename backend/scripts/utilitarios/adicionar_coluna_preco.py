"""
Script para adicionar a coluna 'preco' na tabela estoque_regional
"""
import sqlite3
import os

# Caminho do banco de dados
DB_PATH = os.path.join('instance', 'controle_itens.db')

def adicionar_coluna_preco():
    """Adiciona a coluna preco na tabela estoque_regional"""
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Verificar se a coluna já existe
        cursor.execute("PRAGMA table_info(estoque_regional)")
        colunas = [col[1] for col in cursor.fetchall()]
        
        if 'preco' in colunas:
            print('✅ Coluna "preco" já existe na tabela estoque_regional')
        else:
            print('📝 Adicionando coluna "preco" na tabela estoque_regional...')
            cursor.execute('''
                ALTER TABLE estoque_regional 
                ADD COLUMN preco VARCHAR(20) DEFAULT '0'
            ''')
            conn.commit()
            print('✅ Coluna "preco" adicionada com sucesso!')
        
        # Verificar estrutura final
        cursor.execute("PRAGMA table_info(estoque_regional)")
        colunas_final = cursor.fetchall()
        
        print('\n📋 Estrutura atual da tabela estoque_regional:')
        for col in colunas_final:
            print(f'  - {col[1]} ({col[2]})')
        
        # Contar registros
        cursor.execute("SELECT COUNT(*) FROM estoque_regional")
        total = cursor.fetchone()[0]
        print(f'\n📊 Total de registros na tabela: {total}')
        
    except Exception as e:
        print(f'❌ Erro ao adicionar coluna: {e}')
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    print('='*60)
    print('MIGRAÇÃO: Adicionar coluna "preco" em estoque_regional')
    print('='*60)
    adicionar_coluna_preco()
    print('='*60)
