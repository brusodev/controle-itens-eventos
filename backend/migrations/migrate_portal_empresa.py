"""
Migration: Portal da Detentora — colunas e tabelas novas
Data: 2026-05-24

Cobre tudo que o portal_empresa + ajustes_bugs adicionaram ao schema
e que não estava em migrations anteriores:

  ordens_servico:
    - detentora_id  INTEGER (FK detentoras.id, nullable)
    - data_emissao  DATETIME
    - data_emissao_completa  VARCHAR(50)

  usuarios:
    - detentora_id  INTEGER (FK detentoras.id, nullable)

  Tabelas novas:
    - aceites_empresa
    - revisoes_empresa
    - comentarios_empresa
    - assinaturas_internas

Execute UMA VEZ na VPS após git pull, antes de reiniciar o servidor.
É idempotente: verifica o que já existe antes de criar.
"""

import sys
import os
import sqlite3
import io

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


def migrate():
    if not os.path.exists(DB_PATH):
        print("[AVISO] Banco nao encontrado em:", DB_PATH)
        print("         Em instalacao nova use 'python init_db.py'.")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    try:
        print("=" * 60)
        print("MIGRATION: Portal da Detentora")
        print("=" * 60)

        # ------------------------------------------------------------------
        # ordens_servico — detentora_id
        # ------------------------------------------------------------------
        if not coluna_existe(c, 'ordens_servico', 'detentora_id'):
            c.execute("ALTER TABLE ordens_servico ADD COLUMN detentora_id INTEGER REFERENCES detentoras(id)")
            conn.commit()
            print("[OK] ordens_servico.detentora_id adicionada")
        else:
            print("[--] ordens_servico.detentora_id ja existe")

        # ------------------------------------------------------------------
        # ordens_servico — data_emissao
        # ------------------------------------------------------------------
        if not coluna_existe(c, 'ordens_servico', 'data_emissao'):
            c.execute("ALTER TABLE ordens_servico ADD COLUMN data_emissao DATETIME")
            conn.commit()
            print("[OK] ordens_servico.data_emissao adicionada")
        else:
            print("[--] ordens_servico.data_emissao ja existe")

        # ------------------------------------------------------------------
        # ordens_servico — data_emissao_completa
        # ------------------------------------------------------------------
        if not coluna_existe(c, 'ordens_servico', 'data_emissao_completa'):
            c.execute("ALTER TABLE ordens_servico ADD COLUMN data_emissao_completa VARCHAR(50)")
            conn.commit()
            print("[OK] ordens_servico.data_emissao_completa adicionada")
        else:
            print("[--] ordens_servico.data_emissao_completa ja existe")

        # ------------------------------------------------------------------
        # usuarios — detentora_id
        # ------------------------------------------------------------------
        if not coluna_existe(c, 'usuarios', 'detentora_id'):
            c.execute("ALTER TABLE usuarios ADD COLUMN detentora_id INTEGER REFERENCES detentoras(id)")
            conn.commit()
            print("[OK] usuarios.detentora_id adicionada")
        else:
            print("[--] usuarios.detentora_id ja existe")

        # ------------------------------------------------------------------
        # aceites_empresa
        # ------------------------------------------------------------------
        if not tabela_existe(c, 'aceites_empresa'):
            c.execute("""
                CREATE TABLE aceites_empresa (
                    id               INTEGER PRIMARY KEY AUTOINCREMENT,
                    ordem_servico_id INTEGER NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
                    usuario_id       INTEGER NOT NULL REFERENCES usuarios(id),
                    detentora_id     INTEGER NOT NULL REFERENCES detentoras(id),
                    nome_responsavel TEXT NOT NULL,
                    assinatura_path  TEXT,
                    hash_payload     TEXT,
                    data_hora        DATETIME NOT NULL,
                    ip_address       TEXT,
                    user_agent       TEXT,
                    observacoes      TEXT
                )
            """)
            c.execute("CREATE INDEX ix_aceites_os  ON aceites_empresa(ordem_servico_id)")
            c.execute("CREATE INDEX ix_aceites_det ON aceites_empresa(detentora_id)")
            conn.commit()
            print("[OK] aceites_empresa criada")
        else:
            print("[--] aceites_empresa ja existe")

        # ------------------------------------------------------------------
        # revisoes_empresa
        # ------------------------------------------------------------------
        if not tabela_existe(c, 'revisoes_empresa'):
            c.execute("""
                CREATE TABLE revisoes_empresa (
                    id               INTEGER PRIMARY KEY AUTOINCREMENT,
                    ordem_servico_id INTEGER NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
                    usuario_id       INTEGER NOT NULL REFERENCES usuarios(id),
                    detentora_id     INTEGER NOT NULL REFERENCES detentoras(id),
                    descricao        TEXT NOT NULL,
                    criado_em        DATETIME NOT NULL
                )
            """)
            c.execute("CREATE INDEX ix_revisoes_os  ON revisoes_empresa(ordem_servico_id)")
            c.execute("CREATE INDEX ix_revisoes_det ON revisoes_empresa(detentora_id)")
            conn.commit()
            print("[OK] revisoes_empresa criada")
        else:
            print("[--] revisoes_empresa ja existe")

        # ------------------------------------------------------------------
        # comentarios_empresa
        # ------------------------------------------------------------------
        if not tabela_existe(c, 'comentarios_empresa'):
            c.execute("""
                CREATE TABLE comentarios_empresa (
                    id               INTEGER PRIMARY KEY AUTOINCREMENT,
                    ordem_servico_id INTEGER NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
                    usuario_id       INTEGER NOT NULL REFERENCES usuarios(id),
                    detentora_id     INTEGER NOT NULL REFERENCES detentoras(id),
                    texto            TEXT NOT NULL,
                    criado_em        DATETIME NOT NULL
                )
            """)
            c.execute("CREATE INDEX ix_coment_os  ON comentarios_empresa(ordem_servico_id)")
            c.execute("CREATE INDEX ix_coment_det ON comentarios_empresa(detentora_id)")
            conn.commit()
            print("[OK] comentarios_empresa criada")
        else:
            print("[--] comentarios_empresa ja existe")

        # ------------------------------------------------------------------
        # assinaturas_internas
        # ------------------------------------------------------------------
        if not tabela_existe(c, 'assinaturas_internas'):
            c.execute("""
                CREATE TABLE assinaturas_internas (
                    id               INTEGER PRIMARY KEY AUTOINCREMENT,
                    ordem_servico_id INTEGER NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
                    usuario_id       INTEGER NOT NULL REFERENCES usuarios(id),
                    nome_responsavel VARCHAR(120) NOT NULL,
                    cargo            VARCHAR(100),
                    assinatura_path  VARCHAR(255),
                    hash_payload     VARCHAR(64),
                    data_hora        DATETIME NOT NULL,
                    ip_address       VARCHAR(45)
                )
            """)
            c.execute("CREATE INDEX ix_assinaturas_os ON assinaturas_internas(ordem_servico_id)")
            conn.commit()
            print("[OK] assinaturas_internas criada")
        else:
            print("[--] assinaturas_internas ja existe")

        print("\n" + "=" * 60)
        print("MIGRATION CONCLUIDA COM SUCESSO")
        print("=" * 60)

    except Exception as e:
        conn.rollback()
        print(f"[ERRO] {e}")
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    migrate()
