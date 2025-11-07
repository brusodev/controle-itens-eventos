"""
Script de migração: Adicionar coluna 'perfil' na tabela usuarios
"""
import sqlite3
import os

# Caminho do banco de dados
db_path = os.path.join('instance', 'controle_itens.db')

if not os.path.exists(db_path):
    print("❌ Banco de dados não encontrado!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Verificar se a coluna já existe
    cursor.execute("PRAGMA table_info(usuarios)")
    colunas = [col[1] for col in cursor.fetchall()]
    
    if 'perfil' in colunas:
        print("✓ Coluna 'perfil' já existe na tabela usuarios")
    else:
        # Adicionar coluna perfil
        cursor.execute("ALTER TABLE usuarios ADD COLUMN perfil VARCHAR(20) DEFAULT 'comum' NOT NULL")
        print("✓ Coluna 'perfil' adicionada com sucesso!")
    
    # Definir o primeiro usuário como admin (se existir)
    cursor.execute("SELECT id, email FROM usuarios ORDER BY id LIMIT 1")
    primeiro_usuario = cursor.fetchone()
    
    if primeiro_usuario:
        cursor.execute("UPDATE usuarios SET perfil = 'admin' WHERE id = ?", (primeiro_usuario[0],))
        print(f"✓ Usuário '{primeiro_usuario[1]}' definido como ADMINISTRADOR")
    
    conn.commit()
    print("\n✅ Migração concluída com sucesso!")
    
except Exception as e:
    print(f"❌ Erro na migração: {e}")
    conn.rollback()
finally:
    conn.close()
