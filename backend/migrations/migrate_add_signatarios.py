"""
Migration: Adicionar coluna 'signatarios_json' na tabela ordens_servico
e backfill registros existentes a partir das colunas legadas (gestor/fiscal).
"""
import sqlite3
import os
import sys
import io
import json

# Fix encoding no Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'controle_itens.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Verificar se coluna já existe
        cursor.execute("PRAGMA table_info(ordens_servico)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'signatarios_json' in columns:
            print("Coluna 'signatarios_json' já existe.")
        else:
            cursor.execute("ALTER TABLE ordens_servico ADD COLUMN signatarios_json TEXT")
            conn.commit()
            print("Coluna 'signatarios_json' adicionada com sucesso.")

        # Backfill: converter registros existentes para JSON
        cursor.execute("""
            SELECT id, gestor_contrato, fiscal_contrato, fiscal_tipo
            FROM ordens_servico
            WHERE signatarios_json IS NULL
        """)
        rows = cursor.fetchall()

        count = 0
        for row in rows:
            os_id, gestor, fiscal, fiscal_tipo = row
            signatarios = []
            if gestor:
                signatarios.append({"cargo": "Gestor do Contrato", "nome": gestor})
            if fiscal:
                signatarios.append({"cargo": fiscal_tipo or "Fiscal do Contrato", "nome": fiscal})
            if signatarios:
                cursor.execute(
                    "UPDATE ordens_servico SET signatarios_json = ? WHERE id = ?",
                    (json.dumps(signatarios, ensure_ascii=False), os_id)
                )
                count += 1

        conn.commit()
        print(f"Backfill concluído: {count} registros atualizados de {len(rows)} encontrados.")

    except Exception as e:
        print(f"Erro na migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
