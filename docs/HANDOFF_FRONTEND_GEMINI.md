## Handoff Frontend - Gemini

Objetivo: implementar interface da detentora e painel de monitoramento do operador, integrando com as APIs backend.

Escopo obrigatorio
- "Empresa" = detentora.
- Portal da detentora com login proprio e area reservada.
- Aceite com assinatura desenhada em tela.
- Comentarios e revisoes por O.S. (sem SLA).
- Operador acompanha O.S. enviadas para aceite e assinatura.

Sprint 1 - Estrutura de telas e navegacao
1. Criar area da detentora com menu reduzido.
2. Reaproveitar layout e componentes existentes para consistencia visual.
3. Criar listagem inbox de O.S. da detentora com filtros por status.
4. Criar tela de detalhe da O.S. com historico basico de status.

Sprint 2 - Fluxos da detentora
1. Aceite com assinatura em canvas
1.1 Modal com assinatura desenhada.
1.2 Nome do responsavel e confirmacao de aceite.
1.3 Envio de payload para endpoint backend de aceite.
2. Comentarios e revisoes
2.1 Secao cronologica de comentarios.
2.2 Acao de sugerir revisao.
2.3 Feedback visual de sucesso/erro.
3. Execucao da O.S.
3.1 Acoes para avancar status permitido (em_execucao e executada).
3.2 Badges de status atualizadas em tempo real.

Sprint 3 - Painel do operador
1. Adicionar secao no dashboard interno para monitoramento de aceite.
2. Exibir tabela/funil com colunas: enviada, pendente_assinatura, assinada, em_execucao, executada.
3. Filtros por modulo, grupo/lote e periodo.
4. Acesso rapido para abrir O.S. e verificar evidencia de assinatura.

Sprint 4 - Qualidade de UX
1. Tratar estados de carregamento, vazio e erro.
2. Garantir responsividade desktop/mobile.
3. Padronizar labels e mensagens de status.
4. Ajustes finais de acessibilidade basica e navegacao.

Criterios de aceite frontend
1. Detentora consegue visualizar O.S. recebidas e assinar aceite.
2. Detentora consegue comentar e solicitar revisao.
3. Operador consegue monitorar claramente pendencias de assinatura.
4. Navegacao e componentes existentes nao regressam.

Arquivos base para trabalhar
- backend/templates/layout_parts.html
- backend/templates/index.html
- backend/templates/dashboard.html
- backend/static/js/ordens-servico.js
- backend/static/js/dashboard.js
- backend/static/css/styles.css
- backend/static/css/layout.css
