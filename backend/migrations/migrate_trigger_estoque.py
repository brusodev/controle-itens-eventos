#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Trava de integridade no NIVEL DO BANCO para o estoque.

O bug do saldo fantasma so foi possivel porque a unica defesa era o codigo de
aplicacao: qualquer caminho que inserisse em movimentacoes_estoque sem passar
por controle_estoque.py (import, seed, SQL manual, endpoint novo) podia estourar
o contratado sem alarme.

Este trigger torna o invariante impossivel de violar:

    para cada estoque_regional,
    SUM(SAIDA) - SUM(ENTRADA)  <=  quantidade_inicial

Ele dispara BEFORE INSERT de uma SAIDA e ABORTA a transacao se o consumo
liquido resultante ultrapassar o contratado. ENTRADA (devolucao) nunca e
barrada -- so reduz o consumo.

Epsilon de 0.001 evita falso positivo por arredondamento de ponto flutuante.

IDEMPOTENTE: recria o trigger (DROP IF EXISTS).

USO:
    python migrations/migrate_trigger_estoque.py            # dry-run (mostra o SQL)
    python migrations/migrate_trigger_estoque.py --aplicar  # grava
    python migrations/migrate_trigger_estoque.py --testar   # testa a trava (rollback)

FACA BACKUP ANTES de --aplicar.
"""
import os
import sys
import argparse
import sqlite3
from datetime import datetime

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BACKEND_DIR, 'instance', 'controle_itens.db')

TRIGGER_NOME = 'trg_saida_nao_excede_contratado'

TRIGGER_SQL = """
CREATE TRIGGER {nome}
BEFORE INSERT ON movimentacoes_estoque
FOR EACH ROW
WHEN NEW.tipo = 'SAIDA'
BEGIN
    SELECT
        CASE WHEN (
            COALESCE((
                SELECT SUM(CASE WHEN m.tipo = 'SAIDA' THEN m.quantidade
                                ELSE -m.quantidade END)
                FROM movimentacoes_estoque m
                WHERE m.estoque_regional_id = NEW.estoque_regional_id
            ), 0) + NEW.quantidade
        ) > (
            COALESCE((
                SELECT e.quantidade_inicial
                FROM estoque_regional e
                WHERE e.id = NEW.estoque_regional_id
            ), 0) + 0.001
        )
        THEN RAISE(ABORT, 'Estoque insuficiente: a SAIDA excederia o contratado do estoque_regional')
    END;
END;
""".format(nome=TRIGGER_NOME)


def existe_trigger(conn):
    return conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='trigger' AND name=?",
        (TRIGGER_NOME,)
    ).fetchone() is not None


def aplicar(conn):
    conn.execute('DROP TRIGGER IF EXISTS %s' % TRIGGER_NOME)
    conn.executescript(TRIGGER_SQL)
    conn.commit()


def testar(conn):
    """
    Verifica que o trigger barra o excesso e libera o valido. Nada e persistido:
    tudo roda dentro de uma transacao revertida ao final.
    """
    cur = conn.cursor()
    # Escolhe um estoque com folga (consumo < inicial)
    row = cur.execute("""
        SELECT e.id, e.quantidade_inicial,
               COALESCE((SELECT SUM(CASE WHEN m.tipo='SAIDA' THEN m.quantidade
                                         ELSE -m.quantidade END)
                         FROM movimentacoes_estoque m
                         WHERE m.estoque_regional_id = e.id), 0) AS net,
               e.item_id
        FROM estoque_regional e
        WHERE e.quantidade_inicial > 0
        ORDER BY (e.quantidade_inicial - COALESCE((SELECT SUM(CASE WHEN m.tipo='SAIDA'
                    THEN m.quantidade ELSE -m.quantidade END)
                    FROM movimentacoes_estoque m WHERE m.estoque_regional_id = e.id),0)) DESC
        LIMIT 1
    """).fetchone()
    if not row:
        print('[TESTE] Sem estoque para testar.')
        return
    eid, inicial, net, item_id = row
    folga = float(inicial) - float(net)
    print('[TESTE] estoque_regional %d: inicial=%s consumo=%s folga=%s'
          % (eid, inicial, net, folga))

    conn.execute('BEGIN')
    # 1) SAIDA valida (dentro da folga): deve passar
    try:
        conn.execute("""INSERT INTO movimentacoes_estoque
            (ordem_servico_id,item_id,estoque_regional_id,quantidade,tipo,observacao)
            VALUES (NULL,?,?,?, 'SAIDA','__teste_trigger_valido__')""",
            (item_id, eid, max(0.0, folga - 1) if folga > 1 else folga / 2))
        print('[TESTE] SAIDA dentro da folga ....... PASSOU (correto)')
    except sqlite3.Error as e:
        print('[TESTE] SAIDA dentro da folga ....... FALHOU INESPERADO:', e)

    # 2) SAIDA que estoura: deve ser abortada
    try:
        conn.execute("""INSERT INTO movimentacoes_estoque
            (ordem_servico_id,item_id,estoque_regional_id,quantidade,tipo,observacao)
            VALUES (NULL,?,?,?, 'SAIDA','__teste_trigger_excesso__')""",
            (item_id, eid, float(inicial) + 1000))
        print('[TESTE] SAIDA acima do contratado ... NAO barrou (ERRO!)')
    except sqlite3.Error as e:
        print('[TESTE] SAIDA acima do contratado ... BARRADA (correto):', str(e).split('\n')[0])

    conn.rollback()
    print('[TESTE] Transacao de teste revertida (nada gravado).')


def main():
    p = argparse.ArgumentParser(description='Trigger de integridade do estoque')
    p.add_argument('--aplicar', action='store_true')
    p.add_argument('--testar', action='store_true')
    p.add_argument('--db', default=DB_PATH)
    args = p.parse_args()

    if not os.path.exists(args.db):
        print('[ERRO] Banco nao encontrado:', args.db)
        return 1

    print('TRIGGER DE INTEGRIDADE DO ESTOQUE')
    print('Banco :', args.db)
    print('Data  :', datetime.now().strftime('%d/%m/%Y %H:%M:%S'))
    print('-' * 78)

    conn = sqlite3.connect(args.db)
    try:
        if args.aplicar:
            aplicar(conn)
            print('[OK] Trigger %s criado.' % TRIGGER_NOME)
            if args.testar:
                print('-' * 78)
                testar(conn)
        elif args.testar:
            if not existe_trigger(conn):
                print('[AVISO] Trigger ainda nao aplicado; testando assim mesmo nao faz sentido.')
                return 1
            testar(conn)
        else:
            print('DRY-RUN. Trigger existente:', existe_trigger(conn))
            print('SQL que seria aplicado:')
            print(TRIGGER_SQL)
            print('Rode com --aplicar para gravar (e --testar para validar).')
    finally:
        conn.close()
    return 0


if __name__ == '__main__':
    sys.exit(main())
