#!/usr/bin/env python3
"""Migração: Criar tabela de Categorias"""

import sys
import os
from pathlib import Path

# Adicionar o diretório pai ao pipe para importar app e models
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("=" * 60)
    print("MIGRAÇÃO: Criar tabela 'categorias'")
    print("=" * 60)
    
    try:
        # Verificar se tabela já existe
        result = db.session.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='categorias'"
        ))
        existe = result.scalar() is not None
        
        if existe:
            print("ℹ️  Tabela 'categorias' já existe")
            print("\n📋 Estrutura atual:")
            columns = db.session.execute(text(
                "PRAGMA table_info(categorias)"
            )).fetchall()
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
        else:
            # Criar tabela
            db.session.execute(text("""
                CREATE TABLE categorias (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome VARCHAR(100) UNIQUE NOT NULL,
                    tipo VARCHAR(50) NOT NULL,
                    natureza VARCHAR(50),
                    modulo VARCHAR(50) DEFAULT 'coffee',
                    icone VARCHAR(50),
                    descricao TEXT,
                    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Criar índice para buscas rápidas
            db.session.execute(text(
                "CREATE INDEX idx_categorias_tipo ON categorias(tipo)"
            ))
            
            db.session.commit()
            print("✅ Tabela 'categorias' criada com sucesso!")
            print("\n📋 Estrutura da tabela:")
            columns = db.session.execute(text(
                "PRAGMA table_info(categorias)"
            )).fetchall()
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
            
    except Exception as e:
        print(f"❌ Erro ao criar tabela: {e}")
        db.session.rollback()
    
    print("\n" + "=" * 60)
    print("Migração concluída!")
    print("=" * 60)
