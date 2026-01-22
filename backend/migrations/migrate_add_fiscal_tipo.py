"""
Script para adicionar coluna 'fiscal_tipo' na tabela ordens_servico
"""
import sqlite3
import os
from pathlib import Path

# Caminho do banco de dados - Sobe dois níveis para sair de backend/migrations e entrar em backend/instance
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'controle_itens.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Verificar se a coluna já existe
        cursor.execute("PRAGMA table_info(ordens_servico)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'fiscal_tipo' in columns:
            print("✅ Coluna 'fiscal_tipo' já existe!")
        else:
            # Adicionar coluna fiscal_tipo com valor padrão
            cursor.execute("""
                ALTER TABLE ordens_servico 
                ADD COLUMN fiscal_tipo VARCHAR(50) DEFAULT 'Fiscal do Contrato'
            """)
            conn.commit()
            print("✅ Coluna 'fiscal_tipo' adicionada com sucesso!")
        
        # Atualizar registros existentes que não têm valor
        cursor.execute("""
            UPDATE ordens_servico 
            SET fiscal_tipo = 'Fiscal do Contrato' 
            WHERE fiscal_tipo IS NULL OR fiscal_tipo = ''
        """)
        conn.commit()
        print(f"✅ {cursor.rowcount} registros atualizados com valor padrão!")
        
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
