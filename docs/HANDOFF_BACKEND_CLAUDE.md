## Handoff Backend - Claude Code

Objetivo: implementar toda a base de dados, autenticacao, autorizacao, APIs e auditoria do Portal da Detentora sem quebrar o fluxo atual.

Escopo obrigatorio
- Tratar "empresa contratada" como detentora.
- Login unico por detentora.
- A mesma detentora pode atuar em multiplos grupos/lotes e modulos.
- Operador interno deve monitorar O.S. enviadas para aceite e assinatura.

Sprint 1 - Fundacao backend
1. Models e migrations
1.1 Estender Usuario para suportar conta vinculada a detentora.
1.2 Adicionar status da O.S.: emitida, enviada_empresa, em_revisao, aceita, em_execucao, executada, recusada.
1.3 Criar modelos de aceite, comentario e revisao vinculados a O.S.
1.4 Incluir campos de evidencia de aceite: data_hora, ip, user_agent, hash_payload, assinatura.
1.5 Migration com compatibilidade retroativa para O.S. e usuarios existentes.
2. Auth e autorizacao
2.1 Criar fluxo de login para detentora preservando login atual.
2.2 Adicionar contexto de detentora na sessao.
2.3 Criar decorators de permissao por detentora.
2.4 Garantir isolamento: detentora so enxerga dados proprios.

Sprint 2 - APIs funcionais
1. API detentora
1.1 Inbox de O.S. por status.
1.2 Aceite com assinatura (canvas payload), transicao enviada_empresa -> aceita.
1.3 Revisao (nao bloqueia execucao automaticamente).
1.4 Comentarios por O.S. (sem SLA).
1.5 Atualizacao de execucao: aceita -> em_execucao -> executada.
2. API operador
2.1 Endpoint consolidado para monitoramento: enviada, pendente_assinatura, assinada, em_execucao, executada.
2.2 Filtros por periodo, modulo e grupo/lote.

Sprint 3 - Regras e seguranca
1. Maquina de estados para validar transicoes.
2. Bloqueio de edicao estrutural da O.S. pela detentora.
3. Auditoria obrigatoria para aceite, revisao, comentario e mudanca de status.
4. Revisao de seguranca de sessao e CSRF.

Sprint 4 - Testes e rollout
1. Testes automatizados
1.1 Auth detentora e isolamento entre detentoras.
1.2 Transicoes de status e validacoes negativas.
1.3 Persistencia de evidencia de assinatura.
1.4 Endpoints de monitoramento do operador.
2. Regressao do fluxo atual admin/comum.
3. Feature flag para ativacao controlada.

Criterios de aceite backend
1. Nenhuma detentora consegue ler O.S. de outra detentora.
2. Operador visualiza status de aceite/assinatura em painel consolidado.
3. Aceite assinado fica auditavel com evidencia completa.
4. Fluxo legado de emissao/edicao/PDF permanece funcional.

Arquivos base para trabalhar
- backend/models.py
- backend/routes/auth_routes.py
- backend/routes/os_routes.py
- backend/utils/auditoria.py
- backend/migrations
- backend/tests
