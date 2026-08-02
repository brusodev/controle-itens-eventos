#!/usr/bin/env python3
"""Migração: Adicionar data_pedido e data_entrega em ordens_servico (módulo Serviços Gráficos)"""

import sys
from pathlib import Path

# Adicionar o diretório pai ao path para importar app e models
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app, db
from sqlalchemy import text

app = create_app()

COLUNAS = [
    ('data_pedido', 'VARCHAR(20)'),
    ('data_entrega', 'VARCHAR(20)'),
]

with app.app_context():
    print("=" * 60)
    print("MIGRAÇÃO: Adicionar data_pedido/data_entrega em ordens_servico")
    print("=" * 60)

    for coluna, tipo in COLUNAS:
        try:
            result = db.session.execute(text(
                "SELECT COUNT(*) as cnt FROM pragma_table_info('ordens_servico') "
                "WHERE name=:nome"
            ), {'nome': coluna})
            existe = result.scalar() > 0

            if existe:
                print(f"✅ Coluna '{coluna}' já existe")
            else:
                db.session.execute(text(
                    f"ALTER TABLE ordens_servico ADD COLUMN {coluna} {tipo}"
                ))
                db.session.commit()
                print(f"✅ Coluna '{coluna}' adicionada com sucesso! (Tipo: {tipo})")

        except Exception as e:
            print(f"❌ Erro ao adicionar coluna '{coluna}': {e}")
            db.session.rollback()

    print("=" * 60)
    print("Migração concluída!")
    print("=" * 60)
