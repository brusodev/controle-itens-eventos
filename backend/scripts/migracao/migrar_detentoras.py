"""
Script de migração para adicionar tabela de detentoras
Execução: python migrar_detentoras.py
"""
import sqlite3
import os

# Caminho do banco de dados
db_path = os.path.join('instance', 'controle_itens.db')

def migrar():
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔄 Verificando se a tabela 'detentoras' existe...")
        
        # Verificar se a tabela já existe
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='detentoras'
        """)
        
        if cursor.fetchone():
            print("⚠️  Tabela 'detentoras' já existe!")
            resposta = input("Deseja recriar a tabela? (s/N): ")
            if resposta.lower() != 's':
                print("❌ Migração cancelada.")
                return
            
            cursor.execute("DROP TABLE detentoras")
            print("🗑️  Tabela antiga removida.")
        
        # Criar tabela detentoras
        print("📝 Criando tabela 'detentoras'...")
        cursor.execute("""
            CREATE TABLE detentoras (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contrato_num VARCHAR(100) NOT NULL,
                data_assinatura VARCHAR(20),
                prazo_vigencia VARCHAR(20),
                nome VARCHAR(200) NOT NULL,
                cnpj VARCHAR(20) NOT NULL,
                servico VARCHAR(100) DEFAULT 'COFFEE BREAK',
                grupo VARCHAR(100) NOT NULL,
                criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                ativo BOOLEAN DEFAULT 1
            )
        """)
        
        # Criar índice para grupo
        cursor.execute("""
            CREATE INDEX idx_detentoras_grupo ON detentoras(grupo)
        """)
        
        # Verificar se a coluna detentora_id existe em ordens_servico
        cursor.execute("PRAGMA table_info(ordens_servico)")
        colunas = [col[1] for col in cursor.fetchall()]
        
        if 'detentora_id' not in colunas:
            print("📝 Adicionando coluna 'detentora_id' em 'ordens_servico'...")
            cursor.execute("""
                ALTER TABLE ordens_servico 
                ADD COLUMN detentora_id INTEGER 
                REFERENCES detentoras(id)
            """)
        else:
            print("✓ Coluna 'detentora_id' já existe em 'ordens_servico'")
        
        conn.commit()
        print("✅ Tabela 'detentoras' criada com sucesso!")
        print("✅ Migração concluída!")
        
    except sqlite3.Error as e:
        print(f"❌ Erro ao executar migração: {e}")
        conn.rollback()
    
    finally:
        conn.close()

if __name__ == '__main__':
    print("="*60)
    print("MIGRAÇÃO: Adicionar Tabela de Detentoras")
    print("="*60)
    
    if not os.path.exists(db_path):
        print(f"❌ Banco de dados não encontrado: {db_path}")
        print("Execute o aplicativo primeiro para criar o banco de dados.")
    else:
        migrar()
