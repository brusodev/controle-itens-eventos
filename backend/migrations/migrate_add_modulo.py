#!/usr/bin/env python3
"""Migração: Adicionar coluna 'modulo' às tabelas categorias, ordens_servico e detentoras"""

import sys
import os
from pathlib import Path

# Adicionar o diretório pai ao pipe para importar app e models
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app, db
from sqlalchemy import text

app = create_app()

def add_column_if_not_exists(table, column, col_type, default_value=None):
    try:
        # Verificar se a coluna já existe
        result = db.session.execute(text(f"PRAGMA table_info({table})")).fetchall()
        cols = [row[1] for row in result]
        
        if column not in cols:
            print(f"🔧 Adicionando coluna '{column}' na tabela '{table}'...")
            db.session.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
            
            if default_value:
                print(f"📦 Definindo valor padrão '{default_value}' para '{column}' na tabela '{table}'...")
                db.session.execute(text(f"UPDATE {table} SET {column} = '{default_value}'"))
            
            db.session.commit()
            print(f"✅ Coluna '{column}' adicionada com sucesso!")
        else:
            print(f"ℹ️  Coluna '{column}' já existe na tabela '{table}'")
    except Exception as e:
        print(f"❌ Erro ao adicionar coluna na tabela '{table}': {e}")
        db.session.rollback()

with app.app_context():
    print("=" * 60)
    print("MIGRAÇÃO: Adicionar suporte a módulos")
    print("=" * 60)
    
    # 1. Adicionar coluna 'modulo' em categorias
    add_column_if_not_exists('categorias', 'modulo', 'VARCHAR(50)', 'coffee')
    
    # 2. Adicionar coluna 'modulo' em ordens_servico
    add_column_if_not_exists('ordens_servico', 'modulo', 'VARCHAR(50)', 'coffee')
    
    # 3. Adicionar coluna 'modulo' em detentoras
    add_column_if_not_exists('detentoras', 'modulo', 'VARCHAR(50)', 'coffee')
    
    print("\n" + "=" * 60)
    print("Migração concluída!")
    print("=" * 60)
