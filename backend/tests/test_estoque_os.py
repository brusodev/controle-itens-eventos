"""
Testes do controle de estoque das O.S.

Cobre o bug relatado em producao: editar uma O.S. varias vezes creditava
saldo fantasma, permitindo emitir acima do contratado.

Invariante central verificada em todos os cenarios:
    quantidade_gasto (cache) == soma(SAIDA) - soma(ENTRADA) do ledger
"""
import sys
import os as _os

sys.path.insert(0, _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))), 'utils'))

import pytest
from models import db, EstoqueRegional, MovimentacaoEstoque, OrdemServico
from controle_estoque import (
    calcular_gasto_ledger,
    converter_quantidade_para_float,
    obter_estoque_disponivel,
    reverter_baixa_estoque,
)
from conftest import sessao_admin


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _payload_os(item, quantidade, evento='Evento Teste'):
    return {
        'contrato': '001/2025',
        'detentora': 'Alpha LTDA',
        'cnpj': '00.000.000/0001-00',
        'servico': 'COFFEE BREAK',
        'modulo': 'coffee',
        'grupo': '1',
        'evento': evento,
        'data': '2026-01-10',
        'itens': [{
            'itemId': item['item_id'],
            'categoria': item['categoria_nome'],
            'descricao': 'Item de Teste',
            'unidade': 'Unidade',
            'diarias': 1,
            'qtdSolicitada': quantidade,
            'qtdTotal': quantidade,
            'valorUnit': '10,00',
        }],
    }


def _disponivel(item):
    _, disp = obter_estoque_disponivel(item['item_id'], 1)
    return disp


def _assert_cache_bate_ledger(estoque_id):
    """Invariante: o cache nunca pode divergir do ledger."""
    estoque = db.session.get(EstoqueRegional, estoque_id)
    cache = converter_quantidade_para_float(estoque.quantidade_gasto)
    ledger = calcular_gasto_ledger(estoque_id)
    assert abs(cache - ledger) < 0.01, (
        'cache quantidade_gasto={} divergiu do ledger={}'.format(cache, ledger)
    )


def _criar_os(client, item, quantidade, evento='Evento Teste'):
    return client.post('/api/ordens-servico/', json=_payload_os(item, quantidade, evento))


# ---------------------------------------------------------------------------
# Criacao
# ---------------------------------------------------------------------------

class TestCriacao:

    def test_criar_os_dentro_do_saldo_baixa_estoque(self, client, app, usuario_admin, item_com_estoque):
        sessao_admin(client, usuario_admin)
        resp = _criar_os(client, item_com_estoque, 60)
        assert resp.status_code == 201, resp.get_json()

        with app.app_context():
            assert _disponivel(item_com_estoque) == 40
            _assert_cache_bate_ledger(item_com_estoque['estoque_id'])

    def test_criar_os_acima_do_saldo_e_recusada(self, client, app, usuario_admin, item_com_estoque):
        sessao_admin(client, usuario_admin)
        resp = _criar_os(client, item_com_estoque, 150)
        assert resp.status_code == 400
        assert 'insuficiente' in resp.get_json()['erro'].lower()

        with app.app_context():
            assert _disponivel(item_com_estoque) == 100
            assert calcular_gasto_ledger(item_com_estoque['estoque_id']) == 0

    def test_linhas_duplicadas_do_mesmo_item_somam(self, client, app, usuario_admin, item_com_estoque):
        """Duas linhas de 60 do mesmo item = 120 > 100: deve recusar."""
        sessao_admin(client, usuario_admin)
        payload = _payload_os(item_com_estoque, 60)
        payload['itens'].append(dict(payload['itens'][0]))

        resp = client.post('/api/ordens-servico/', json=payload)
        assert resp.status_code == 400, 'validacao deve somar linhas do mesmo item'

        with app.app_context():
            assert _disponivel(item_com_estoque) == 100


# ---------------------------------------------------------------------------
# Edicao -- o bug relatado
# ---------------------------------------------------------------------------

class TestEdicao:

    def test_editar_varias_vezes_mantendo_qtd_nao_altera_saldo(self, client, app, usuario_admin, item_com_estoque):
        """Regressao: cada edicao revertia TODAS as SAIDAs historicas."""
        sessao_admin(client, usuario_admin)
        os_id = _criar_os(client, item_com_estoque, 60).get_json()['id']

        for i in range(5):
            resp = client.put('/api/ordens-servico/{}'.format(os_id),
                              json=_payload_os(item_com_estoque, 60))
            assert resp.status_code == 200, resp.get_json()

            with app.app_context():
                assert _disponivel(item_com_estoque) == 40, 'saldo mudou na edicao {}'.format(i + 1)
                _assert_cache_bate_ledger(item_com_estoque['estoque_id'])

    def test_duas_os_estoque_zerado_nao_permite_aumentar(self, client, app, usuario_admin, item_com_estoque):
        """
        O CENARIO RELATADO PELOS USUARIOS.

        O.S.#1 com 60 + O.S.#2 com 40 zeram o estoque de 100. Apos varias
        edicoes da O.S.#1, o bug creditava saldo fantasma e deixava aumentar
        para 100 -- alocando 140 de um estoque de 100.
        """
        sessao_admin(client, usuario_admin)
        os1 = _criar_os(client, item_com_estoque, 60, 'Evento 1').get_json()['id']
        _criar_os(client, item_com_estoque, 40, 'Evento 2')

        with app.app_context():
            assert _disponivel(item_com_estoque) == 0, 'estoque deveria estar zerado'

        # Edicoes repetidas mantendo a quantidade
        for _ in range(2):
            resp = client.put('/api/ordens-servico/{}'.format(os1),
                              json=_payload_os(item_com_estoque, 60, 'Evento 1'))
            assert resp.status_code == 200, resp.get_json()

        with app.app_context():
            assert _disponivel(item_com_estoque) == 0, 'saldo fantasma reapareceu'

        # Tentativa de aumentar com estoque zerado: deve ser RECUSADA
        resp = client.put('/api/ordens-servico/{}'.format(os1),
                          json=_payload_os(item_com_estoque, 100, 'Evento 1'))
        assert resp.status_code == 400, 'aumentou item com estoque zerado'

        with app.app_context():
            assert _disponivel(item_com_estoque) == 0
            _assert_cache_bate_ledger(item_com_estoque['estoque_id'])

    def test_reduzir_quantidade_devolve_diferenca(self, client, app, usuario_admin, item_com_estoque):
        sessao_admin(client, usuario_admin)
        os_id = _criar_os(client, item_com_estoque, 80).get_json()['id']

        resp = client.put('/api/ordens-servico/{}'.format(os_id),
                          json=_payload_os(item_com_estoque, 30))
        assert resp.status_code == 200, resp.get_json()

        with app.app_context():
            assert _disponivel(item_com_estoque) == 70
            _assert_cache_bate_ledger(item_com_estoque['estoque_id'])

    def test_aumentar_dentro_do_saldo_e_aceito(self, client, app, usuario_admin, item_com_estoque):
        sessao_admin(client, usuario_admin)
        os_id = _criar_os(client, item_com_estoque, 30).get_json()['id']

        resp = client.put('/api/ordens-servico/{}'.format(os_id),
                          json=_payload_os(item_com_estoque, 90))
        assert resp.status_code == 200, resp.get_json()

        with app.app_context():
            assert _disponivel(item_com_estoque) == 10
            _assert_cache_bate_ledger(item_com_estoque['estoque_id'])


# ---------------------------------------------------------------------------
# Reversao: exclusao e cancelamento
# ---------------------------------------------------------------------------

class TestReversao:

    def test_reverter_e_idempotente(self, client, app, usuario_admin, item_com_estoque):
        """Reverter duas vezes nao pode creditar estoque duas vezes."""
        sessao_admin(client, usuario_admin)
        os_id = _criar_os(client, item_com_estoque, 60).get_json()['id']

        with app.app_context():
            reverter_baixa_estoque(os_id)
            db.session.commit()
            assert _disponivel(item_com_estoque) == 100

            reverter_baixa_estoque(os_id)
            db.session.commit()
            assert _disponivel(item_com_estoque) == 100, 'reversao creditou em duplicidade'
            _assert_cache_bate_ledger(item_com_estoque['estoque_id'])

    def test_excluir_os_devolve_saldo(self, client, app, usuario_admin, item_com_estoque):
        sessao_admin(client, usuario_admin)
        os_id = _criar_os(client, item_com_estoque, 60).get_json()['id']

        resp = client.delete('/api/ordens-servico/{}'.format(os_id), json={'motivo': 'teste'})
        assert resp.status_code == 200, resp.get_json()

        with app.app_context():
            assert _disponivel(item_com_estoque) == 100

    def test_cancelar_os_devolve_saldo(self, client, app, usuario_admin, item_com_estoque):
        """Antes da correcao o cancelamento nao devolvia nada -- saldo preso."""
        token = sessao_admin(client, usuario_admin)
        os_id = _criar_os(client, item_com_estoque, 60).get_json()['id']

        with app.app_context():
            os_obj = db.session.get(OrdemServico, os_id)
            os_obj.status = 'aceita'
            db.session.commit()

        resp = client.post('/api/ordens-servico/{}/cancelar'.format(os_id),
                           json={'motivo': 'teste'},
                           headers={'X-CSRF-Token': token})
        assert resp.status_code == 200, resp.get_json()

        with app.app_context():
            assert _disponivel(item_com_estoque) == 100, 'cancelamento nao devolveu o saldo'
            _assert_cache_bate_ledger(item_com_estoque['estoque_id'])
