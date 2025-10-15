"""
Script para adicionar coluna 'observacoes' na tabela ordens_servico
"""
import sqlite3
import os

# Caminho do banco de dados
DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'controle_itens.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Verificar se a coluna já existe
        cursor.execute("PRAGMA table_info(ordens_servico)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'observacoes' in columns:
            print("✅ Coluna 'observacoes' já existe!")
        else:
            # Adicionar coluna observacoes
            cursor.execute("""
                ALTER TABLE ordens_servico 
                ADD COLUMN observacoes TEXT
            """)
            conn.commit()
            print("✅ Coluna 'observacoes' adicionada com sucesso!")
        
        # Mostrar estrutura atualizada
        cursor.execute("PRAGMA table_info(ordens_servico)")
        print("\n📋 Estrutura da tabela ordens_servico:")
        for column in cursor.fetchall():
            print(f"  - {column[1]} ({column[2]})")
            
    except Exception as e:
        print(f"❌ Erro na migração: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    print("🔄 Iniciando migração...")
    migrate()
    print("✅ Migração concluída!")
