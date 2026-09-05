"""
Testes das GUARDAS de integridade do estoque (defesa em profundidade).

Cobrem o que impede a volta do "saldo fantasma":
  - trigger no banco barra SAIDA acima do contratado em QUALQUER caminho,
    inclusive quando a validacao de aplicacao e ignorada (import, SQL direto);
  - relatorios derivam o gasto do LEDGER (mesma fonte da validacao), nao do
    cache quantidade_gasto que pode divergir.
"""
import pytest
import sqlalchemy.exc

from models import db, MovimentacaoEstoque, EstoqueRegional, Item
from utils.controle_estoque import (
    subquery_gasto_ledger,
    calcular_gasto_ledger,
    dar_baixa_estoque,
)


def _inserir_saida_crua(estoque_id, item_id, quantidade):
    """Insere uma SAIDA direto, sem passar pela validacao de aplicacao."""
    db.session.add(MovimentacaoEstoque(
        ordem_servico_id=None, item_id=item_id, estoque_regional_id=estoque_id,
        quantidade=quantidade, tipo='SAIDA', observacao='__teste__',
    ))
    db.session.commit()


class TestTriggerBanco:
    def test_saida_acima_do_contratado_e_barrada_pelo_banco(self, app, item_com_estoque):
        """Mesmo ignorando a validacao de aplicacao, o banco recusa o excesso."""
        with app.app_context():
            with pytest.raises(sqlalchemy.exc.SQLAlchemyError):
                _inserir_saida_crua(
                    item_com_estoque['estoque_id'],
                    item_com_estoque['item_id'],
                    150,  # contratado e 100
                )
            db.session.rollback()
            # Nada foi consumido
            assert calcular_gasto_ledger(item_com_estoque['estoque_id']) == 0.0

    def test_saida_dentro_do_contratado_passa(self, app, item_com_estoque):
        with app.app_context():
            _inserir_saida_crua(
                item_com_estoque['estoque_id'], item_com_estoque['item_id'], 60)
            assert calcular_gasto_ledger(item_com_estoque['estoque_id']) == 60.0

    def test_soma_de_saidas_nao_pode_estourar(self, app, item_com_estoque):
        """60 + 50 = 110 > 100: a segunda SAIDA e barrada."""
        with app.app_context():
            _inserir_saida_crua(
                item_com_estoque['estoque_id'], item_com_estoque['item_id'], 60)
            with pytest.raises(sqlalchemy.exc.SQLAlchemyError):
                _inserir_saida_crua(
                    item_com_estoque['estoque_id'], item_com_estoque['item_id'], 50)
            db.session.rollback()
            assert calcular_gasto_ledger(item_com_estoque['estoque_id']) == 60.0

    def test_entrada_nunca_e_barrada(self, app, item_com_estoque):
        """ENTRADA (devolucao) so reduz consumo -- nunca dispara a trava."""
        with app.app_context():
            _inserir_saida_crua(
                item_com_estoque['estoque_id'], item_com_estoque['item_id'], 100)
            db.session.add(MovimentacaoEstoque(
                ordem_servico_id=None, item_id=item_com_estoque['item_id'],
                estoque_regional_id=item_com_estoque['estoque_id'],
                quantidade=40, tipo='ENTRADA', observacao='__teste_entrada__',
            ))
            db.session.commit()
            assert calcular_gasto_ledger(item_com_estoque['estoque_id']) == 60.0


class TestRelatorioUsaLedger:
    def test_subquery_gasto_bate_com_ledger(self, app, item_com_estoque):
        with app.app_context():
            dar_baixa_estoque(
                ordem_servico_id=None,
                item_id=item_com_estoque['item_id'],
                regiao_numero=1,
                quantidade=25,
            )
            db.session.commit()

            gasto_col = subquery_gasto_ledger(EstoqueRegional.id).label('g')
            row = db.session.query(
                EstoqueRegional.quantidade_inicial, gasto_col
            ).filter(EstoqueRegional.id == item_com_estoque['estoque_id']).one()

            assert float(row.g) == 25.0
            assert float(row.g) == calcular_gasto_ledger(item_com_estoque['estoque_id'])
            # disponivel derivado do relatorio
            assert float(row.quantidade_inicial) - float(row.g) == 75.0

    def test_relatorio_ignora_cache_divergente(self, app, item_com_estoque):
        """
        Ainda que o cache quantidade_gasto esteja mentindo, o relatorio (ledger)
        mostra a verdade -- exatamente a divergencia que causou o incidente.
        """
        with app.app_context():
            # consumo real = 30
            _inserir_saida_crua(
                item_com_estoque['estoque_id'], item_com_estoque['item_id'], 30)
            # cache corrompido de proposito
            est = db.session.get(EstoqueRegional, item_com_estoque['estoque_id'])
            est.quantidade_gasto = 0
            db.session.commit()

            gasto_col = subquery_gasto_ledger(EstoqueRegional.id).label('g')
            row = db.session.query(gasto_col).filter(
                EstoqueRegional.id == item_com_estoque['estoque_id']).one()
            assert float(row.g) == 30.0  # ledger, nao o cache zerado
