"""
Script para corrigir a coluna detentora_id na tabela ordens_servico
"""
import sqlite3
import os

db_path = os.path.join('instance', 'controle_itens.db')

def verificar_e_corrigir():
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("=" * 60)
        print("🔧 VERIFICAÇÃO E CORREÇÃO: coluna detentora_id")
        print("=" * 60)
        
        # Verificar estrutura da tabela ordens_servico
        print("\n📋 Verificando estrutura da tabela 'ordens_servico'...")
        cursor.execute("PRAGMA table_info(ordens_servico)")
        colunas = cursor.fetchall()
        
        colunas_nomes = [col[1] for col in colunas]
        print(f"✓ Colunas encontradas: {len(colunas_nomes)}")
        
        if 'detentora_id' in colunas_nomes:
            print("✅ Coluna 'detentora_id' JÁ EXISTE!")
            print("\n📊 Estrutura da coluna:")
            for col in colunas:
                if col[1] == 'detentora_id':
                    print(f"   Nome: {col[1]}")
                    print(f"   Tipo: {col[2]}")
                    print(f"   Nullable: {'Sim' if col[3] == 0 else 'Não'}")
                    print(f"   Default: {col[4]}")
        else:
            print("❌ Coluna 'detentora_id' NÃO EXISTE!")
            print("\n🔧 Adicionando coluna 'detentora_id'...")
            
            cursor.execute("""
                ALTER TABLE ordens_servico 
                ADD COLUMN detentora_id INTEGER
            """)
            
            conn.commit()
            print("✅ Coluna 'detentora_id' adicionada com sucesso!")
            
            # Verificar novamente
            cursor.execute("PRAGMA table_info(ordens_servico)")
            colunas = cursor.fetchall()
            colunas_nomes = [col[1] for col in colunas]
            
            if 'detentora_id' in colunas_nomes:
                print("✓ Verificação: Coluna adicionada corretamente!")
            else:
                print("❌ ERRO: Coluna não foi adicionada!")
        
        print("\n" + "=" * 60)
        print("✅ Verificação concluída!")
        print("=" * 60)
        
    except sqlite3.Error as e:
        print(f"\n❌ ERRO: {e}")
        conn.rollback()
    
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    if not os.path.exists(db_path):
        print(f"❌ Banco de dados não encontrado: {db_path}")
    else:
        verificar_e_corrigir()
