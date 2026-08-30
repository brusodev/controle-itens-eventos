#!/usr/bin/env python3
"""Migração: Criar tabelas pedidos_graficos / itens_pedido_grafico

Diferente das migrations de ALTER TABLE deste diretório, aqui as tabelas são
novas (sem dados a preservar), então db.create_all() é seguro e idempotente:
ele cria apenas as tabelas que ainda não existem.
"""

import sys
from pathlib import Path

# Adicionar o diretório pai ao path para importar app e models
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app, db
from models import PedidoGrafico, ItemPedidoGrafico  # garante que as classes sejam registradas no metadata
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("=" * 60)
    print("MIGRAÇÃO: Criar tabelas pedidos_graficos / itens_pedido_grafico")
    print("=" * 60)

    for tabela in ('pedidos_graficos', 'itens_pedido_grafico'):
        result = db.session.execute(text(
            "SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name=:nome"
        ), {'nome': tabela})
        existe = result.scalar() > 0
        print(f"{'✅ já existe' if existe else '➕ será criada'}: {tabela}")

    db.create_all()
    db.session.commit()

    print("✅ Tabelas verificadas/criadas com sucesso!")
    print("=" * 60)
    print("Migração concluída!")
    print("=" * 60)
