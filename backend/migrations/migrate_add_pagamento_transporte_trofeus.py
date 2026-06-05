"""
Migration: Campos de pagamento e transporte/organizacao + unique por detentora
Data: 2026-06-04

- ordens_servico:
  - trajeto_origem, trajeto_destino, trajeto_km, trajeto_tipo
  - qtd_pessoas_atendidas
  - pagamento_vencimento, pagamento_pago
  - atualizar UNIQUE para (numero_os, modulo, detentora_id)

Execute UMA VEZ na VPS apos git pull.
"""

import os
import sqlite3
import io
import re
import sys

# Fix encoding no Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'controle_itens.db')


def coluna_existe(cursor, tabela, coluna):
    cursor.execute(f"PRAGMA table_info({tabela})")
    return any(row[1] == coluna for row in cursor.fetchall())


def tabela_existe(cursor, tabela):
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (tabela,))
    return cursor.fetchone() is not None


def add_column_if_not_exists(cursor, tabela, coluna, col_type, default_sql=None):
    if not coluna_existe(cursor, tabela, coluna):
        print(f"[ADD] {tabela}.{coluna} {col_type}")
        cursor.execute(f"ALTER TABLE {tabela} ADD COLUMN {coluna} {col_type}")
        if default_sql:
            cursor.execute(f"UPDATE {tabela} SET {coluna} = {default_sql}")
    else:
        print(f"[SKIP] {tabela}.{coluna} ja existe")


def _replace_unique_constraint(create_sql):
    if not create_sql:
        return None

    if 'detentora_id' in create_sql and 'numero_os' in create_sql and 'modulo' in create_sql:
        if 'UNIQUE (numero_os, modulo, detentora_id)' in create_sql:
            return None

    # Try to replace constraint by name or by columns
    updated = create_sql
    updated = re.sub(
        r"CONSTRAINT\s+_numero_os_modulo_uc\s+UNIQUE\s*\(\s*numero_os\s*,\s*modulo\s*\)",
        "CONSTRAINT _numero_os_modulo_detentora_uc UNIQUE (numero_os, modulo, detentora_id)",
        updated,
        flags=re.IGNORECASE
    )
    updated = re.sub(
        r"UNIQUE\s*\(\s*numero_os\s*,\s*modulo\s*\)",
        "UNIQUE (numero_os, modulo, detentora_id)",
        updated,
        flags=re.IGNORECASE
    )

    if updated == create_sql:
        return None

    return updated


def rebuild_ordens_servico_unique(conn):
    c = conn.cursor()
    c.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='ordens_servico'")
    row = c.fetchone()
    create_sql = row[0] if row else None

    updated_sql = _replace_unique_constraint(create_sql)
    if not updated_sql:
        print("[SKIP] UNIQUE ja atualizado ou nao encontrado")
        return

    print("[INFO] Recriando tabela ordens_servico com UNIQUE por detentora")

    # Criar nova tabela
    new_sql = updated_sql.replace('CREATE TABLE ordens_servico', 'CREATE TABLE ordens_servico_new', 1)

    c.execute("PRAGMA foreign_keys=OFF")
    conn.commit()

    c.execute(new_sql)

    # Copiar dados
    c.execute("PRAGMA table_info(ordens_servico)")
    old_cols = [row[1] for row in c.fetchall()]
    c.execute("PRAGMA table_info(ordens_servico_new)")
    new_cols = [row[1] for row in c.fetchall()]

    common_cols = [col for col in old_cols if col in new_cols]
    if common_cols:
        cols_csv = ', '.join(common_cols)
        c.execute(f"INSERT INTO ordens_servico_new ({cols_csv}) SELECT {cols_csv} FROM ordens_servico")

    c.execute("DROP TABLE ordens_servico")
    c.execute("ALTER TABLE ordens_servico_new RENAME TO ordens_servico")

    c.execute("PRAGMA foreign_keys=ON")
    conn.commit()
    print("[OK] UNIQUE atualizado")


def migrate():
    if not os.path.exists(DB_PATH):
        print("[AVISO] Banco nao encontrado em:", DB_PATH)
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    try:
        print("=" * 60)
        print("MIGRATION: Pagamento + Transporte/Organizacao + UNIQUE detentora")
        print("=" * 60)

        if not tabela_existe(c, 'ordens_servico'):
            print("[ERRO] Tabela ordens_servico nao encontrada")
            return

        # Novos campos
        add_column_if_not_exists(c, 'ordens_servico', 'trajeto_origem', 'VARCHAR(200)')
        add_column_if_not_exists(c, 'ordens_servico', 'trajeto_destino', 'VARCHAR(200)')
        add_column_if_not_exists(c, 'ordens_servico', 'trajeto_km', 'VARCHAR(50)')
        add_column_if_not_exists(c, 'ordens_servico', 'trajeto_tipo', 'VARCHAR(20)')
        add_column_if_not_exists(c, 'ordens_servico', 'qtd_pessoas_atendidas', 'INTEGER')
        add_column_if_not_exists(c, 'ordens_servico', 'pagamento_vencimento', 'VARCHAR(20)')
        add_column_if_not_exists(c, 'ordens_servico', 'pagamento_pago', 'BOOLEAN', "0")

        conn.commit()

        # Ajustar UNIQUE
        rebuild_ordens_servico_unique(conn)

        print("\n" + "=" * 60)
        print("Migracao concluida!")
        print("=" * 60)

    except Exception as e:
        conn.rollback()
        print("[ERRO]", e)
    finally:
        conn.close()


if __name__ == '__main__':
    migrate()
