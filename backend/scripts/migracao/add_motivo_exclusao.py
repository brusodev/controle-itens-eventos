#!/usr/bin/env python3
"""
Script para adicionar colunas de motivo e data de exclusão à tabela ordens_servico
"""
import sqlite3
import sys
import os
from datetime import datetime

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'instance', 'controle_itens.db')

def adicionar_colunas_exclusao():
    """Adiciona colunas motivo_exclusao e data_exclusao à tabela ordens_servico"""
    try:
        print("\n" + "="*70)
        print("MIGRAÇÃO: Adicionar colunas de motivo e data de exclusão")
        print("="*70)
        
        conexao = sqlite3.connect(DB_PATH)
        cursor = conexao.cursor()
        
        # Verificar se as colunas já existem
        cursor.execute("PRAGMA table_info(ordens_servico)")
        colunas = [col[1] for col in cursor.fetchall()]
        
        print(f"\n📊 Colunas existentes na tabela:")
        for col in colunas:
            print(f"   - {col}")
        
        # Adicionar motivo_exclusao se não existir
        if 'motivo_exclusao' not in colunas:
            print(f"\n➕ Adicionando coluna 'motivo_exclusao'...")
            cursor.execute("""
                ALTER TABLE ordens_servico 
                ADD COLUMN motivo_exclusao TEXT
            """)
            print("   ✅ Coluna 'motivo_exclusao' adicionada!")
        else:
            print(f"\n⏭️  Coluna 'motivo_exclusao' já existe!")
        
        # Adicionar data_exclusao se não existir
        if 'data_exclusao' not in colunas:
            print(f"\n➕ Adicionando coluna 'data_exclusao'...")
            cursor.execute("""
                ALTER TABLE ordens_servico 
                ADD COLUMN data_exclusao DATETIME
            """)
            print("   ✅ Coluna 'data_exclusao' adicionada!")
        else:
            print(f"\n⏭️  Coluna 'data_exclusao' já existe!")
        
        # Confirmar transação
        conexao.commit()
        
        # Verificar resultado
        cursor.execute("PRAGMA table_info(ordens_servico)")
        colunas_atuais = [col[1] for col in cursor.fetchall()]
        
        print(f"\n✅ Verificação final:")
        print(f"   Coluna 'motivo_exclusao': {'✅ PRESENTE' if 'motivo_exclusao' in colunas_atuais else '❌ NÃO ENCONTRADA'}")
        print(f"   Coluna 'data_exclusao': {'✅ PRESENTE' if 'data_exclusao' in colunas_atuais else '❌ NÃO ENCONTRADA'}")
        
        conexao.close()
        
        print("\n" + "="*70)
        print("✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
        print("="*70 + "\n")
        
        return True
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"\n⚠️  As colunas já existem no banco de dados: {e}")
            print("Nenhuma ação necessária.")
            return True
        else:
            print(f"\n❌ ERRO ao adicionar colunas: {e}")
            return False
    except Exception as e:
        print(f"\n❌ ERRO inesperado: {e}")
        return False

if __name__ == '__main__':
    if adicionar_colunas_exclusao():
        sys.exit(0)
    else:
        sys.exit(1)
