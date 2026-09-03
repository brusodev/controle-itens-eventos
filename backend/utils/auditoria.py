"""
Utilitário para registro de auditoria
"""
from models import db, Auditoria
from flask import request, session
import json
import logging

# Sem emoji e sem print(): sob cp1252 (console do Windows) um emoji levanta
# UnicodeEncodeError, e como isto roda dentro do fluxo de criacao de O.S. o
# crash derrubava a requisicao inteira com 500.
logger = logging.getLogger(__name__)


def registrar_auditoria(acao, modulo, descricao, entidade_tipo=None, entidade_id=None, 
                       dados_antes=None, dados_depois=None):
    """
    Registra uma ação de auditoria no sistema
    
    Args:
        acao: 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
        modulo: 'OS', 'ITEM', 'DETENTORA', 'USUARIO', 'AUTH'
        descricao: Descrição legível da ação
        entidade_tipo: Nome da tabela/modelo (opcional)
        entidade_id: ID do registro (opcional)
        dados_antes: Dict com dados antes da alteração (opcional)
        dados_depois: Dict com dados após alteração (opcional)
    """
    try:
        # Pegar informações do usuário da sessão
        usuario_id = session.get('usuario_id')
        usuario_email = session.get('usuario_email')
        usuario_nome = session.get('usuario_nome')
        
        logger.debug('Auditoria: usuario=%s acao=%s modulo=%s entidade=%s#%s',
                     usuario_id, acao, modulo, entidade_tipo, entidade_id)
        
        if not usuario_id:
            logger.warning('Auditoria sem usuario na sessao')
            return False
        
        # Pegar informações da requisição
        ip_address = request.remote_addr if request else None
        user_agent = request.headers.get('User-Agent', '')[:200] if request else None
        
        # Converter dicts para JSON
        dados_antes_json = json.dumps(dados_antes, ensure_ascii=False) if dados_antes else None
        dados_depois_json = json.dumps(dados_depois, ensure_ascii=False) if dados_depois else None
        
        logger.debug('Auditoria dados antes=%s depois=%s',
                     bool(dados_antes_json), bool(dados_depois_json))
        
        # Criar registro de auditoria
        auditoria = Auditoria(
            usuario_id=usuario_id,
            usuario_email=usuario_email,
            usuario_nome=usuario_nome,
            acao=acao,
            modulo=modulo,
            entidade_tipo=entidade_tipo,
            entidade_id=entidade_id,
            descricao=descricao,
            dados_antes=dados_antes_json,
            dados_depois=dados_depois_json,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.session.add(auditoria)
        db.session.commit()
        
        logger.debug('Auditoria ID %s salva', auditoria.id)
        return True
        
    except Exception as e:
        logger.exception('Erro ao registrar auditoria')
        try:
            db.session.rollback()
        except:
            pass
        return False


# Exemplos de uso:
"""
# Login/Logout
registrar_auditoria('LOGIN', 'AUTH', f'Usuário {email} fez login')
registrar_auditoria('LOGOUT', 'AUTH', f'Usuário {email} fez logout')

# Criar registro
registrar_auditoria(
    'CREATE', 
    'DETENTORA', 
    f'Criou detentora {detentora.nome}',
    entidade_tipo='detentoras',
    entidade_id=detentora.id,
    dados_depois=detentora.to_dict()
)

# Atualizar registro
registrar_auditoria(
    'UPDATE', 
    'OS', 
    f'Atualizou OS #{os.numero}',
    entidade_tipo='ordens_servico',
    entidade_id=os.id,
    dados_antes=os_antigo.to_dict(),
    dados_depois=os.to_dict()
)

# Deletar registro
registrar_auditoria(
    'DELETE', 
    'ITEM', 
    f'Deletou item {item.descricao}',
    entidade_tipo='itens',
    entidade_id=item.id,
    dados_antes=item.to_dict()
)
"""
