"""
migrate_producao.py — Migração segura para produção.
Adiciona apenas colunas que ainda não existem. Idempotente (pode rodar várias vezes).
Faz backup automático do banco antes de qualquer alteração.

Uso:
    cd backend
    python migrate_producao.py
"""
import sqlite3
import os
import shutil
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'controle_itens.db')


def coluna_existe(cur, tabela, coluna):
    cur.execute(f"PRAGMA table_info({tabela})")
    return any(row[1] == coluna for row in cur.fetchall())


def tabela_existe(cur, tabela):
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (tabela,))
    return cur.fetchone() is not None


def add_column(cur, tabela, coluna, definicao):
    if not tabela_existe(cur, tabela):
        print(f"  [SKIP] Tabela nao existe ainda: {tabela} (sera criada pelo create_all)")
        return
    if not coluna_existe(cur, tabela, coluna):
        cur.execute(f"ALTER TABLE {tabela} ADD COLUMN {coluna} {definicao}")
        print(f"  [ADD]  Adicionada: {tabela}.{coluna}")
    else:
        print(f"  [OK]   Ja existe:  {tabela}.{coluna}")


def main():
    if not os.path.exists(DB_PATH):
        print(f"❌ Banco não encontrado em: {DB_PATH}")
        print("   Execute o servidor uma vez para criar o banco e tente novamente.")
        return

    # ── Backup automatico ─────────────────────────────────────────────────
    backup = DB_PATH + f'.bak_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    shutil.copy2(DB_PATH, backup)
    print(f"[BACKUP] Criado: {backup}\n")

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    try:
        print("-- ordens_servico --------------------------------------------------")
        add_column(cur, 'ordens_servico', 'status',           "VARCHAR(30) NOT NULL DEFAULT 'emitida'")
        add_column(cur, 'ordens_servico', 'detentora_id',     "INTEGER REFERENCES detentoras(id)")
        add_column(cur, 'ordens_servico', 'horario',          "VARCHAR(50)")
        add_column(cur, 'ordens_servico', 'local',            "TEXT")
        add_column(cur, 'ordens_servico', 'responsavel',      "VARCHAR(200)")
        add_column(cur, 'ordens_servico', 'justificativa',    "TEXT")
        add_column(cur, 'ordens_servico', 'observacoes',      "TEXT")
        add_column(cur, 'ordens_servico', 'motivo_exclusao',  "TEXT")
        add_column(cur, 'ordens_servico', 'data_exclusao',    "DATETIME")
        add_column(cur, 'ordens_servico', 'signatarios_json', "TEXT")
        add_column(cur, 'ordens_servico', 'fiscal_tipo',      "VARCHAR(50) DEFAULT 'Fiscal do Contrato'")

        print("\n-- usuarios --------------------------------------------------------")
        add_column(cur, 'usuarios', 'detentora_id',  "INTEGER REFERENCES detentoras(id)")
        add_column(cur, 'usuarios', 'ultimo_acesso', "DATETIME")

        print("\n-- Tabelas novas (criadas pelo create_all ao subir o app) ----------")
        for t in ['aceites_empresa', 'revisoes_empresa', 'comentarios_empresa', 'assinaturas_internas']:
            status = "[OK] Ja existe" if tabela_existe(cur, t) else "[--] Sera criada ao iniciar o app"
            print(f"  {status}: {t}")

        conn.commit()
        print("\n" + "-" * 68)
        print("MIGRACAO CONCLUIDA COM SUCESSO!")
        print(f"  Backup disponivel em: {os.path.basename(backup)}")
        print("\nProximo passo: instale as dependencias e inicie o servidor:")
        print("  pip install -r requirements.txt")
        print("  python app.py   (ou reinicie via systemd/pm2)")

    except Exception as e:
        conn.rollback()
        print(f"\nERRO durante a migracao: {e}")
        print(f"  Banco revertido. Backup disponivel em: {backup}")
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    main()
