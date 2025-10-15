"""
Migration: Adicionar campo 'responsavel' na tabela ordens_servico
Data: 2025-10-14
"""

from app import create_app
from models import db
from sqlalchemy import text

def migrate():
    app = create_app()
    
    with app.app_context():
        print("=" * 80)
        print("🔄 MIGRATION: Adicionar campo 'responsavel' em ordens_servico")
        print("=" * 80)
        
        try:
            # Adicionar coluna responsavel
            print("\n📝 Adicionando coluna 'responsavel'...")
            with db.engine.connect() as conn:
                conn.execute(text("""
                    ALTER TABLE ordens_servico 
                    ADD COLUMN responsavel VARCHAR(200)
                """))
                conn.commit()
            
            print("✅ Coluna 'responsavel' adicionada com sucesso!")
            
            # Verificar estrutura da tabela
            print("\n📊 Verificando estrutura da tabela...")
            with db.engine.connect() as conn:
                result = conn.execute(text("PRAGMA table_info(ordens_servico)"))
                columns = result.fetchall()
            
            print("\n📋 Colunas atuais em ordens_servico:")
            for col in columns:
                print(f"   - {col[1]} ({col[2]})")
            
            print("\n" + "=" * 80)
            print("✅ MIGRATION CONCLUÍDA COM SUCESSO!")
            print("=" * 80)
            
        except Exception as e:
            print(f"\n❌ Erro durante migration: {e}")
            print("\nNOTA: Se o erro for 'duplicate column name', a coluna já existe.")
            
            # Verificar se coluna já existe
            with db.engine.connect() as conn:
                result = conn.execute(text("PRAGMA table_info(ordens_servico)"))
                columns = result.fetchall()
                column_names = [col[1] for col in columns]
            
            if 'responsavel' in column_names:
                print("✅ A coluna 'responsavel' já existe no banco de dados.")
            else:
                print("❌ A coluna NÃO existe. Erro inesperado.")
                raise e

if __name__ == '__main__':
    migrate()
