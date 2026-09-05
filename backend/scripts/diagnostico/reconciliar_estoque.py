#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Reconciliacao do estoque apos a correcao do bug de reversao.

O bug corrigido (reverter_baixa_estoque devolvia TODAS as SAIDAs historicas
de uma O.S. a cada edicao) deixou dois tipos de sujeira no banco:

  1. quantidade_gasto (cache) divergente do ledger de movimentacoes
  2. consumo real das O.S. vigentes acima do contratado -- os "itens fantasma"

Este script AUDITA e, opcionalmente, corrige o item 1 realinhando o cache com
o ledger. O item 2 NAO e corrigido automaticamente: reduzir uma O.S. ja emitida
e decisao contratual, nao tecnica -- o script apenas reporta.

USO:
    python scripts/diagnostico/reconciliar_estoque.py            # dry-run
    python scripts/diagnostico/reconciliar_estoque.py --aplicar  # grava

Sem emoji na saida: roda sob cron/console cp1252.
"""
import os
import sys
import argparse
import sqlite3
from collections import defaultdict
from datetime import datetime

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BACKEND_DIR, 'instance', 'controle_itens.db')

STATUS_NAO_VIGENTES = ('cancelada',)


def converter(valor):
    """
    Le quantidade no formato brasileiro armazenado como texto.

    '20.000' -> 20000.0 (ponto = milhar)   '5.500,00' -> 5500.0
    '__', None, '' -> 0.0
    """
    if valor is None:
        return 0.0
    if isinstance(valor, (int, float)):
        return float(valor)
    texto = str(valor).strip().replace(' ', '')
    if not texto or texto in ('__', 'None'):
        return 0.0
    negativo = texto.startswith('-')
    texto = texto.lstrip('-')
    if not texto.replace(',', '').replace('.', ''):
        return 0.0
    try:
        numero = float(texto.replace('.', '').replace(',', '.'))
    except ValueError:
        return 0.0
    return -numero if negativo else numero


def formatar(numero):
    return '{:,.2f}'.format(numero).replace(',', 'X').replace('.', ',').replace('X', '.')


def schema_numerico(conn):
    """True se estoque_regional ja foi migrado para NUMERIC."""
    for _, nome, tipo, _, _, _ in conn.execute("PRAGMA table_info(estoque_regional)"):
        if nome == 'quantidade_inicial':
            return 'NUMERIC' in (tipo or '').upper()
    return False


def linha(titulo):
    print('')
    print('=' * 78)
    print(titulo)
    print('=' * 78)


def auditar(conn):
    cur = conn.cursor()
    relatorio = {}

    # ---------------------------------------------------------------- cache
    linha('1. CACHE quantidade_gasto x LEDGER de movimentacoes')
    cur.execute("""
        SELECT e.id, e.item_id, e.regiao_numero, e.quantidade_inicial, e.quantidade_gasto,
               COALESCE((SELECT SUM(CASE WHEN m.tipo = 'SAIDA' THEN m.quantidade
                                         ELSE -m.quantidade END)
                         FROM movimentacoes_estoque m
                         WHERE m.estoque_regional_id = e.id), 0) AS ledger,
               i.descricao
        FROM estoque_regional e
        LEFT JOIN itens i ON i.id = e.item_id
    """)
    divergentes = []
    for eid, item_id, regiao, inicial, gasto, ledger, descricao in cur.fetchall():
        cache = converter(gasto)
        ledger = float(ledger or 0)
        if abs(cache - ledger) >= 0.01:
            divergentes.append({
                'estoque_id': eid, 'item_id': item_id, 'regiao': regiao,
                'descricao': descricao or '?', 'cache': cache, 'ledger': ledger,
            })

    if divergentes:
        print('%-7s %-7s %-5s %-32s %12s %12s' % ('estoq', 'item', 'reg', 'descricao', 'cache', 'ledger'))
        for d in divergentes:
            print('%-7s %-7s %-5s %-32s %12s %12s' % (
                d['estoque_id'], d['item_id'], d['regiao'], d['descricao'][:32],
                formatar(d['cache']), formatar(d['ledger'])))
        print('')
        print('TOTAL divergente: %d registro(s)' % len(divergentes))
    else:
        print('Nenhuma divergencia entre cache e ledger.')
    relatorio['divergentes'] = divergentes

    # ------------------------------------------------------- estoque estourado
    linha('2. ESTOQUE ESTOURADO (consumo real das O.S. vigentes > contratado)')
    cur.execute("""
        SELECT ios.item_id, os.regiao_estoque, SUM(ios.quantidade_total)
        FROM itens_ordem_servico ios
        JOIN ordens_servico os ON os.id = ios.ordem_servico_id
        WHERE COALESCE(os.status, 'emitida') NOT IN ('cancelada')
        GROUP BY ios.item_id, os.regiao_estoque
    """)
    consumo = {(r[0], r[1]): float(r[2] or 0) for r in cur.fetchall()}

    cur.execute("""
        SELECT e.item_id, e.regiao_numero, e.quantidade_inicial, i.descricao
        FROM estoque_regional e LEFT JOIN itens i ON i.id = e.item_id
    """)
    estourados = []
    for item_id, regiao, inicial, descricao in cur.fetchall():
        usado = consumo.get((item_id, regiao), 0.0)
        contratado = converter(inicial)
        if usado > contratado + 0.01:
            estourados.append({
                'item_id': item_id, 'regiao': regiao, 'descricao': descricao or '?',
                'contratado': contratado, 'consumido': usado,
                'excedente': usado - contratado,
            })

    if estourados:
        print('%-7s %-5s %-30s %12s %12s %12s' % ('item', 'reg', 'descricao', 'contratado', 'consumido', 'EXCEDENTE'))
        for e in sorted(estourados, key=lambda x: -x['excedente']):
            print('%-7s %-5s %-30s %12s %12s %12s' % (
                e['item_id'], e['regiao'], e['descricao'][:30],
                formatar(e['contratado']), formatar(e['consumido']), formatar(e['excedente'])))
            cur.execute("""
                SELECT os.numero_os, os.modulo, COALESCE(os.status, 'emitida'), ios.quantidade_total
                FROM itens_ordem_servico ios
                JOIN ordens_servico os ON os.id = ios.ordem_servico_id
                WHERE ios.item_id = ? AND os.regiao_estoque = ?
                  AND COALESCE(os.status, 'emitida') NOT IN ('cancelada')
                ORDER BY os.numero_os
            """, (e['item_id'], e['regiao']))
            for numero, modulo, status, qtd in cur.fetchall():
                print('           +-- O.S. %s (%s, %s): %s' % (numero, modulo, status, formatar(float(qtd or 0))))
        print('')
        print('ATENCAO: %d item(ns) acima do contratado. Revisar com o gestor.' % len(estourados))
    else:
        print('Nenhum item consumido acima do contratado.')
    relatorio['estourados'] = estourados

    # ------------------------------------------------------- O.S. suspeitas
    linha('3. O.S. COM MULTIPLAS SAIDAS PARA O MESMO ITEM (rastro de edicoes)')
    cur.execute("""
        SELECT ordem_servico_id, item_id, COUNT(*) AS saidas
        FROM movimentacoes_estoque
        WHERE tipo = 'SAIDA'
        GROUP BY ordem_servico_id, item_id
        HAVING COUNT(*) > 1
        ORDER BY saidas DESC
    """)
    suspeitas = cur.fetchall()
    if suspeitas:
        print('%-8s %-8s %s' % ('OS_id', 'item', 'qtd_saidas'))
        for os_id, item_id, n in suspeitas:
            print('%-8s %-8s %s' % (os_id, item_id, n))
    else:
        print('Nenhuma O.S. com SAIDA repetida para o mesmo item.')
    relatorio['suspeitas'] = suspeitas

    # ------------------------------------------- cancelada sem reversao
    linha('4. O.S. CANCELADAS COM CONSUMO NAO REVERTIDO')
    cur.execute("""
        SELECT os.id, os.numero_os, m.estoque_regional_id,
               SUM(CASE WHEN m.tipo = 'SAIDA' THEN m.quantidade ELSE -m.quantidade END) AS liquido
        FROM ordens_servico os
        JOIN movimentacoes_estoque m ON m.ordem_servico_id = os.id
        WHERE COALESCE(os.status, 'emitida') = 'cancelada'
        GROUP BY os.id, m.estoque_regional_id
        HAVING liquido > 0.01
    """)
    presas = cur.fetchall()
    if presas:
        print('%-8s %-14s %-10s %12s' % ('OS_id', 'numero', 'estoque', 'preso'))
        for os_id, numero, est_id, liquido in presas:
            print('%-8s %-14s %-10s %12s' % (os_id, numero, est_id, formatar(float(liquido))))
        print('')
        print('Estes saldos podem ser liberados reprocessando a reversao.')
    else:
        print('Nenhuma O.S. cancelada com saldo preso.')
    relatorio['presas'] = presas

    # ---------------------------------------------------- valores invalidos
    linha('5. REGISTROS COM QUANTIDADE INVALIDA')
    cur.execute("""
        SELECT COUNT(*) FROM estoque_regional
        WHERE quantidade_inicial IN ('__', '', 'None') OR quantidade_inicial IS NULL
           OR quantidade_gasto  IN ('__', '', 'None') OR quantidade_gasto  IS NULL
    """)
    invalidos = cur.fetchone()[0]
    print("Registros com valor invalido ('__', vazio, NULL): %d" % invalidos)
    relatorio['invalidos'] = invalidos

    return relatorio


def aplicar_correcoes(conn, relatorio):
    """Realinha o cache quantidade_gasto com o ledger. Nao toca em O.S."""
    divergentes = relatorio['divergentes']
    if not divergentes:
        print('Nada a corrigir.')
        return 0

    cur = conn.cursor()
    # Apos a migracao as colunas sao NUMERIC: gravar texto formatado em BR
    # reintroduziria string no banco e quebraria a leitura do SQLAlchemy.
    numerico = schema_numerico(conn)
    for d in divergentes:
        valor = max(0.0, d['ledger'])
        cur.execute(
            'UPDATE estoque_regional SET quantidade_gasto = ? WHERE id = ?',
            (valor if numerico else formatar(valor), d['estoque_id'])
        )
    conn.commit()
    print('Corrigido(s) %d registro(s) de cache.' % len(divergentes))
    return len(divergentes)


def main():
    parser = argparse.ArgumentParser(description='Reconciliacao do estoque')
    parser.add_argument('--aplicar', action='store_true',
                        help='grava as correcoes de cache (por padrao e dry-run)')
    parser.add_argument('--db', default=DB_PATH, help='caminho do banco')
    parser.add_argument('--check', action='store_true',
                        help='modo auditoria (cron): sai com codigo != 0 se houver '
                             'sinal que deveria ser sempre zero (drift de cache, '
                             'SAIDA repetida, canceladas presas, invalidos)')
    args = parser.parse_args()

    if not os.path.exists(args.db):
        print('[ERRO] Banco nao encontrado: %s' % args.db)
        return 1

    print('RECONCILIACAO DE ESTOQUE')
    print('Banco : %s' % args.db)
    print('Modo  : %s' % ('APLICAR (grava)' if args.aplicar else 'DRY-RUN (nao grava)'))
    print('Data  : %s' % datetime.now().strftime('%d/%m/%Y %H:%M:%S'))

    # Leitura em modo read-only no dry-run: impossivel alterar por engano.
    if args.aplicar:
        conn = sqlite3.connect(args.db)
    else:
        conn = sqlite3.connect('file:%s?mode=ro' % args.db, uri=True)

    try:
        relatorio = auditar(conn)

        linha('RESUMO')
        print('Cache divergente do ledger .......... %d' % len(relatorio['divergentes']))
        print('Itens acima do contratado ........... %d' % len(relatorio['estourados']))
        print('O.S. com SAIDA repetida ............. %d' % len(relatorio['suspeitas']))
        print('O.S. canceladas com saldo preso ..... %d' % len(relatorio['presas']))
        print('Registros com quantidade invalida ... %d' % relatorio['invalidos'])

        if args.aplicar:
            linha('APLICANDO CORRECOES DE CACHE')
            aplicar_correcoes(conn, relatorio)
        elif relatorio['divergentes']:
            print('')
            print('Rode com --aplicar para realinhar o cache com o ledger.')
            print('FACA BACKUP ANTES.')

        if relatorio['estourados']:
            print('')
            print('AVISO: itens acima do contratado NAO sao corrigidos por este')
            print('script. Reduzir uma O.S. ja emitida e decisao do gestor.')

        if args.check:
            # Sinais que, num sistema saudavel, DEVEM ser sempre zero. Os
            # 'estourados' (itens acima do contratado) ficam de fora: sao
            # decisao de negocio ja conhecida, nao regressao tecnica.
            criticos = (
                len(relatorio['divergentes'])
                + len(relatorio['suspeitas'])
                + len(relatorio['presas'])
                + relatorio['invalidos']
            )
            if criticos > 0:
                print('')
                print('[ALERTA] %d sinal(is) critico(s) de integridade do estoque. '
                      'Investigar.' % criticos)
                return 2
            print('')
            print('[OK] Nenhum sinal critico de integridade.')
    finally:
        conn.close()

    return 0


if __name__ == '__main__':
    sys.exit(main())
