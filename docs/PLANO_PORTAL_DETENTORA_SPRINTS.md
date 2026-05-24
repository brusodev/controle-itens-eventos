## Plan: Portal da Detentora para O.S.

Criar um portal autenticado por detentora para receber O.S., registrar aceite com assinatura digital em tela, permitir comentarios/revisoes e acompanhar execucao por status, preservando compatibilidade com o fluxo atual de emissao/edicao e auditoria.

**Steps**
1. Fase 1 - Modelo de dados e compatibilidade base
1.1 Adicionar suporte a conta de empresa no modelo de usuario com vinculo obrigatorio a detentora para perfil empresa e mantendo admin/comum existentes sem quebra.
1.2 Adicionar ciclo de status da O.S. com estados minimos: emitida, enviada_empresa, em_revisao, aceita, em_execucao, executada, recusada.
1.3 Criar entidades de colaboracao por O.S.: comentario_empresa (thread simples), revisao_empresa (solicitacao de ajuste), aceite_empresa (snapshot de assinatura e metadados).
1.4 Adicionar tabela de assinatura da empresa (imagem/base64 ou caminho de arquivo) e metadados de integridade: data/hora, IP, user-agent, hash do payload de aceite.
1.5 Criar migration incremental preservando dados legados: O.S. atuais entram como emitida; usuarios atuais permanecem com acesso atual.

2. Fase 2 - Autenticacao e autorizacao por detentora
2.1 Criar perfil de acesso empresa com login unico por empresa (1 usuario principal por detentora).
2.2 Estender sessao para incluir contexto de empresa autenticada (empresa_id/detentora_id, tipo_conta).
2.3 Criar decorators novos de autorizacao: empresa_requerido e admin_ou_empresa_requerido.
2.4 Aplicar isolamento de dados nas rotas de O.S. para contas empresa: so visualizar O.S. vinculadas a detentora da sessao e somente grupos/modulos associados.
2.5 Manter rotas atuais de admin/comum sem alteracao de contrato da API para evitar regressao no front existente.

3. Fase 3 - APIs do portal da detentora
3.1 Criar endpoint de caixa de entrada da empresa com filtros por status: recebidas, assinadas, em execucao, executadas, recusadas.
3.2 Criar endpoint de aceite com assinatura digital em tela, validando transicao de status enviada_empresa -> aceita.
3.3 Criar endpoint de revisao para empresa sugerir ajustes sem bloquear execucao automaticamente (regra definida pelo usuario).
3.4 Criar endpoint de comentarios/perguntas por O.S. (sem SLA), com historico simples cronologico.
3.5 Criar endpoint de atualizacao de execucao pela empresa: aceita -> em_execucao -> executada.
3.6 Registrar tudo em auditoria (CREATE/UPDATE) com antes/depois e vinculo da O.S.
3.7 Criar endpoint de monitoramento para operador listar O.S. enviadas para aceite com visao consolidada: enviada, pendente de assinatura, assinada (aceita), em execucao e executada.

4. Fase 4 - Interface do portal da empresa
4.1 Criar tela dedicada do portal da empresa com menu reduzido e foco em O.S. recebidas e historico.
4.2 Reaproveitar componentes de listagem/visualizacao de O.S. ja existentes e ocultar acoes internas (editar/deletar).
4.3 Implementar modal de assinatura com canvas (assinatura desenhada), nome do responsavel e confirmacao de aceite.
4.4 Implementar secao de comentarios e revisao dentro da visualizacao da O.S.
4.5 Implementar indicadores visuais por status e filtros rapidos (recebidas, assinadas, executadas).
4.6 Implementar painel do operador para monitorar O.S. enviadas para aceite e confirmar se houve assinatura/aceite da detentora.

5. Fase 5 - Governanca, seguranca e observabilidade
5.1 Adicionar validacoes de maquina de estados para impedir transicoes invalidas.
5.2 Impedir edicao estrutural da O.S. por empresa contratada (empresa so aceita/comenta/revisa/executa).
5.3 Salvar evidencia de aceite com trilha de auditoria para suporte juridico-operacional.
5.4 Revisar protecao de sessao e CSRF conforme padrao ja usado no projeto.

6. Fase 6 - Testes e rollout
6.1 Criar testes de backend para autenticacao empresa, isolamento por detentora, status transitions, assinatura e comentarios.
6.2 Criar testes de regressao do fluxo atual de O.S. para admin/comum.
6.3 Validar manualmente cenarios ponta a ponta com duas empresas distintas para confirmar isolamento.
6.4 Preparar rollout por feature flag simples (habilitar portal empresa sem substituir fluxo atual).

**Dependencias e paralelismo**
1. Fase 1 bloqueia Fase 2 e Fase 3.
2. Fase 2 bloqueia publicacao da Fase 4.
3. Fase 3 e Fase 4 podem avancar parcialmente em paralelo apos contratos de API definidos.
4. Fase 5 ocorre em paralelo com Fase 3 e Fase 4, finalizando antes da Fase 6.
5. Fase 6 depende de todas as fases anteriores concluidas.

**Sprint Breakdown**
1. Sprint 1 - Fundacao de dados e seguranca de acesso (1 semana)
1.1 Entregas: migration de status da O.S., vinculo de usuario a detentora, modelo de aceite/revisao/comentario, decorators de autorizacao por detentora.
1.2 Criterio de aceite: detentora autenticada so enxerga O.S. da propria detentora; transicoes de status basicas funcionando via API.
1.3 Risco principal: regressao no fluxo atual de login e listagem. Mitigacao: manter endpoints atuais intactos e cobrir com testes de regressao.

2. Sprint 2 - Portal da detentora e aceite com assinatura (1 semana)
2.1 Entregas: tela de inbox da detentora, detalhe da O.S., aceite com assinatura em canvas, comentarios e revisoes sem SLA.
2.2 Criterio de aceite: detentora consegue abrir O.S. recebida, assinar aceite e registrar comentario/revisao; status refletido no backend.
2.3 Risco principal: usabilidade da assinatura e qualidade da evidencia. Mitigacao: salvar metadados (data/hora, IP, hash) e validar fluxo em homologacao.

3. Sprint 3 - Painel do operador para monitoramento (1 semana)
3.1 Entregas: dashboard interno com filtros e tabela de acompanhamento das O.S. enviadas para aceite (pendente, assinada, em execucao, executada).
3.2 Criterio de aceite: operador visualiza rapidamente o funil de aceite e identifica quais O.S. ainda aguardam assinatura.
3.3 Risco principal: divergencia entre estados backend e exibicao. Mitigacao: consumir endpoint unico de monitoramento e padronizar labels de status.

4. Sprint 4 - Hardening, auditoria e rollout controlado (1 semana)
4.1 Entregas: testes automatizados finais, ajustes de seguranca (sessao/CSRF), auditoria completa, feature flag de ativacao.
4.2 Criterio de aceite: regressao zero no fluxo atual, trilha de auditoria completa para aceite/revisao/execucao, release habilitavel por configuracao.
4.3 Risco principal: falhas em cenarios de borda multi-modulo/grupo. Mitigacao: bateria de testes manuais com duas detentoras e multiplos modulos.

**Relevant files**
- backend/models.py - estender Usuario e OrdemServico; adicionar novos modelos de aceite/revisao/comentario.
- backend/routes/auth_routes.py - login de empresa, sessao com contexto de detentora e novos decorators.
- backend/routes/os_routes.py - filtros por empresa, endpoints de aceite/revisao/comentarios/execucao e state machine.
- backend/utils/auditoria.py - eventos especificos de aceite/revisao/comentario/execucao.
- backend/templates/layout_parts.html - menu especifico para perfil empresa.
- backend/templates/index.html - reaproveitar padroes de modal/listagem e adaptar area da empresa.
- backend/static/js/ordens-servico.js - reutilizar visualizacao e criar acoes de aceite, revisao e execucao.
- backend/static/js/dashboard.js - adicionar visao do operador para monitoramento de envio e assinatura de aceite.
- backend/templates/dashboard.html - incluir secao/tabela de monitoramento das O.S. enviadas para detentoras.
- backend/migrations - migrations para novos campos e tabelas.
- backend/tests - novos testes de portal empresa e regressao do fluxo atual.

**Verification**
1. Teste autenticacao: login admin/comum continua funcional e login empresa acessa somente portal da sua detentora.
2. Teste isolamento: empresa A nao consegue listar/consultar O.S. da empresa B.
3. Teste aceite com assinatura: status muda para aceita e evidencia fica persistida (imagem/hash/data/ip).
4. Teste revisao/comentarios: empresa cria revisao e comentario; historico aparece em ordem cronologica.
5. Teste execucao: empresa altera para em_execucao e depois executada; auditoria registra transicoes.
6. Teste operador: painel interno mostra corretamente O.S. enviadas para aceite, pendentes de assinatura e assinadas.
7. Teste regressao admin: emissao, edicao e geracao de PDF continuam funcionando para perfis internos.
8. Teste seguranca: tentativa de transicao invalida retorna erro 400/403 conforme regra.

**Decisions**
- Neste escopo, "empresa" e "empresa contratada" sao termos equivalentes a "detentora".
- Assinatura de aceite sera digital desenhada na tela (canvas).
- Revisao da detentora nao bloqueara execucao automaticamente; fluxo permanece flexivel.
- Perguntas serao tratadas como comentarios internos sem SLA.
- Acesso da contratada (detentora) sera por login unico por detentora.
- O operador interno mantera painel de monitoramento das O.S. enviadas para aceite, com visao de pendente/assinada/executada.
- A mesma detentora pode receber O.S. de multiplos grupos/lotes e multiplos modulos de servico.

**Scope boundaries**
- Incluido: portal autenticado de detentora, aceite assinado, revisao, comentarios e acompanhamento de execucao.
- Excluido neste ciclo: mensageria externa (email/WhatsApp), SLA automatizado, assinatura ICP-Brasil, upload de anexos complexos com workflow documental.

**Further Considerations**
1. Assinatura com armazenamento em banco (base64) ou em arquivo local protegido. Recomendacao: arquivo protegido + hash no banco para melhor desempenho.
2. Notificacao de nova O.S. para empresa: sem notificacao agora ou com aviso no painel interno. Recomendacao: iniciar com aviso no painel e evoluir depois.
3. Possivel futura evolucao para multiplos usuarios por empresa. Recomendacao: manter esquema preparado, mas entregar login unico neste ciclo.
