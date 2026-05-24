"""
Migration Sprint 1 - Portal da Detentora
=========================================
Mudanças retroativas (sem quebrar dados existentes):

1. ordens_servico      — ADD COLUMN status TEXT DEFAULT 'emitida'
                         Backfill: O.S. existentes → 'emitida'
2. usuarios            — ADD COLUMN detentora_id INTEGER (FK detentoras.id, nullable)
3. CREATE TABLE aceites_empresa
4. CREATE TABLE revisoes_empresa
5. CREATE TABLE comentarios_empresa
"""
import sqlite3
import os
import sys
import io

# Fix encoding no Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'controle_itens.db')


def coluna_existe(cursor, tabela, coluna):
    cursor.execute(f"PRAGMA table_info({tabela})")
    return any(col[1] == coluna for col in cursor.fetchall())


def tabela_existe(cursor, tabela):
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (tabela,))
    return cursor.fetchone() is not None


def migrate():
    if not os.path.exists(DB_PATH):
        print("[AVISO] Banco de dados nao encontrado em:", DB_PATH)
        print("         Em instalacao nova, execute 'python init_db.py' — os novos models ja estao incluidos.")
        print("         Esta migration e necessaria apenas para atualizar bancos existentes.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # ------------------------------------------------------------------
        # 1. ordens_servico — coluna status
        # ------------------------------------------------------------------
        if not coluna_existe(cursor, 'ordens_servico', 'status'):
            cursor.execute("ALTER TABLE ordens_servico ADD COLUMN status TEXT NOT NULL DEFAULT 'emitida'")
            cursor.execute("UPDATE ordens_servico SET status = 'emitida' WHERE status IS NULL OR status = ''")
            conn.commit()
            print("[OK] Coluna 'status' adicionada em ordens_servico e backfill concluido.")
        else:
            print("[--] Coluna 'status' ja existe em ordens_servico.")

        # ------------------------------------------------------------------
        # 2. usuarios — coluna detentora_id
        # ------------------------------------------------------------------
        if not coluna_existe(cursor, 'usuarios', 'detentora_id'):
            cursor.execute("ALTER TABLE usuarios ADD COLUMN detentora_id INTEGER REFERENCES detentoras(id)")
            conn.commit()
            print("[OK] Coluna 'detentora_id' adicionada em usuarios.")
        else:
            print("[--] Coluna 'detentora_id' ja existe em usuarios.")

        # ------------------------------------------------------------------
        # 3. aceites_empresa
        # ------------------------------------------------------------------
        if not tabela_existe(cursor, 'aceites_empresa'):
            cursor.execute("""
                CREATE TABLE aceites_empresa (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    ordem_servico_id INTEGER NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
                    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
                    detentora_id    INTEGER NOT NULL REFERENCES detentoras(id),
                    nome_responsavel TEXT NOT NULL,
                    assinatura_path TEXT,
                    hash_payload    TEXT,
                    data_hora       DATETIME NOT NULL,
                    ip_address      TEXT,
                    user_agent      TEXT,
                    observacoes     TEXT
                )
            """)
            cursor.execute("CREATE INDEX idx_aceites_os ON aceites_empresa(ordem_servico_id)")
            cursor.execute("CREATE INDEX idx_aceites_det ON aceites_empresa(detentora_id)")
            conn.commit()
            print("[OK] Tabela 'aceites_empresa' criada.")
        else:
            print("[--] Tabela 'aceites_empresa' ja existe.")

        # ------------------------------------------------------------------
        # 4. revisoes_empresa
        # ------------------------------------------------------------------
        if not tabela_existe(cursor, 'revisoes_empresa'):
            cursor.execute("""
                CREATE TABLE revisoes_empresa (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    ordem_servico_id INTEGER NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
                    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
                    detentora_id    INTEGER NOT NULL REFERENCES detentoras(id),
                    descricao       TEXT NOT NULL,
                    criado_em       DATETIME NOT NULL
                )
            """)
            cursor.execute("CREATE INDEX idx_revisoes_os ON revisoes_empresa(ordem_servico_id)")
            cursor.execute("CREATE INDEX idx_revisoes_det ON revisoes_empresa(detentora_id)")
            conn.commit()
            print("[OK] Tabela 'revisoes_empresa' criada.")
        else:
            print("[--] Tabela 'revisoes_empresa' ja existe.")

        # ------------------------------------------------------------------
        # 5. comentarios_empresa
        # ------------------------------------------------------------------
        if not tabela_existe(cursor, 'comentarios_empresa'):
            cursor.execute("""
                CREATE TABLE comentarios_empresa (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    ordem_servico_id INTEGER NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
                    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
                    detentora_id    INTEGER NOT NULL REFERENCES detentoras(id),
                    texto           TEXT NOT NULL,
                    criado_em       DATETIME NOT NULL
                )
            """)
            cursor.execute("CREATE INDEX idx_coment_os ON comentarios_empresa(ordem_servico_id)")
            cursor.execute("CREATE INDEX idx_coment_det ON comentarios_empresa(detentora_id)")
            conn.commit()
            print("[OK] Tabela 'comentarios_empresa' criada.")
        else:
            print("[--] Tabela 'comentarios_empresa' ja existe.")

        print("\nMigration Sprint 1 concluida com sucesso.")

    except Exception as e:
        conn.rollback()
        print(f"[ERRO] {e}")
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    migrate()
