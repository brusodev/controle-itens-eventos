# -*- coding: utf-8 -*-
"""
Valida, contra uma COPIA do banco e pela API HTTP, o cenario de estoque
relatado pelos usuarios: editar uma O.S. varias vezes creditava saldo
fantasma e permitia aumentar itens com o estoque zerado.

Complementa tests/test_estoque_os.py, que roda em banco em memoria: aqui o
teste roda sobre dados reais, exercitando as rotas de verdade.

USO (NUNCA aponte para o banco de producao -- o script ESCREVE):
    python -c "import sqlite3; s=sqlite3.connect('file:instance/controle_itens.db?mode=ro',uri=True); d=sqlite3.connect('/tmp/copia.db'); d.__enter__(); s.backup(d); d.close(); s.close()"
    python scripts/diagnostico/validar_cenario_estoque.py /tmp/copia.db

Saida esperada: "8 passaram, 0 falharam".
"""
import sys, os

_B = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, _B)
sys.path.insert(0, os.path.join(_B, 'utils'))

if len(sys.argv) < 2:
    print('Uso: validar_cenario_estoque.py <caminho-de-uma-COPIA-do-banco>')
    print('ATENCAO: o script escreve no banco. Nunca aponte para producao.')
    sys.exit(1)

DB = os.path.abspath(sys.argv[1])

from flask import Flask
from models import db, Usuario, Item, EstoqueRegional, OrdemServico, MovimentacaoEstoque
from controle_estoque import obter_estoque_disponivel, calcular_gasto_ledger

# App montado a mao apontando para a COPIA (create_app fixa o caminho do banco).
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + DB
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'teste'
app.config['PORTAL_DETENTORA_ATIVO'] = False
db.init_app(app)

from routes.auth_routes import auth_bp
from routes.os_routes import os_bp
from routes.alimentacao_routes import alimentacao_bp
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(os_bp, url_prefix='/api/ordens-servico')
app.register_blueprint(alimentacao_bp, url_prefix='/api/alimentacao')

ITEM_ID = None
ESTOQUE_ID = None
OK = []
FALHA = []


def check(desc, condicao, detalhe=''):
    (OK if condicao else FALHA).append(desc)
    print('  [%s] %s %s' % ('OK ' if condicao else 'FALHA', desc, detalhe))


def payload(item_id, categoria, qtd, evento):
    return {
        'contrato': '001/2025', 'detentora': 'Teste', 'cnpj': '00.000.000/0001-00',
        'servico': 'COFFEE BREAK', 'modulo': 'coffee', 'grupo': '1',
        'evento': evento, 'data': '2026-10-01',
        'itens': [{
            'itemId': item_id, 'categoria': categoria,
            'descricao': 'Item teste', 'unidade': 'Unidade', 'diarias': 1,
            'qtdSolicitada': qtd, 'qtdTotal': qtd, 'valorUnit': '10,00',
        }],
    }


with app.app_context():
    print('Banco em uso:', db.engine.url)
    u = Usuario.query.filter_by(perfil='admin').first()

    # Item dedicado ao teste, com estoque conhecido de 100
    it = Item.query.join(Item.categoria).filter_by(modulo='coffee').first()
    ITEM_ID = it.id
    cat_nome = it.categoria.nome
    est = EstoqueRegional.query.filter_by(item_id=ITEM_ID, regiao_numero=1).first()
    ESTOQUE_ID = est.id

    # Zera o historico deste estoque e fixa 100 para um cenario limpo
    MovimentacaoEstoque.query.filter_by(estoque_regional_id=ESTOQUE_ID).delete()
    est.quantidade_inicial = 100
    est.quantidade_gasto = 0
    db.session.commit()
    print('Item de teste: id=%s "%s" | estoque=%s | inicial=100\n' % (
        ITEM_ID, it.descricao[:40], ESTOQUE_ID))

    c = app.test_client()
    with c.session_transaction() as s:
        s['usuario_id'] = u.id
        s['usuario_perfil'] = 'admin'
        s['usuario_nome'] = u.nome
        s['usuario_email'] = u.email
        s['detentora_id'] = None
        s['csrf_token'] = 'tok'
    H = {'X-CSRF-Token': 'tok'}

    def disp():
        _, d = obter_estoque_disponivel(ITEM_ID, 1)
        return d

    print('=' * 74)
    print('CENARIO RELATADO: duas O.S. zeram o estoque, edicoes repetidas na 1a')
    print('=' * 74)

    r1 = c.post('/api/ordens-servico/', json=payload(ITEM_ID, cat_nome, 60, 'Evento A'), headers=H)
    os1 = r1.get_json().get('id')
    print('O.S. #1 criada com 60  -> disponivel = %s' % disp())

    r2 = c.post('/api/ordens-servico/', json=payload(ITEM_ID, cat_nome, 40, 'Evento B'), headers=H)
    print('O.S. #2 criada com 40  -> disponivel = %s' % disp())
    check('estoque zerado apos as duas O.S.', disp() == 0, '(disponivel=%s)' % disp())

    print('\n-- usuario edita a O.S. #1 cinco vezes, mantendo 60 --')
    for i in range(1, 6):
        rr = c.put('/api/ordens-servico/%s' % os1,
                   json=payload(ITEM_ID, cat_nome, 60, 'Evento A'), headers=H)
        print('   edicao %d -> HTTP %s | disponivel = %s' % (i, rr.status_code, disp()))
    check('saldo continua zerado apos 5 edicoes', disp() == 0, '(disponivel=%s)' % disp())

    print('\n-- AGORA A TENTATIVA QUE OS USUARIOS CONSEGUIAM: aumentar 60 -> 100 --')
    r = c.put('/api/ordens-servico/%s' % os1,
              json=payload(ITEM_ID, cat_nome, 100, 'Evento A'), headers=H)
    print('   HTTP %s' % r.status_code)
    if r.status_code != 200:
        print('   resposta: %s' % str(r.get_json().get('erro'))[:150])
    check('aumento com estoque zerado RECUSADO', r.status_code == 400,
          '(esperado 400, veio %s)' % r.status_code)

    total = sum(i.quantidade_total for o in OrdemServico.query.filter(
        OrdemServico.id.in_([os1, r2.get_json().get('id')])).all() for i in o.itens)
    check('total alocado nao excede o contratado', total <= 100,
          '(alocado=%s de 100)' % total)

    print('\n' + '=' * 74)
    print('OUTRAS VERIFICACOES')
    print('=' * 74)

    # reducao devolve
    c.put('/api/ordens-servico/%s' % os1, json=payload(ITEM_ID, cat_nome, 10, 'Evento A'), headers=H)
    check('reduzir 60 -> 10 devolve 50 ao estoque', disp() == 50, '(disponivel=%s)' % disp())

    # aumento dentro do saldo passa
    rr = c.put('/api/ordens-servico/%s' % os1, json=payload(ITEM_ID, cat_nome, 55, 'Evento A'), headers=H)
    check('aumentar dentro do saldo e ACEITO', rr.status_code == 200, '(HTTP %s)' % rr.status_code)

    # cancelamento devolve
    o1 = db.session.get(OrdemServico, os1)
    o1.status = 'aceita'
    db.session.commit()
    antes = disp()
    rc = c.post('/api/ordens-servico/%s/cancelar' % os1, json={'motivo': 'teste'}, headers=H)
    check('cancelar O.S. devolve o saldo', rc.status_code == 200 and disp() == antes + 55,
          '(antes=%s depois=%s)' % (antes, disp()))

    # invariante cache == ledger
    est = db.session.get(EstoqueRegional, ESTOQUE_ID)
    cache = float(est.quantidade_gasto or 0)
    ledger = calcular_gasto_ledger(ESTOQUE_ID)
    check('cache quantidade_gasto == ledger', abs(cache - ledger) < 0.01,
          '(cache=%s ledger=%s)' % (cache, ledger))

    print('\n' + '=' * 74)
    print('RESULTADO: %d passaram, %d falharam' % (len(OK), len(FALHA)))
    if FALHA:
        for f in FALHA:
            print('   FALHOU: %s' % f)
    else:
        print('   O bug relatado NAO se reproduz mais.')
    print('=' * 74)
