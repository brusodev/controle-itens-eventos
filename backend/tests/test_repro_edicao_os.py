"""
Reprodução do problema de edição de O.S.

Compara o caminho de salvamento do frontend `salvarEFecharOS` (ordens-servico.js),
que envia um payload de itens INCOMPLETO, com o caminho `confirmarEmissaoOS`
(emitir-os.js), que envia o payload COMPLETO.

Objetivo: provar onde os dados se perdem na edição.
"""
import pytest
from tests.conftest import sessao_admin
from models import db, Item, Categoria, EstoqueRegional, OrdemServico, ItemOrdemServico


@pytest.fixture
def item_com_estoque(app):
    """Cria categoria + item + estoque na região 1 com folga."""
    with app.app_context():
        cat = Categoria(nome='Coffee', tipo='coffee', natureza='339030')
        db.session.add(cat)
        db.session.flush()
        item = Item(categoria_id=cat.id, item_codigo='1',
                    descricao='Café 100ml', unidade='Unidade')
        db.session.add(item)
        db.session.flush()
        est = EstoqueRegional(item_id=item.id, regiao_numero=1,
                              quantidade_inicial='1000', quantidade_gasto='0')
        db.session.add(est)
        db.session.commit()
        return item.id


@pytest.fixture
def os_emitida_com_item(app, detentora_alpha, item_com_estoque):
    """O.S. emitida na região 1 com 1 item (diarias=2, qtdSol=10, qtdTotal=20)."""
    with app.app_context():
        os_obj = OrdemServico(
            numero_os='10/2026', modulo='coffee', grupo='1', regiao_estoque=1,
            detentora_id=detentora_alpha, status='emitida',
            evento='Evento Base', data='2026-02-01', detentora='Alpha LTDA',
            contrato='001/2025', cnpj='00.000.000/0001-00',
        )
        db.session.add(os_obj)
        db.session.flush()
        item_os = ItemOrdemServico(
            ordem_servico_id=os_obj.id, item_id=item_com_estoque,
            categoria='Coffee', item_codigo=str(item_com_estoque), descricao='Café 100ml',
            unidade='Unidade', diarias=2, quantidade_solicitada=10, quantidade_total=20,
            valor_unitario='5.50',
        )
        db.session.add(item_os)
        db.session.commit()
        return os_obj.id


def _payload_item_salvarEFecharOS(item_id):
    """Replica o map de itens em salvarEFecharOS (ordens-servico.js) JÁ CORRIGIDO."""
    return {
        'categoria': 'Coffee',
        'itemId': item_id,
        'itemBec': '',
        'descricao': 'Café 100ml',
        'unidade': 'Unidade',
        'diarias': 2,
        'qtdSolicitada': 10,
        'qtdTotal': 20,
        'valorUnit': '5.50',
    }


def _payload_item_completo(item_id):
    """Replica o map de itens em confirmarEmissaoOS (emitir-os.js)."""
    return {
        'categoria': 'Coffee',
        'itemId': item_id,
        'itemBec': '',
        'descricao': 'Café 100ml',
        'unidade': 'Unidade',
        'diarias': 2,
        'qtdSolicitada': 10,
        'qtdTotal': 20,
        'valorUnit': '5.50',
    }


class TestEdicaoPreservaDados:

    def test_salvarEFecharOS_preserva_diarias_qtd_e_valor(
        self, client, app, usuario_admin, item_com_estoque, os_emitida_com_item
    ):
        """Regressão: o caminho salvarEFecharOS preserva diarias/qtdSol/valorUnit."""
        token = sessao_admin(client, usuario_admin)
        resp = client.put(
            f'/api/ordens-servico/{os_emitida_com_item}',
            json={
                'grupo': '1',
                'evento': 'Evento Editado',
                'itens': [_payload_item_salvarEFecharOS(item_com_estoque)],
            },
            headers={'X-CSRF-Token': token},
        )
        assert resp.status_code == 200, resp.get_json()

        with app.app_context():
            os_obj = db.session.get(OrdemServico, os_emitida_com_item)
            assert len(os_obj.itens) == 1
            item = os_obj.itens[0]
            assert item.quantidade_total == 20
            assert item.diarias == 2
            assert item.quantidade_solicitada == 10
            assert item.valor_unitario == '5.50'

    def test_payload_completo_preserva_tudo(
        self, client, app, usuario_admin, item_com_estoque, os_emitida_com_item
    ):
        """O caminho confirmarEmissaoOS preserva diarias/qtdSolicitada/valorUnit."""
        token = sessao_admin(client, usuario_admin)
        resp = client.put(
            f'/api/ordens-servico/{os_emitida_com_item}',
            json={
                'grupo': '1',
                'evento': 'Evento Editado',
                'itens': [_payload_item_completo(item_com_estoque)],
            },
            headers={'X-CSRF-Token': token},
        )
        assert resp.status_code == 200, resp.get_json()

        with app.app_context():
            os_obj = db.session.get(OrdemServico, os_emitida_com_item)
            item = os_obj.itens[0]
            assert item.quantidade_total == 20
            assert item.diarias == 2
            assert item.quantidade_solicitada == 10
            assert item.valor_unitario == '5.50'
