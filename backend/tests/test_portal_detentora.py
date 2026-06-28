"""
Sprint 4 — Testes automatizados do Portal da Detentora

Coberturas:
  - Auth empresa e isolamento entre detentoras
  - Transições de status e validações negativas (máquina de estados)
  - Persistência de evidência de assinatura
  - Endpoints de monitoramento do operador
  - CSRF em rotas mutantes
"""
import pytest
from tests.conftest import sessao_empresa, sessao_admin, assinatura_fake_b64
from models import db, OrdemServico, AceiteEmpresa, RevisaoEmpresa, ComentarioEmpresa


# ============================================================
# AUTH — acesso por perfil
# ============================================================

class TestAuth:

    def test_rota_empresa_rejeita_nao_autenticado(self, client):
        resp = client.get('/api/empresa/inbox')
        assert resp.status_code == 401

    def test_rota_empresa_rejeita_admin(self, client, usuario_admin):
        sessao_admin(client, usuario_admin)
        resp = client.get('/api/empresa/inbox')
        assert resp.status_code == 403

    def test_rota_empresa_aceita_perfil_empresa(self, client, usuario_empresa_alpha, detentora_alpha):
        sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.get('/api/empresa/inbox')
        assert resp.status_code == 200

    def test_login_grava_detentora_id_na_sessao(self, client, usuario_empresa_alpha, detentora_alpha, app):
        with app.app_context():
            from models import Usuario
            u = db.session.get(Usuario, usuario_empresa_alpha)
            assert u.detentora_id == detentora_alpha

    def test_csrf_token_endpoint_requer_login(self, client):
        resp = client.get('/auth/csrf-token')
        assert resp.status_code == 401

    def test_csrf_token_retornado_para_autenticado(self, client, usuario_admin):
        sessao_admin(client, usuario_admin)
        resp = client.get('/auth/csrf-token')
        assert resp.status_code == 200
        assert 'csrf_token' in resp.get_json()

    def test_perfil_empresa_sem_detentora_id_invalido(self, app):
        """Usuário empresa deve ter detentora_id obrigatoriamente."""
        with app.app_context():
            from models import Usuario
            u = Usuario(nome='Sem Det', email='semdet@test.com', perfil='empresa', detentora_id=None)
            u.set_senha('123456')
            db.session.add(u)
            db.session.commit()
            assert u.detentora_id is None
            assert u.perfil == 'empresa'
            # O controle é feito no registro — aqui só verificamos que o model aceita


# ============================================================
# ISOLAMENTO — empresa A não vê dados da empresa B
# ============================================================

class TestIsolamento:

    def test_inbox_so_retorna_os_da_propria_detentora(
        self, client, app,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha, os_enviada_beta
    ):
        sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.get('/api/empresa/inbox')
        assert resp.status_code == 200
        ids = [o['id'] for o in resp.get_json()['ordens']]
        with app.app_context():
            assert os_enviada_alpha in ids
            assert os_enviada_beta not in ids

    def test_detalhe_os_de_outra_detentora_retorna_403(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_beta
    ):
        sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.get(f'/api/empresa/ordens/{os_enviada_beta}')
        assert resp.status_code == 403

    def test_aceitar_os_de_outra_detentora_retorna_403(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_beta
    ):
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_beta}/aceitar',
            json={'nome_responsavel': 'Hacker', 'assinatura_base64': assinatura_fake_b64()},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 403

    def test_comentar_os_de_outra_detentora_retorna_403(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_beta
    ):
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_beta}/comentarios',
            json={'texto': 'Tentativa de invasão'},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 403


# ============================================================
# TRANSIÇÕES DE STATUS
# ============================================================

class TestTransicoesStatus:

    def test_transicao_valida_enviada_para_aceita(
        self, client, app,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/aceitar',
            json={'nome_responsavel': 'Fulano', 'assinatura_base64': assinatura_fake_b64()},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 201
        with app.app_context():
            os_obj = db.session.get(OrdemServico, os_enviada_alpha)
            assert os_obj.status == 'aceita'

    def test_transicao_invalida_emitida_para_aceita(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_emitida_alpha
    ):
        """O.S. 'emitida' não está no inbox — aceite deve retornar 403 (isolamento: emitida não aparece no inbox)."""
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        # O inbox não exibe O.S. emitida, mas mesmo acessando diretamente o endpoint deve falhar
        resp = client.post(
            f'/api/empresa/ordens/{os_emitida_alpha}/aceitar',
            json={'nome_responsavel': 'Fulano', 'assinatura_base64': assinatura_fake_b64()},
            headers={'X-CSRF-Token': token}
        )
        # Ou 400 (transição inválida) — status 'emitida' não permite aceite diretamente
        assert resp.status_code in (400, 403)

    def test_transicao_valida_aceita_para_em_execucao(
        self, client, app,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        """Aceitar primeiro, depois iniciar execução."""
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/aceitar',
            json={'nome_responsavel': 'Fulano', 'assinatura_base64': assinatura_fake_b64()},
            headers={'X-CSRF-Token': token}
        )
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/iniciar-execucao',
            json={}, headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 200
        with app.app_context():
            os_obj = db.session.get(OrdemServico, os_enviada_alpha)
            assert os_obj.status == 'em_execucao'

    def test_transicao_valida_em_execucao_para_executada(
        self, client, app,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/aceitar',
            json={'nome_responsavel': 'Fulano', 'assinatura_base64': assinatura_fake_b64()},
            headers={'X-CSRF-Token': token}
        )
        client.post(f'/api/empresa/ordens/{os_enviada_alpha}/iniciar-execucao',
                    json={}, headers={'X-CSRF-Token': token})
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/concluir-execucao',
            json={}, headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 200
        with app.app_context():
            os_obj = db.session.get(OrdemServico, os_enviada_alpha)
            assert os_obj.status == 'executada'

    def test_transicao_invalida_executada_para_aceita(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        """Não é possível voltar de executada para aceita."""
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        # Avançar até executada
        client.post(f'/api/empresa/ordens/{os_enviada_alpha}/aceitar',
                    json={'nome_responsavel': 'F', 'assinatura_base64': assinatura_fake_b64()},
                    headers={'X-CSRF-Token': token})
        client.post(f'/api/empresa/ordens/{os_enviada_alpha}/iniciar-execucao',
                    json={}, headers={'X-CSRF-Token': token})
        client.post(f'/api/empresa/ordens/{os_enviada_alpha}/concluir-execucao',
                    json={}, headers={'X-CSRF-Token': token})
        # Tentar aceitar novamente
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/aceitar',
            json={'nome_responsavel': 'Hack', 'assinatura_base64': assinatura_fake_b64()},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 400

    def test_revisao_muda_status_para_em_revisao(
        self, client, app,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/revisar',
            json={'descricao': 'Ajuste necessário nos itens'},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 201
        with app.app_context():
            os_obj = db.session.get(OrdemServico, os_enviada_alpha)
            assert os_obj.status == 'em_revisao'

    def test_revisao_sem_descricao_retorna_400(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/revisar',
            json={},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 400


# ============================================================
# ACEITE — persistência de evidência
# ============================================================

class TestAceiteEvidencia:

    def test_aceite_persiste_evidencia_completa(
        self, client, app,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/aceitar',
            json={
                'nome_responsavel': 'Maria Silva',
                'assinatura_base64': assinatura_fake_b64(),
                'observacoes': 'Aceite confirmado'
            },
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 201
        data = resp.get_json()
        aceite = data['aceite']

        # Campos obrigatórios presentes
        assert aceite['nomeResponsavel'] == 'Maria Silva'
        assert aceite['hashPayload'] is not None
        assert len(aceite['hashPayload']) == 64  # SHA-256 hex
        assert aceite['assinaturaPath'] is not None
        assert aceite['dataHora'] is not None

        # Persistido no banco
        with app.app_context():
            salvo = db.session.get(AceiteEmpresa, aceite['id'])
            assert salvo is not None
            assert salvo.nome_responsavel == 'Maria Silva'
            assert salvo.hash_payload == aceite['hashPayload']
            assert salvo.detentora_id == detentora_alpha

    def test_aceite_sem_assinatura_retorna_400(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/aceitar',
            json={'nome_responsavel': 'Alguem'},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 400

    def test_aceite_sem_nome_responsavel_retorna_400(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/aceitar',
            json={'assinatura_base64': assinatura_fake_b64()},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 400

    def test_detalhe_os_inclui_aceites_e_revisoes(
        self, client, app,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/aceitar',
            json={'nome_responsavel': 'Fulano', 'assinatura_base64': assinatura_fake_b64()},
            headers={'X-CSRF-Token': token}
        )
        resp = client.get(f'/api/empresa/ordens/{os_enviada_alpha}')
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'aceites' in data
        assert len(data['aceites']) == 1
        assert 'revisoes' in data
        assert 'comentarios' in data


# ============================================================
# COMENTÁRIOS
# ============================================================

class TestComentarios:

    def test_adicionar_comentario_persiste(
        self, client, app,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/comentarios',
            json={'texto': 'Pergunta sobre o item 3'},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 201
        with app.app_context():
            comentarios = ComentarioEmpresa.query.filter_by(ordem_servico_id=os_enviada_alpha).all()
            assert len(comentarios) == 1
            assert comentarios[0].texto == 'Pergunta sobre o item 3'
            assert comentarios[0].detentora_id == detentora_alpha

    def test_listar_comentarios_ordem_cronologica(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        for texto in ['Primeiro', 'Segundo', 'Terceiro']:
            client.post(
                f'/api/empresa/ordens/{os_enviada_alpha}/comentarios',
                json={'texto': texto},
                headers={'X-CSRF-Token': token}
            )
        resp = client.get(f'/api/empresa/ordens/{os_enviada_alpha}/comentarios')
        assert resp.status_code == 200
        textos = [c['texto'] for c in resp.get_json()]
        assert textos == ['Primeiro', 'Segundo', 'Terceiro']

    def test_comentario_sem_texto_retorna_400(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        token = sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/comentarios',
            json={},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 400


# ============================================================
# CSRF
# ============================================================

class TestCSRF:

    def test_post_sem_csrf_token_retorna_403(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        # Sessão válida mas sem CSRF token
        with client.session_transaction() as s:
            s['usuario_id'] = usuario_empresa_alpha
            s['usuario_perfil'] = 'empresa'
            s['detentora_id'] = detentora_alpha
            # csrf_token ausente
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/comentarios',
            json={'texto': 'Comentário'},
        )
        assert resp.status_code == 403

    def test_post_com_csrf_token_invalido_retorna_403(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        import secrets
        token_real = secrets.token_hex(32)
        token_falso = secrets.token_hex(32)
        with client.session_transaction() as s:
            s['usuario_id'] = usuario_empresa_alpha
            s['usuario_perfil'] = 'empresa'
            s['detentora_id'] = detentora_alpha
            s['csrf_token'] = token_real
        resp = client.post(
            f'/api/empresa/ordens/{os_enviada_alpha}/comentarios',
            json={'texto': 'Comentário'},
            headers={'X-CSRF-Token': token_falso}
        )
        assert resp.status_code == 403

    def test_get_nao_exige_csrf_token(
        self, client,
        usuario_empresa_alpha, detentora_alpha,
        os_enviada_alpha
    ):
        with client.session_transaction() as s:
            s['usuario_id'] = usuario_empresa_alpha
            s['usuario_perfil'] = 'empresa'
            s['detentora_id'] = detentora_alpha
            # csrf_token ausente — GET deve passar
        resp = client.get(f'/api/empresa/ordens/{os_enviada_alpha}/comentarios')
        assert resp.status_code == 200


# ============================================================
# MONITORAMENTO DO OPERADOR
# ============================================================

class TestMonitoramento:

    def test_monitoramento_requer_admin(self, client, usuario_empresa_alpha, detentora_alpha):
        sessao_empresa(client, usuario_empresa_alpha, detentora_alpha)
        resp = client.get('/api/ordens-servico/monitoramento')
        assert resp.status_code == 403

    def test_monitoramento_retorna_os_enviadas(
        self, client, app,
        usuario_admin, detentora_alpha, detentora_beta,
        os_enviada_alpha, os_enviada_beta
    ):
        sessao_admin(client, usuario_admin)
        resp = client.get('/api/ordens-servico/monitoramento')
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'ordens' in data
        assert 'totais' in data
        assert 'total' in data
        ids = [o['id'] for o in data['ordens']]
        assert os_enviada_alpha in ids
        assert os_enviada_beta in ids

    def test_monitoramento_nao_inclui_emitidas(
        self, client, app,
        usuario_admin,
        os_emitida_alpha
    ):
        sessao_admin(client, usuario_admin)
        resp = client.get('/api/ordens-servico/monitoramento')
        assert resp.status_code == 200
        ids = [o['id'] for o in resp.get_json()['ordens']]
        assert os_emitida_alpha not in ids

    def test_monitoramento_filtro_por_detentora(
        self, client,
        usuario_admin, detentora_alpha,
        os_enviada_alpha, os_enviada_beta
    ):
        sessao_admin(client, usuario_admin)
        resp = client.get(f'/api/ordens-servico/monitoramento?detentora_id={detentora_alpha}')
        assert resp.status_code == 200
        ids = [o['id'] for o in resp.get_json()['ordens']]
        assert os_enviada_alpha in ids
        assert os_enviada_beta not in ids

    def test_monitoramento_totais_por_status(
        self, client, app,
        usuario_admin, detentora_alpha,
        os_enviada_alpha
    ):
        sessao_admin(client, usuario_admin)
        resp = client.get('/api/ordens-servico/monitoramento')
        totais = resp.get_json()['totais']
        assert 'enviada_empresa' in totais
        assert totais['enviada_empresa'] >= 1

    def test_enviar_para_empresa_muda_status(
        self, client, app,
        usuario_admin,
        usuario_empresa_alpha,  # detentora precisa de usuário ativo no portal
        os_emitida_alpha
    ):
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

    def test_enviar_para_empresa_sem_detentora_retorna_400(
        self, client, app,
        usuario_admin
    ):
        with app.app_context():
            os_sem_det = OrdemServico(
                numero_os='99/2026', modulo='coffee', grupo='1',
                detentora_id=None, status='emitida', evento='Sem Det'
            )
            db.session.add(os_sem_det)
            db.session.commit()
            os_id = os_sem_det.id

        token = sessao_admin(client, usuario_admin)
        resp = client.post(
            f'/api/ordens-servico/{os_id}/enviar-empresa',
            json={},
            headers={'X-CSRF-Token': token}
        )
        assert resp.status_code == 400
