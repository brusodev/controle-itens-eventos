"""
Migration: Trajeto por item no módulo de Transporte
Data: 2026-06-05

- itens_ordem_servico:
  - trajeto_origem VARCHAR(200)
  - trajeto_destino VARCHAR(200)
  - trajeto_tipo VARCHAR(20)
"""

import os
import sqlite3
import sys

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'controle_itens.db')


def migrate():
    if not os.path.exists(DB_PATH):
        print("[AVISO] Banco não encontrado:", DB_PATH)
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    def col_existe(tabela, coluna):
        c.execute(f"PRAGMA table_info({tabela})")
        return any(r[1] == coluna for r in c.fetchall())

    def add_col(tabela, coluna, tipo):
        if not col_existe(tabela, coluna):
            c.execute(f"ALTER TABLE {tabela} ADD COLUMN {coluna} {tipo}")
            print(f"[ADD] {tabela}.{coluna}")
        else:
            print(f"[SKIP] {tabela}.{coluna} já existe")

    print("=" * 50)
    print("MIGRATION: trajeto por item (transporte)")
    print("=" * 50)

    add_col('itens_ordem_servico', 'trajeto_origem', 'VARCHAR(200)')
    add_col('itens_ordem_servico', 'trajeto_destino', 'VARCHAR(200)')
    add_col('itens_ordem_servico', 'trajeto_tipo', 'VARCHAR(20)')

    conn.commit()
    conn.close()
    print("Migração concluída!")


if __name__ == '__main__':
    migrate()
