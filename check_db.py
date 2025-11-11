import sqlite3
import os

db_path = 'backend/instance/controle_itens.db'
print(f"Verificando banco em: {db_path}")
print(f"Existe? {os.path.exists(db_path)}")

if os.path.exists(db_path):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar colunas
        cursor.execute("PRAGMA table_info(itens_ordem_servico)")
        colunas = [col[1] for col in cursor.fetchall()]
        print(f"\nColunas atuais: {colunas}")
        
        # Verificar se valor_unitario existe
        if 'valor_unitario' not in colunas:
            print("\n🔧 Adicionando coluna valor_unitario...")
            cursor.execute("ALTER TABLE itens_ordem_servico ADD COLUMN valor_unitario VARCHAR(20) DEFAULT '0'")
            conn.commit()
            print("✅ Coluna adicionada!")
            
            # Verificar novamente
            cursor.execute("PRAGMA table_info(itens_ordem_servico)")
            colunas = [col[1] for col in cursor.fetchall()]
            print(f"\nColunas após migração: {colunas}")
        else:
            print("✅ Coluna valor_unitario já existe!")
        
        conn.close()
    except Exception as e:
        print(f"❌ Erro: {e}")
else:
    print("❌ Banco não encontrado!")
