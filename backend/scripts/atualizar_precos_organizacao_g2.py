"""Atualiza preços do módulo Organização, Grupo 2 (Interior / região 2).

Mapeamento por CÓDIGO do item (itens.item_codigo) para evitar erro de
casamento por nome. Preços fornecidos pelo usuário como fonte de verdade.
Itens não presentes no mapa (Alambrado, Mesa Plástica Quadrada, Placa de
Homenagem, Serviço de Audiodescrição, Mestre de Cerimônias, Notebook,
Wireless) são deixados como estão.

Uso:
    python atualizar_precos_organizacao_g2.py           # apenas mostra o diff
    python atualizar_precos_organizacao_g2.py --aplicar  # grava no banco
"""
import os
import sqlite3
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(BASE, 'instance', 'controle_itens.db')
REGIAO = 2

# item_codigo -> preço correto (float)
PRECOS = {
    # --- Montagem e Decoração ---
    '2': 1166.09, '3': 68.72, '4': 264.87, '5': 47.56, '6': 211.73,
    '7': 185.33, '8': 52.80, '9': 44.85, '10': 44.85, '11': 53.62,
    '12': 8.29, '13': 7.28, '14': 34.19, '15': 185.33, '16': 63.48,
    '17': 42.31, '18': 105.44, '19': 128.45, '20': 42.32, '21': 42.32,
    '22': 42.32, '23': 121.70, '24': 1059.96, '25': 1324.99, '26': 50.10,
    '27': 41.80, '28': 79.38, '29': 31.66, '30': 47.57, '31': 41.13,
    '34': 55.60, '35': 26.41, '36': 148.26, '37': 55.60, '38': 2.03,
    '39': 264.86, '41': 172.01, '42': 23.52, '43': 500.00, '44': 15.75,
    '45': 15.99, '46': 68.72, '47': 79.38,
    # --- Recursos Humanos ---
    '48': 169.42, '49': 158.75, '50': 169.41, '51': 185.33, '52': 185.33,
    '53': 264.87, '54': 211.73, '56': 397.39, '57': 201.23, '58': 201.23,
    # --- Equipamento de Informática / AV ---
    '59': 52.97, '60': 105.77, '61': 113.22, '62': 132.36, '63': 154.35,
    '64': 132.36, '65': 1059.96, '66': 529.90, '67': 529.90, '68': 132.36,
    '69': 264.87, '70': 158.76, '71': 128.62, '72': 158.75, '73': 152.66,
    '74': 158.75, '75': 39.43, '76': 39.44, '77': 39.43, '78': 132.35,
    '79': 180.08, '80': 132.36, '81': 102.91, '82': 104.94, '83': 103.42,
    '85': 18.45, '86': 185.32, '87': 20.98, '88': 20.99, '89': 15.74,
    '90': 41.13, '91': 18.45, '92': 519.40, '93': 497.40, '94': 20.99,
    '95': 476.76, '96': 476.76, '97': 158.76, '98': 600.00, '99': 1059.96,
    '100': 132.36, '101': 105.78, '102': 132.35, '103': 158.76, '104': 105.78,
    '105': 263.34, '106': 317.84, '107': 36.90, '108': 95.28, '109': 52.81,
    # --- Material Gráfico / Expediente ---
    '111': 4.57, '112': 30.63, '113': 9.81, '114': 111.53, '115': 1.52,
    '116': 25.73, '117': 4.57, '118': 15.23, '119': 3.89,
}


def fmt_ptbr(valor):
    """Formata float no padrão pt-BR usado no banco: 1.059,96 / 8,29."""
    s = f'{valor:,.2f}'  # 1,059.96
    return s.replace(',', 'X').replace('.', ',').replace('X', '.')


def main(aplicar):
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    rows = con.execute(
        """
        SELECT i.id, i.item_codigo AS cod, i.descricao, e.id AS estoque_id,
               e.preco AS preco_atual
        FROM itens i
        JOIN categorias c ON c.id = i.categoria_id
        JOIN estoque_regional e ON e.item_id = i.id AND e.regiao_numero = ?
        WHERE c.modulo = 'organizacao'
        ORDER BY CAST(i.item_codigo AS INTEGER)
        """,
        (REGIAO,),
    ).fetchall()

    codigos_db = {r['cod'] for r in rows}
    faltando = sorted(set(PRECOS) - codigos_db, key=lambda x: int(x))
    if faltando:
        print(f'AVISO: códigos no mapa sem item no banco: {faltando}')

    mudancas = []
    for r in rows:
        if r['cod'] not in PRECOS:
            continue
        novo = fmt_ptbr(PRECOS[r['cod']])
        atual = (r['preco_atual'] or '0').strip()
        if atual != novo:
            mudancas.append((r['estoque_id'], r['cod'], r['descricao'], atual, novo))

    print(f'\n{len(mudancas)} preços serão alterados '
          f'(de {len(PRECOS)} mapeados, {len(rows)} itens na região {REGIAO}):\n')
    print(f'{"Cód":>4}  {"Descrição":<52}  {"Atual":>10}  ->  {"Novo":>10}')
    print('-' * 90)
    for _, cod, desc, atual, novo in mudancas:
        print(f'{cod:>4}  {desc[:52]:<52}  {atual:>10}  ->  {novo:>10}')

    if not aplicar:
        print('\n[PREVIEW] Nada gravado. Rode com --aplicar para gravar.')
        con.close()
        return

    for estoque_id, _, _, _, novo in mudancas:
        con.execute('UPDATE estoque_regional SET preco = ? WHERE id = ?',
                    (novo, estoque_id))
    con.commit()
    con.close()
    print(f'\n[OK] {len(mudancas)} preços atualizados na região {REGIAO}.')


if __name__ == '__main__':
    main('--aplicar' in sys.argv)
