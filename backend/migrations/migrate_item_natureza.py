#!/usr/bin/env python3
"""Migração: Adicionar coluna 'natureza' na tabela itens (BEC individual por item)"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("=" * 60)
    print("MIGRAÇÃO: Adicionar campo natureza ao Item")
    print("=" * 60)

    try:
        result = db.session.execute(text("PRAGMA table_info(itens)")).fetchall()
        cols = [row[1] for row in result]

        if 'natureza' not in cols:
            print("Adicionando coluna 'natureza' na tabela 'itens'...")
            db.session.execute(text("ALTER TABLE itens ADD COLUMN natureza VARCHAR(50)"))
            db.session.commit()
            print("Coluna 'natureza' adicionada com sucesso!")
        else:
            print("Coluna 'natureza' já existe na tabela 'itens'")
    except Exception as e:
        print(f"Erro: {e}")
        db.session.rollback()

    print("=" * 60)
    print("Migração concluída!")
    print("=" * 60)
