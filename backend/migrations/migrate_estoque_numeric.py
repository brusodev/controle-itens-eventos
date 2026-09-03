#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Migra as quantidades de estoque de TEXT para NUMERIC.

estoque_regional.quantidade_inicial / quantidade_gasto / preco eram String(20)
no formato brasileiro. Guardar numero como texto exigia um parser em cada
leitura, e esse parser confundia separador de milhar com decimal ('10.5' virava
105) e transformava erro em 0.0 silencioso.

Tambem:
  - normaliza os valores invalidos ('__', vazio, NULL) para 0
  - adiciona CHECK constraints (>= 0) impossibilitando estado negativo
  - torna movimentacoes_estoque.ordem_servico_id NULL-avel, para ajustes
    manuais de estoque que nao nascem de uma O.S.

SQLite nao tem ALTER COLUMN, entao a migracao recria as tabelas preservando
os dados (padrao 12-passos do SQLite).

USO:
    python migrations/migrate_estoque_numeric.py            # dry-run
    python migrations/migrate_estoque_numeric.py --aplicar  # grava

FACA BACKUP ANTES:
    python scripts/utilitarios/backup_automatico.py
"""
import os
import sys
import argparse
import sqlite3
from datetime import datetime

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BACKEND_DIR, 'instance', 'controle_itens.db')


def converter(valor):
    """
    Le o formato BR gravado como texto, desambiguando milhar de decimal.

    '20.000' -> 20000.0    '1.250,50' -> 1250.5
    '10.5'   -> 10.5       '__'/''/None -> 0.0
    """
    if valor is None:
        return 0.0
    if isinstance(valor, (int, float)):
        return float(valor)

    texto = str(valor).strip().replace(' ', '')
    if not texto or texto in ('__', 'None'):
        return 0.0

    negativo = texto.startswith('-')
    texto = texto.lstrip('+-')
    if not texto.replace(',', '').replace('.', '').isdigit():
        return 0.0

    if ',' in texto:
        texto = texto.replace('.', '').replace(',', '.')
    elif texto.count('.') > 1:
        texto = texto.replace('.', '')
    elif '.' in texto:
        inteiro, _, decimal = texto.partition('.')
        if len(decimal) == 3 and inteiro:
            texto = inteiro + decimal

    try:
        numero = float(texto)
    except ValueError:
        return 0.0
    return -numero if negativo else numero


def ja_migrado(conn):
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(estoque_regional)")
    for _, nome, tipo, _, _, _ in cur.fetchall():
        if nome == 'quantidade_inicial':
            return 'NUMERIC' in (tipo or '').upper()
    return False


def previsualizar(conn):
    cur = conn.cursor()
    cur.execute("""
        SELECT id, item_id, regiao_numero, quantidade_inicial, quantidade_gasto, preco
        FROM estoque_regional
    """)
    linhas = cur.fetchall()

    invalidos = []
    amostra = []
    for eid, item_id, regiao, inicial, gasto, preco in linhas:
        conv = (converter(inicial), converter(gasto), converter(preco))
        if str(inicial).strip() in ('__', '', 'None') or inicial is None:
            invalidos.append(eid)
        if len(amostra) < 12:
            amostra.append((eid, item_id, regiao, inicial, gasto, preco, conv))

    print('Registros em estoque_regional ....... %d' % len(linhas))
    print("Com valor invalido ('__'/vazio) ..... %d  (viram 0)" % len(invalidos))
    print('')
    print('Amostra da conversao:')
    print('%-6s %-6s %-4s %-12s %-12s %-10s %s' % (
        'id', 'item', 'reg', 'inicial', 'gasto', 'preco', '-> convertido'))
    for eid, item_id, regiao, inicial, gasto, preco, conv in amostra:
        print('%-6s %-6s %-4s %-12r %-12r %-10r -> %s' % (
            eid, item_id, regiao, inicial, gasto, preco, conv))

    return len(linhas)


def migrar(conn):
    cur = conn.cursor()

    print('Convertendo valores...')
    cur.execute("""
        SELECT id, quantidade_inicial, quantidade_gasto, preco FROM estoque_regional
    """)
    convertidos = [
        (converter(ini), converter(gasto), converter(preco), eid)
        for eid, ini, gasto, preco in cur.fetchall()
    ]

    # SQLite nao tem ALTER COLUMN: recria a tabela (padrao 12-passos).
    print('Recriando estoque_regional com NUMERIC + CHECK constraints...')
    cur.execute('PRAGMA foreign_keys=OFF')
    cur.execute('DROP TABLE IF EXISTS estoque_regional_novo')
    cur.execute("""
        CREATE TABLE estoque_regional_novo (
            id INTEGER NOT NULL PRIMARY KEY,
            item_id INTEGER NOT NULL,
            regiao_numero INTEGER NOT NULL,
            quantidade_inicial NUMERIC(14, 3) NOT NULL DEFAULT 0,
            quantidade_gasto NUMERIC(14, 3) NOT NULL DEFAULT 0,
            preco NUMERIC(14, 2) NOT NULL DEFAULT 0,
            CONSTRAINT _item_regiao_uc UNIQUE (item_id, regiao_numero),
            CONSTRAINT _qtd_inicial_nao_negativa CHECK (quantidade_inicial >= 0),
            CONSTRAINT _qtd_gasto_nao_negativo CHECK (quantidade_gasto >= 0),
            CONSTRAINT _preco_nao_negativo CHECK (preco >= 0),
            FOREIGN KEY(item_id) REFERENCES itens (id)
        )
    """)
    cur.execute("""
        INSERT INTO estoque_regional_novo (id, item_id, regiao_numero,
                                           quantidade_inicial, quantidade_gasto, preco)
        SELECT id, item_id, regiao_numero, 0, 0, 0 FROM estoque_regional
    """)
    cur.executemany(
        'UPDATE estoque_regional_novo '
        'SET quantidade_inicial = ?, quantidade_gasto = ?, preco = ? '
        'WHERE id = ?',
        convertidos)

    cur.execute('DROP TABLE estoque_regional')
    cur.execute('ALTER TABLE estoque_regional_novo RENAME TO estoque_regional')

    # movimentacoes_estoque.ordem_servico_id passa a aceitar NULL
    print('Ajustando movimentacoes_estoque.ordem_servico_id para NULL-avel...')
    cur.execute('DROP TABLE IF EXISTS movimentacoes_estoque_novo')
    cur.execute("""
        CREATE TABLE movimentacoes_estoque_novo (
            id INTEGER NOT NULL PRIMARY KEY,
            ordem_servico_id INTEGER,
            item_id INTEGER NOT NULL,
            estoque_regional_id INTEGER NOT NULL,
            quantidade FLOAT NOT NULL,
            tipo VARCHAR(20) NOT NULL,
            data_movimentacao DATETIME,
            observacao TEXT,
            FOREIGN KEY(ordem_servico_id) REFERENCES ordens_servico (id) ON DELETE CASCADE,
            FOREIGN KEY(item_id) REFERENCES itens (id),
            FOREIGN KEY(estoque_regional_id) REFERENCES estoque_regional (id)
        )
    """)
    cur.execute("""
        INSERT INTO movimentacoes_estoque_novo
        SELECT id, ordem_servico_id, item_id, estoque_regional_id,
               quantidade, tipo, data_movimentacao, observacao
        FROM movimentacoes_estoque
    """)
    cur.execute('DROP TABLE movimentacoes_estoque')
    cur.execute('ALTER TABLE movimentacoes_estoque_novo RENAME TO movimentacoes_estoque')

    cur.execute('PRAGMA foreign_keys=ON')
    conn.commit()

    integridade = cur.execute('PRAGMA integrity_check').fetchone()[0]
    print('PRAGMA integrity_check: %s' % integridade)
    if integridade != 'ok':
        raise RuntimeError('integrity_check falhou apos a migracao: %s' % integridade)

    cur.execute('SELECT COUNT(*) FROM estoque_regional')
    print('estoque_regional ....... %d linhas' % cur.fetchone()[0])
    cur.execute('SELECT COUNT(*) FROM movimentacoes_estoque')
    print('movimentacoes_estoque .. %d linhas' % cur.fetchone()[0])


def main():
    parser = argparse.ArgumentParser(description='Migra estoque para NUMERIC')
    parser.add_argument('--aplicar', action='store_true', help='grava (padrao: dry-run)')
    parser.add_argument('--db', default=DB_PATH)
    args = parser.parse_args()

    if not os.path.exists(args.db):
        print('[ERRO] Banco nao encontrado: %s' % args.db)
        return 1

    print('MIGRACAO: estoque_regional TEXT -> NUMERIC')
    print('Banco : %s' % args.db)
    print('Modo  : %s' % ('APLICAR (grava)' if args.aplicar else 'DRY-RUN (nao grava)'))
    print('Data  : %s' % datetime.now().strftime('%d/%m/%Y %H:%M:%S'))
    print('-' * 78)

    conn = sqlite3.connect(args.db)
    try:
        if ja_migrado(conn):
            print('Banco JA migrado (colunas sao NUMERIC). Nada a fazer.')
            return 0

        total = previsualizar(conn)
        print('-' * 78)

        if not args.aplicar:
            print('DRY-RUN: nada foi gravado.')
            print('Rode com --aplicar para migrar. FACA BACKUP ANTES:')
            print('    python scripts/utilitarios/backup_automatico.py')
            return 0

        if total == 0:
            print('Tabela vazia; aplicando apenas a mudanca de schema.')

        migrar(conn)
        print('-' * 78)
        print('[OK] Migracao concluida.')
    except Exception as exc:
        conn.rollback()
        print('[ERRO] Migracao abortada: %s' % exc)
        print('O banco NAO foi alterado. Restaure o backup se necessario.')
        return 1
    finally:
        conn.close()

    return 0


if __name__ == '__main__':
    sys.exit(main())
