"""Troca a referencia dos itens de Servicos Graficos de CATSER para codigo BEC.

Fonte: planilha "Planet 2026 1.xlsx", aba "Resumo Contrato Reajustado 2026",
coluna "Item". Os codigos sao gravados SEM hifen (22899-0 -> 228990) em
itens.natureza, a mesma coluna que ate agora guardava o CATSER.

Os 15 itens que nao constam da planilha do contrato reajustado ficam com o
campo vazio (NULL) ate que os codigos BEC sejam fornecidos.

Nao ha mudanca de schema: e uma migracao de dados, idempotente, segura para
rodar mais de uma vez e nos dois ambientes (local e VPS).

Uso:
    python migrate_bec_servicos_graficos.py            # apenas mostra o diff
    python migrate_bec_servicos_graficos.py --aplicar  # grava no banco
"""
import os
import sqlite3
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(BASE, 'instance', 'controle_itens.db')
MODULO = 'servicos_graficos'

# item_codigo -> codigo BEC (sem hifen), conforme o contrato reajustado 2026
BEC = {
    'SG001': '228990', 'SG002': '229008', 'SG003': '229016', 'SG004': '230391',
    'SG005': '230405', 'SG006': '229350', 'SG007': '229504', 'SG008': '229733',
    'SG009': '229741', 'SG010': '229750', 'SG011': '229822', 'SG012': '229890',
    'SG013': '229903', 'SG014': '229911', 'SG015': '229920', 'SG016': '230073',
    'SG017': '230162', 'SG018': '230170', 'SG019': '230189', 'SG020': '230197',
    'SG021': '230200', 'SG022': '230260', 'SG023': '230278', 'SG024': '230286',
    'SG025': '230294', 'SG026': '230308', 'SG027': '230316', 'SG028': '230324',
    'SG029': '230332', 'SG030': '230340', 'SG031': '230413', 'SG032': '230421',
    'SG033': '230430', 'SG034': '230367', 'SG035': '230375', 'SG036': '230456',
    'SG037': '230464', 'SG038': '230472',
}

# Itens sem correspondencia na planilha: o codigo fica vazio ate ser informado.
SEM_BEC = [
    'SG039', 'SG040', 'SG041', 'SG042', 'SG043', 'SG044', 'SG045', 'SG046',
    'SG047', 'SG048', 'SG049', 'SG050', 'SG051', 'SG052', 'SG053',
]


def main(aplicar):
    if not os.path.exists(DB):
        print(f'ERRO: banco nao encontrado em {DB}')
        return 1

    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    rows = con.execute(
        """
        SELECT i.id, i.item_codigo AS cod, i.descricao, i.natureza AS atual
        FROM itens i
        JOIN categorias c ON c.id = i.categoria_id
        WHERE c.modulo = ?
        ORDER BY i.item_codigo
        """,
        (MODULO,),
    ).fetchall()

    if not rows:
        print(f'ERRO: nenhum item encontrado para o modulo {MODULO}.')
        con.close()
        return 1

    codigos_db = {r['cod'] for r in rows}
    faltando = sorted((set(BEC) | set(SEM_BEC)) - codigos_db)
    if faltando:
        print(f'AVISO: codigos no mapa sem item no banco: {faltando}')
    nao_mapeados = sorted(codigos_db - set(BEC) - set(SEM_BEC))
    if nao_mapeados:
        print(f'AVISO: itens no banco fora do mapa (nao serao tocados): {nao_mapeados}')

    mudancas = []
    for r in rows:
        if r['cod'] in BEC:
            novo = BEC[r['cod']]
        elif r['cod'] in SEM_BEC:
            novo = None
        else:
            continue
        atual = (r['atual'] or '').strip() or None
        if atual != novo:
            mudancas.append((r['id'], r['cod'], r['descricao'], atual, novo))

    com_bec = sum(1 for m in mudancas if m[4] is not None)
    limpos = len(mudancas) - com_bec

    print(f'\n{len(mudancas)} itens serao alterados '
          f'({com_bec} recebem BEC, {limpos} ficam vazios; '
          f'{len(rows)} itens no modulo):\n')
    print(f'{"Cod":>6}  {"Descricao":<52}  {"Atual":>8}  ->  {"Novo":>8}')
    print('-' * 88)
    for _, cod, desc, atual, novo in mudancas:
        print(f'{cod:>6}  {desc[:52]:<52}  {(atual or "-"):>8}  ->  {(novo or "(vazio)"):>8}')

    if not mudancas:
        print('Nada a fazer: o banco ja esta atualizado.')

    if not aplicar:
        print('\n[PREVIEW] Nada gravado. Rode com --aplicar para gravar.')
        con.close()
        return 0

    for item_id, _, _, _, novo in mudancas:
        con.execute('UPDATE itens SET natureza = ? WHERE id = ?', (novo, item_id))
    con.commit()
    con.close()
    print(f'\n[OK] {com_bec} itens com codigo BEC, {limpos} itens limpos.')
    return 0


if __name__ == '__main__':
    sys.exit(main('--aplicar' in sys.argv))
