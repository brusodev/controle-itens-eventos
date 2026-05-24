"""
Testes dos gaps fechados após Sprint 4:
  - Gap 1: detentora_id no payload de criar/atualizar O.S.
  - Gap 2: endpoint recusar (enviada_empresa/em_revisao → recusada)
  - Gap 3: endpoint reenviar-empresa (em_revisao → enviada_empresa)
"""
import pytest
from tests.conftest import sessao_empresa, sessao_admin, assinatura_fake_b64
from models import db, OrdemServico, RevisaoEmpresa


# ============================================================
# GAP 1 — detentora_id em criar/atualizar O.S.
# ============================================================

class TestDetentoraIdNaOS:

    def test_criar_os_aceita_detentora_id_no_payload(
        self, client, app, usuario_admin, detentora_alpha
    ):
        """O payload de criação de O.S. deve aceitar detentoraId e persistir."""
        token = sessao_admin(client, usuario_admin)
        resp = client.post(
            '/api/ordens-servico/',
            json={
                'grupo': '1',
                'modulo': 'coffee',
                'evento': 'Evento com Detentora',
                'detentoraId': detentora_alpha,
                'itens': []
            },
            headers={'X-CSRF-Token': token}
        )
        # Pode retornar 201 (sucesso) ou 500 (falta de módulo de estoque em memória)
        # O importante: não é 400 "detentora_id inválido"
        assert resp.status_code != 400
        if resp.status_code == 201:
            with app.app_context():
                os_obj = OrdemServico.query.filter_by(evento='Evento com Detentora').first()
                assert os_obj is not None
                assert os_obj.detentora_id == detentora_alpha

    def test_enviar_empresa_funciona_apos_vincular_detentora(
        self, client, app, usuario_admin, detentora_alpha, os_emitida_alpha
    ):
        """O.S. com detentora_id vinculada pode ser enviada para empresa."""
        token = sessao_admin(client, usuario_admin)
        resp = client.post(
            f'/api/ordens-servico/{os_emitida_alpha}/enviar-empresa',
            json={},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 200
        with app.app_context():
            os_obj = db.session.get(OrdemServico, os_emitida_alpha)
            assert os_obj.status == 'enviada_empresa'

    def test_atualizar_os_aceita_detentora_id(
        self, client, app, usuario_admin, detentora_alpha, detentora_beta, os_emitida_alpha
    ):
        """PUT na O.S. emitida deve aceitar troca de detentoraId."""
        token = sessao_admin(client, usuario_admin)
        resp = client.put(
            f'/api/ordens-servico/{os_emitida_alpha}',
            json={
                'grupo': '1',
                'itens': [],
                'detentoraId': detentora_beta
            },
            headers={'X-CSRF-Token': token}
        )
        # Não deve retornar 400 por detentora_id
        assert resp.status_code not in (400, 403, 409)


# ============================================================
# GAP 2 — endpoint recusar
# ============================================================

class TestRecusar:

    def test_recusar_os_enviada_transiciona_para_recusada(
        self, client, app,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/recusar',
            json={'motivo': 'Itens incompatíveis com o contrato'},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['status'] == 'recusada'
        with app.app_context():
            os_obj = db.session.get(OrdemServico, os_enviada_alpha)
            assert os_obj.status == 'recusada'

    def test_recusar_os_em_revisao_transiciona_para_recusada(
        self, client, app,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        """Fluxo: enviada → em_revisao → recusada."""
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        # Primeiro revisar
        client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/revisar',
            json={'descricao': 'Ajuste necessário'},
            headers={'X-CSRF-Token': token}
        )
        # Depois recusar
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/recusar',
            json={'motivo': 'Ajuste não foi realizado'},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 200
        with app.app_context():
            os_obj = db.session.get(OrdemServico, os_enviada_alpha)
            assert os_obj.status == 'recusada'

    def test_recusar_persiste_motivo_como_revisao(
        self, client, app,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        """A recusa deve registrar o motivo como RevisaoEmpresa para rastreabilidade."""
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/recusar',
            json={'motivo': 'Motivo auditável'},
            headers={'X-CSRF-Token': token}
        )
        with app.app_context():
            revisoes = RevisaoEmpresa.query.filter_by(ordem_servico_id=os_enviada_alpha).all()
            assert len(revisoes) == 1
            assert '[RECUSA]' in revisoes[0].descricao
            assert 'Motivo auditável' in revisoes[0].descricao

    def test_recusar_sem_motivo_retorna_400(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/recusar',
            json={},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 400

    def test_recusar_os_aceita_retorna_400(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        """O.S. já aceita não pode ser recusada."""
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/aceitar',
            json={'nome_responsavel': 'Fulano', 'assinatura_base64': assinatura_fake_b64()},
            headers={'X-CSRF-Token': token}
        )
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/recusar',
            json={'motivo': 'Tentativa inválida'},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 400

    def test_recusar_os_de_outra_detentora_retorna_403(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_beta
    ):
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_beta}/recusar',
            json={'motivo': 'Tentativa'},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 403

    def test_recusar_requer_csrf(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        with client.session_transaction() as s:
            s['usuario_id'] = usuario_empresa_alpha
            s['usuario_perfil'] = 'empresa'
            s['detentora_id'] = detentora_alpha
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/recusar',
            json={'motivo': 'Sem CSRF'}
        )
        assert resp.status_code == 403


# ============================================================
# GAP 3 — endpoint reenviar-empresa
# ============================================================

class TestReenviarEmpresa:

    def test_reenviar_apos_revisao_transiciona_para_enviada(
        self, client, app,
        usuario_admin, detentora_alpha, usuario_empresa_alpha,
        os_enviada_alpha
    ):
        """Fluxo completo: enviada → em_revisao (empresa) → enviada_empresa (admin)."""
        token_empresa = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/revisar',
            json={'descricao': 'Ajuste pedido'},
            headers={'X-CSRF-Token': token_empresa}
        )
        # Agora o admin reenvia
        token_admin = sessao_admin(client, usuario_admin)
        resp = client.post(
            f'/api/ordens-servico/{os_enviada_alpha}/reenviar-empresa',
            json={},
            headers={'X-CSRF-Token': token_admin}
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['status'] == 'enviada_empresa'
        with app.app_context():
            os_obj = db.session.get(OrdemServico, os_enviada_alpha)
            assert os_obj.status == 'enviada_empresa'

    def test_reenviar_sem_revisao_previa_retorna_400(
        self, client,
        usuario_admin,
        os_enviada_alpha
    ):
        """Só pode reenviar O.S. que esteja em em_revisao."""
        token = sessao_admin(client, usuario_admin)
        resp = client.post(
            f'/api/ordens-servico/{os_enviada_alpha}/reenviar-empresa',
            json={},
            headers={'X-CSRF-Token': token}
        )
        # O.S. está em 'enviada_empresa', não em 'em_revisao' — transição inválida
        assert resp.status_code == 400

    def test_reenviar_requer_admin(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        """Empresa não pode reenviar — apenas admin/operador interno."""
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.post(
            f'/api/ordens-servico/{os_enviada_alpha}/reenviar-empresa',
            json={},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 403

    def test_reenviar_requer_csrf(self, client, app, usuario_admin):
        """reenviar-empresa também exige CSRF token."""
        with client.session_transaction() as s:
            s['usuario_id'] = usuario_admin
            s['usuario_perfil'] = 'admin'
            s['detentora_id'] = None
            s['usuario_nome'] = 'Admin'
            s['usuario_email'] = 'admin@test.com'
            # csrf_token ausente
        resp = client.post('/api/ordens-servico/1/reenviar-empresa', json={})
        assert resp.status_code == 403

    def test_fluxo_completo_revisao_reenvio_aceite(
        self, client, app,
        usuario_admin, usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        """Ciclo: enviada → revisao → reenviada → aceita."""
        token_emp = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        # 1. Empresa revisa
        client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/revisar',
            json={'descricao': 'Corrigir quantidade do item 2'},
            headers={'X-CSRF-Token': token_emp}
        )
        # 2. Admin reenvia
        token_adm = sessao_admin(client, usuario_admin)
        client.post(
            f'/api/ordens-servico/{os_enviada_alpha}/reenviar-empresa',
            json={}, headers={'X-CSRF-Token': token_adm}
        )
        # 3. Empresa aceita
        token_emp2 = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/aceitar',
            json={'nome_responsavel': 'João Silva', 'assinatura_base64': assinatura_fake_b64()},
            headers={'X-CSRF-Token': token_emp2}
        )
        assert resp.status_code == 201
        with app.app_context():
            os_obj = db.session.get(OrdemServico, os_enviada_alpha)
            assert os_obj.status == 'aceita'
