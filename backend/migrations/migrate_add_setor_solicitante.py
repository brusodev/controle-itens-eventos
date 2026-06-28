#!/usr/bin/env python3
"""Migração: Adicionar campo setor_solicitante em ordens_servico (módulo Transporte)"""

import sys
from pathlib import Path

# Adicionar o diretório pai ao path para importar app e models
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("=" * 60)
    print("MIGRAÇÃO: Adicionar setor_solicitante em ordens_servico")
    print("=" * 60)

    try:
        result = db.session.execute(text(
            "SELECT COUNT(*) as cnt FROM pragma_table_info('ordens_servico') "
            "WHERE name='setor_solicitante'"
        ))
        existe = result.scalar() > 0

        if existe:
            print("✅ Coluna 'setor_solicitante' já existe")
        else:
            db.session.execute(text(
                "ALTER TABLE ordens_servico ADD COLUMN setor_solicitante VARCHAR(200)"
            ))
            db.session.commit()
            print("✅ Coluna 'setor_solicitante' adicionada com sucesso!")
            print("   - Tipo: VARCHAR(200)")

    except Exception as e:
        print(f"❌ Erro ao adicionar coluna: {e}")
        db.session.rollback()

    print("=" * 60)
    print("Migração concluída!")
    print("=" * 60)
