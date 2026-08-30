#!/usr/bin/env python3
"""Migração: Adicionar modulos_permitidos em usuarios (permissão real por módulo)"""

import sys
from pathlib import Path

# Adicionar o diretório pai ao path para importar app e models
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app, db
from sqlalchemy import text

app = create_app()

COLUNA = ('modulos_permitidos', 'TEXT')

with app.app_context():
    print("=" * 60)
    print("MIGRAÇÃO: Adicionar modulos_permitidos em usuarios")
    print("=" * 60)

    coluna, tipo = COLUNA
    try:
        result = db.session.execute(text(
            "SELECT COUNT(*) as cnt FROM pragma_table_info('usuarios') "
            "WHERE name=:nome"
        ), {'nome': coluna})
        existe = result.scalar() > 0

        if existe:
            print(f"✅ Coluna '{coluna}' já existe")
        else:
            db.session.execute(text(
                f"ALTER TABLE usuarios ADD COLUMN {coluna} {tipo}"
            ))
            db.session.commit()
            print(f"✅ Coluna '{coluna}' adicionada com sucesso! (Tipo: {tipo})")
            print("   NULL/vazio = sem restrição — todo usuário existente mantém acesso total.")

    except Exception as e:
        print(f"❌ Erro ao adicionar coluna '{coluna}': {e}")
        db.session.rollback()

    print("=" * 60)
    print("Migração concluída!")
    print("=" * 60)
