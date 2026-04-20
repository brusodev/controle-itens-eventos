// ========================================
// MÓDULO: ORDENS-SERVICO - Gestão de O.S. Emitidas
// ========================================

async function renderizarOrdensServico() {
    console.log('📞 renderizarOrdensServico chamada - Buscando do banco...');
    await filtrarOS();
    console.log('✅ renderizarOrdensServico concluída');
}

async function filtrarOS() {
    const container = document.getElementById('lista-ordens-servico');
    const busca = document.getElementById('filtro-os').value.toLowerCase();

    container.innerHTML = '<p class="empty-message">Carregando...</p>';

    try {
        // ✅ SEMPRE buscar direto da API - SEM CACHE
        console.log('🔄 filtrarOS: Buscando da API...');
        const ordensServico = await APIClient.listarOrdensServico(busca);
        console.log('📡 filtrarOS: API retornou', ordensServico.length, 'O.S.');
        console.log('📋 filtrarOS: Dados completos:', ordensServico);

        if (ordensServico.length > 0) {
            console.log('📝 filtrarOS: Primeira O.S. - Evento:', ordensServico[0].evento);
        }

        console.log('🗑️ Limpando container de O.S...');
        container.innerHTML = '';
        console.log('✅ Container limpo! Criando novos cards...');

        if (ordensServico.length === 0) {
            container.innerHTML = '<p class="empty-message">🧹Nenhuma Ordem de Serviço encontrada.</p>';
            return;
        }

        ordensServico.forEach(os => {
            console.log(`🎴 Criando card para O.S. ${os.id} - Evento: "${os.evento}"`);
            const card = document.createElement('div');
            card.className = 'item-card os-card';

            const statusLabels = {
                'emitida': { texto: 'Emitida', cor: '#1565c0', bg: '#e3f2fd' },
                'enviada_empresa': { texto: 'Aguardando Empresa', cor: '#e65100', bg: '#fff3e0' },
                'em_revisao': { texto: 'Em Revisão', cor: '#c62828', bg: '#fce4ec' },
                'aceita': { texto: 'Aceita', cor: '#2e7d32', bg: '#e8f5e9' },
                'em_execucao': { texto: 'Em Execução', cor: '#283593', bg: '#e8eaf6' },
                'executada': { texto: 'Executada', cor: '#6a1b9a', bg: '#f3e5f5' },
                'recusada': { texto: 'Recusada', cor: '#b71c1c', bg: '#ffebee' },
            };
            const statusOS = os.status || 'emitida';
            const statusCfg = statusLabels[statusOS] || { texto: statusOS, cor: '#555', bg: '#eee' };
            const badgeStatus = `<span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:0.75rem;font-weight:600;background:${statusCfg.bg};color:${statusCfg.cor}">${statusCfg.texto}</span>`;

            card.innerHTML = `
                <div class="item-header">
                    <span class="item-categoria">O.S. ${os.numeroOS}</span>
                    ${badgeStatus}
                </div>
                <div class="item-body os-card-body">
                    <h3>${os.evento || 'Sem título'}</h3>
                    <p><strong>Detentora:</strong> ${os.detentora || 'N/A'}</p>
                    <p><strong>Data do Evento:</strong> ${os.data || 'N/A'}</p>
                    <p><strong>Emitida em:</strong> ${new Date(os.dataEmissao).toLocaleDateString('pt-BR')}</p>
                    <p><strong>Itens:</strong> ${os.itens ? os.itens.length : 0}</p>
                </div>
                <div class="item-footer os-card-footer">
                    <button class="btn-small btn-primary" onclick="visualizarOSEmitida(${os.id})">👁️ Visualizar</button>
                    ${statusOS === 'emitida' ? `<button class="btn-small btn-warning" onclick="editarOS(${os.id})">✏️ Editar</button>` : ''}
                    <button class="btn-small btn-success" onclick="imprimirOS(${os.id})">🖨️ Imprimir</button>
                    <button class="btn-small btn-secondary" onclick="baixarPDFTextoSelecionavel(${os.id})">📄 PDF</button>
                    ${usuarioPerfil === 'admin' && statusOS === 'emitida' ? `<button class="btn-small btn-danger" onclick="excluirOS(${os.id}, '${os.numeroOS}')">🗑️ Excluir</button>` : ''}
                    ${usuarioPerfil === 'admin' && statusOS === 'emitida' ? `<button class="btn-small" style="background:#7b1fa2;color:#fff" onclick="enviarParaEmpresa(${os.id}, ${os.detentora_id || 'null'}, '${(os.detentora || '').replace(/'/g, "\\'")}')">📤 Enviar para Empresa</button>` : ''}
                    ${usuarioPerfil === 'admin' && statusOS === 'em_revisao' ? `<button class="btn-small" style="background:#7b1fa2;color:#fff" onclick="reenviarParaEmpresa(${os.id})">🔄 Reenviar para Empresa</button>` : ''}
                    ${usuarioPerfil === 'admin' && statusOS !== 'emitida' ? `<button class="btn-small" style="background:#00695c;color:#fff" onclick="verAtividadePortal(${os.id})">💬 Atividade</button>` : ''}
                    ${(usuarioPerfil === 'admin' || usuarioPerfil === 'comum') && !['cancelada','executada','recusada'].includes(statusOS) ? `<button class="btn-small" style="background:#1565c0;color:#fff" onclick="abrirModalAssinarInterno(${os.id})">✍️ Assinar</button>` : ''}
                    ${usuarioPerfil === 'admin' && ['aceita','em_execucao'].includes(statusOS) ? `<button class="btn-small btn-danger" onclick="cancelarOS(${os.id}, '${os.numeroOS}')">🚫 Cancelar</button>` : ''}
                </div>
            `;

            container.appendChild(card);

            // Destacar visualmente o card recém-atualizado
            if (os.id === 1) {  // Se for a O.S. que você está editando
                card.style.border = '3px solid #00ff00';
                card.style.boxShadow = '0 0 20px rgba(0,255,0,0.5)';
                setTimeout(() => {
                    card.style.border = '';
                    card.style.boxShadow = '';
                }, 3000);
            }
        });

        console.log(`✅ ${ordensServico.length} cards criados e adicionados ao container!`);
        console.log('📊 Container agora tem', container.children.length, 'elementos');

    } catch (error) {
        console.error('❌ Erro ao carregar O.S.:', error);
        container.innerHTML = '<p class="error-message">Erro ao carregar ordens de serviço. Verifique se o backend está rodando.</p>';
    }
}

// ========================================
// CARREGAMENTO DE SUGESTÕES PARA DATALIST
// ========================================

async function carregarSugestoesOS() {
    try {
        console.log('📥 Carregando sugestões para datalist...');

        // Buscar todas as O.S. do banco
        const ordensServico = await APIClient.listarOrdensServico();

        if (!ordensServico || ordensServico.length === 0) {
            console.log('⚠️ Nenhuma O.S. encontrada para sugestões');
            return;
        }

        // Extrair dados únicos de cada campo
        const eventos = new Set();
        const datas = new Set();
        const horarios = new Set();
        const locais = new Set();
        const responsaveis = new Set();
        const justificativas = new Set();
        const observacoes = new Set();
        const gestores = new Set();
        const fiscais = new Set();
        const nomesSignatarios = new Set();

        ordensServico.forEach(os => {
            if (os.evento) eventos.add(os.evento);
            if (os.data) datas.add(os.data);
            if (os.horario) horarios.add(os.horario);
            if (os.local) locais.add(os.local);
            if (os.responsavel) responsaveis.add(os.responsavel);
            if (os.justificativa) justificativas.add(os.justificativa);
            if (os.observacoes) observacoes.add(os.observacoes);
            if (os.gestorContrato) gestores.add(os.gestorContrato);
            if (os.fiscalContrato) fiscais.add(os.fiscalContrato);
            // Coletar nomes de signatários para autocomplete
            if (os.signatarios && Array.isArray(os.signatarios)) {
                os.signatarios.forEach(sig => {
                    if (sig.nome) nomesSignatarios.add(sig.nome);
                });
            }
        });

        // Armazenar como arrays
        sugestoesOS.eventos = Array.from(eventos).sort();
        sugestoesOS.datas = Array.from(datas).sort();
        sugestoesOS.horarios = Array.from(horarios).sort();
        sugestoesOS.locais = Array.from(locais).sort();
        sugestoesOS.responsaveis = Array.from(responsaveis).sort();
        sugestoesOS.justificativas = Array.from(justificativas).sort();
        sugestoesOS.observacoes = Array.from(observacoes).sort();
        sugestoesOS.gestores = Array.from(gestores).sort();
        sugestoesOS.fiscais = Array.from(fiscais).sort();

        // Carregar nos datalist
        preencherDatalist('lista-eventos', sugestoesOS.eventos);
        preencherDatalist('lista-datas', sugestoesOS.datas);
        preencherDatalist('lista-horarios', sugestoesOS.horarios);
        preencherDatalist('lista-locais', sugestoesOS.locais);
        preencherDatalist('lista-responsaveis', sugestoesOS.responsaveis);
        preencherDatalist('lista-justificativas', sugestoesOS.justificativas);
        preencherDatalist('lista-observacoes', sugestoesOS.observacoes);
        preencherDatalist('lista-gestores', sugestoesOS.gestores);
        preencherDatalist('lista-fiscais', sugestoesOS.fiscais);
        preencherDatalist('lista-nomes-signatario', Array.from(nomesSignatarios).sort());

        console.log('✅ Sugestões carregadas com sucesso');
        console.log('📊 Resumo:');
        console.log('   - Eventos:', sugestoesOS.eventos.length);
        console.log('   - Datas:', sugestoesOS.datas.length);
        console.log('   - Horários:', sugestoesOS.horarios.length);
        console.log('   - Locais:', sugestoesOS.locais.length);
        console.log('   - Responsáveis:', sugestoesOS.responsaveis.length);
        console.log('   - Justificativas:', sugestoesOS.justificativas.length);
        console.log('   - Observações:', sugestoesOS.observacoes.length);
        console.log('   - Gestores:', sugestoesOS.gestores.length);
        console.log('   - Fiscais:', sugestoesOS.fiscais.length);

    } catch (error) {
        console.error('❌ Erro ao carregar sugestões:', error);
    }
}

// Função auxiliar para preencher datalist
function preencherDatalist(datalistId, valores) {
    const datalist = document.getElementById(datalistId);
    if (!datalist) {
        console.warn('⚠️ Datalist não encontrado:', datalistId);
        return;
    }

    datalist.innerHTML = '';
    valores.forEach(valor => {
        const option = document.createElement('option');
        option.value = valor;
        datalist.appendChild(option);
    });
}

function normalizarDadosOS(os) {
    // Função para formatar data ISO para pt-BR
    const formatarDataLocal = (dataISO) => {
        if (!dataISO) return '';
        try {
            const data = new Date(dataISO);
            return data.toLocaleDateString('pt-BR');
        } catch {
            return dataISO; // Se falhar, retorna original
        }
    };

    // Normaliza os dados da O.S. para o formato esperado pelo preview
    return {
        modulo: os.modulo || localStorage.getItem('modulo_atual') || 'coffee',
        numeroOS: os.numeroOS,
        contratoNum: os.contrato || os.contratoNum || '',
        dataAssinatura: os.dataAssinatura ? formatarDataSimples(os.dataAssinatura) : '',
        prazoVigencia: os.prazoVigencia || '',
        detentora: os.detentora || '',
        cnpj: os.cnpj || '',
        servico: os.servico || 'COFFEE BREAK',
        grupo: os.grupo || '',
        evento: os.evento || '',
        dataEvento: os.data || os.dataEvento || '',
        horario: os.horario || '',
        local: os.local || '',
        responsavel: os.responsavel || '',
        justificativa: os.justificativa || '',
        observacoes: os.observacoes || '',
        gestor: os.gestorContrato || os.gestor || '',
        fiscal: os.fiscalContrato || os.fiscal || '',
        fiscalTipo: os.fiscalTipo || 'Fiscal do Contrato',
        signatarios: os.signatarios || [],
        // Formatar data de emissão corretamente
        dataEmissao: os.dataEmissaoCompleta ? formatarDataLocal(os.dataEmissaoCompleta) : (os.dataEmissao ? formatarDataLocal(os.dataEmissao) : new Date().toLocaleDateString('pt-BR')),
        itens: (os.itens || []).map((item, index) => ({
            num: item.num || index + 1,
            descricao: item.descricao,
            itemBec: item.itemBec || '',
            diarias: item.diarias || 1,
            qtdSolicitada: item.qtdSolicitada || item.qtdTotal,
            qtdTotal: item.qtdTotal,
            valorUnit: parseFloat((item.valorUnit || '0').toString().replace(',', '.')) || 0,  // ✅ Converter string para número
            unidade: item.unidade
        }))
    };
}

async function visualizarOSEmitida(osId) {
    try {
        console.log('🔍 visualizarOSEmitida chamado com ID:', osId);
        console.log('📡 Buscando dados ATUALIZADOS da API...');

        // Buscar dados atualizados da API
        const os = await APIClient.obterOrdemServico(osId);
        console.log('📡 Dados recebidos da API:', os);
        console.log('📋 Campos importantes da API:');
        console.log('   - Evento:', os.evento);
        console.log('   - Data:', os.data);
        console.log('   - Horário:', os.horario);
        console.log('   - Local:', os.local);
        console.log('   - Responsável:', os.responsavel);
        console.log('   - Justificativa:', os.justificativa?.substring(0, 60) + '...');

        if (!os) {
            alert('Ordem de Serviço não encontrada.');
            return;
        }

        const dadosNormalizados = normalizarDadosOS(os);
        console.log('🔄 Dados normalizados:', dadosNormalizados);
        console.log('✅ Responsável normalizado:', dadosNormalizados.responsavel);

        const preview = gerarPreviewOS(dadosNormalizados);
        console.log('✅ Preview HTML gerado - tamanho:', preview.length, 'caracteres');
        console.log('✅ Preview contém responsável?', preview.includes('RESPONSÁVEL:'));

        document.getElementById('preview-os').innerHTML = preview;
        console.log('✅ Preview inserido no DOM');

        // Mudar os botões do modal para incluir imprimir e PDF
        const modalButtons = document.querySelector('#modal-visualizar-os .modal-content > div:last-child');
        modalButtons.innerHTML = `
            <button class="btn-small btn-success" onclick="imprimirOS(${osId})">🖨️ Imprimir</button>
            <button class="btn-small btn-primary" onclick="baixarPDFTextoSelecionavel(${osId})">📥 Baixar PDF</button>
            <button class="btn-small btn-secondary" onclick="fecharModalVisualizarOS()">❌ Fechar</button>
        `;

        document.getElementById('modal-visualizar-os').style.display = 'flex';
        console.log('✅ Modal aberto');
    } catch (error) {
        console.error('❌ Erro ao visualizar O.S.:', error);
        alert('Erro ao carregar dados da O.S.');
    }
}

// Função para imprimir O.S. (usa o mesmo PDF do backend)
async function imprimirOS(osId) {
    try {
        console.log('🖨️ Abrindo PDF para impressão - O.S. ID:', osId);

        // Buscar O.S. para obter numeroOS
        const os = await APIClient.obterOrdemServico(osId);
        if (!os) {
            alert('Ordem de Serviço não encontrada.');
            return;
        }

        // Abrir PDF em nova janela com parâmetro print=true (abre inline ao invés de baixar)
        const url = `/api/ordens-servico/${osId}/pdf?print=true`;
        console.log('📄 Abrindo URL:', url);

        // Abrir em nova janela para permitir impressão
        const printWindow = window.open(url, '_blank', 'width=1000,height=800');

        if (!printWindow) {
            alert('Por favor, permita pop-ups para imprimir a O.S.');
            return;
        }

        // Aguardar o PDF carregar e abrir automaticamente a janela de impressão
        printWindow.onload = function() {
            // Pequeno delay para garantir que o PDF foi totalmente carregado
            setTimeout(() => {
                printWindow.print();
            }, 1000);
        };

        console.log('✅ Janela de impressão aberta');

    } catch (error) {
        console.error('❌ Erro ao abrir PDF para impressão:', error);
        alert('Erro ao carregar PDF: ' + error.message);
    }
}

// Função para baixar PDF com texto selecionável (novo método)
async function baixarPDFTextoSelecionavel(osId) {
    try {
        console.log('📄 Baixando PDF (texto selecionável) para O.S. ID:', osId);

        // Buscar O.S. para obter numeroOS
        const os = await APIClient.obterOrdemServico(osId);
        if (!os) {
            alert('Ordem de Serviço não encontrada.');
            return;
        }

        // Mostrar mensagem de processamento
        const btn = event && event.target ? event.target : null;
        let btnText = '';
        if (btn) {
            btnText = btn.innerHTML;
            btn.innerHTML = '⏳ Gerando PDF...';
            btn.disabled = true;
        }

        try {
            // Baixar PDF com texto selecionável do backend (ReportLab)
            console.log('🚀 Gerando PDF real (texto selecionável) via backend...');
            const response = await fetch(`/api/ordens-servico/${osId}/pdf`);

            if (!response.ok) {
                throw new Error(`Erro ao gerar PDF: ${response.statusText}`);
            }

            // Converter resposta para blob
            const blob = await response.blob();

            // Criar link de download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `OS_${os.numeroOS.replace('/', '-')}.pdf`;
            document.body.appendChild(a);
            a.click();

            // Limpar
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            console.log('✅ PDF com texto selecionável baixado com sucesso!');
            alert('✅ PDF gerado com sucesso!\n\nEste PDF contém texto selecionável e pode ser convertido para Excel facilmente.');

        } catch (error) {
            console.error('❌ Erro ao gerar PDF via backend:', error);
            alert(`Erro ao gerar PDF: ${error.message}`);
        }

        // Restaurar botão
        if (btn) {
            btn.innerHTML = btnText;
            btn.disabled = false;
        }

    } catch (error) {
        console.error('❌ Erro ao baixar PDF:', error);
        alert('Erro ao gerar PDF da O.S.');
    }
}

// ========================================
// EXCLUIR ORDEM DE SERVIÇO (APENAS ADMIN)
// ========================================

async function excluirOS(osId, numeroOS) {
    // Verificar se é admin
    if (usuarioPerfil !== 'admin') {
        alert('❌ Apenas administradores podem excluir Ordens de Serviço.');
        return;
    }

    // Confirmação dupla
    if (!confirm(`⚠️ ATENÇÃO!\n\nDeseja realmente EXCLUIR a O.S. ${numeroOS}?\n\nEsta ação:\n- NÃO pode ser desfeita\n- Reverterá automaticamente o estoque\n- Removerá todos os dados da O.S.\n\nTem certeza?`)) {
        return;
    }

    if (!confirm(`🚨 CONFIRMAÇÃO FINAL\n\nTem ABSOLUTA CERTEZA que deseja excluir a O.S. ${numeroOS}?\n\nClique OK para CONFIRMAR a exclusão.`)) {
        return;
    }

    // ✅ Pedir motivo da exclusão
    const motivo = prompt(`📝 MOTIVO DA EXCLUSÃO\n\nDigite o motivo pelo qual está excluindo a O.S. ${numeroOS}:\n\n(Este motivo será registrado na auditoria)`, '').trim();

    if (!motivo) {
        alert('❌ O motivo da exclusão é obrigatório!');
        return;
    }

    try {
        console.log(`🗑️ Excluindo O.S. ${numeroOS} (ID: ${osId})...`);
        console.log(`📝 Motivo: ${motivo}`);

        // Chamar API para deletar com motivo
        await APIClient.deletarOrdemServico(osId, motivo);

        console.log('✅ O.S. excluída com sucesso!');
        alert(`✅ O.S. ${numeroOS} excluída com sucesso!\n\nMotivo registrado: ${motivo}\nO estoque foi revertido automaticamente.`);

        // Recarregar listas
        await renderizarAlimentacao();
        await renderizarOrdensServico();

    } catch (error) {
        console.error('❌ Erro ao excluir O.S.:', error);
        alert(`❌ Erro ao excluir O.S.: ${error.message}`);
    }
}

// Função para baixar PDF da O.S.
async function baixarPDFOS(osId) {
    try {
        console.log('🔍 Gerando PDF do modal visível para O.S. ID:', osId);

        // Buscar O.S. para obter numeroOS
        const os = await APIClient.obterOrdemServico(osId);
        if (!os) {
            alert('Ordem de Serviço não encontrada.');
            return;
        }

        console.log('📋 Dados da API - Evento:', os.evento);
        console.log('📋 Dados da API - Justificativa:', os.justificativa?.substring(0, 50) + '...');

        // Mostrar mensagem de processamento
        const btn = event && event.target ? event.target : null;
        let btnText = '';
        if (btn) {
            btnText = btn.innerHTML;
            btn.innerHTML = '⏳ Gerando PDF...';
            btn.disabled = true;
        }

        // PEGAR HTML DO MODAL (que já está correto e atualizado!)
        const modalContent = document.getElementById('preview-os');

        if (!modalContent || !modalContent.innerHTML.trim()) {
            alert('Nenhuma visualização aberta. Abra a visualização primeiro clicando em "Visualizar".');
            if (btn) {
                btn.innerHTML = btnText;
                btn.disabled = false;
            }
            return;
        }

        console.log('✅ Usando HTML do modal (já renderizado corretamente)');

        // Criar elemento temporário com o MESMO conteúdo do modal
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '210mm'; // Largura A4
        tempDiv.innerHTML = modalContent.innerHTML;  // ← COPIA EXATAMENTE DO MODAL
        document.body.appendChild(tempDiv);

        // Buscar o elemento do documento (pode ser .os-preview OU .os-document)
        let previewElement = tempDiv.querySelector('.os-preview');
        if (!previewElement) {
            previewElement = tempDiv.querySelector('.os-document');
        }

        if (!previewElement) {
            console.error('❌ Elemento .os-preview ou .os-document não encontrado no modal');
            console.error('HTML do modal:', modalContent.innerHTML.substring(0, 500));
            alert('Erro ao preparar visualização para PDF');
            document.body.removeChild(tempDiv);
            if (btn) {
                btn.innerHTML = btnText;
                btn.disabled = false;
            }
            return;
        }

        console.log('📄 Elemento encontrado:', previewElement.className);

        // Aguardar DOM atualizar completamente
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('📸 Capturando imagem do HTML...');

        // Converter para canvas usando html2canvas
        const canvas = await html2canvas(previewElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: previewElement.scrollWidth,
            windowHeight: previewElement.scrollHeight
        });

        console.log('✅ Canvas gerado com sucesso');

        // Remover elemento temporário
        document.body.removeChild(tempDiv);

        console.log('📄 Criando PDF...');

        // Criar PDF usando jsPDF
        const { jsPDF } = window.jspdf;

        // Dimensões A4 em mm
        const pdfWidth = 210;
        const pdfHeight = 297;

        // Calcular dimensões da imagem
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        const pdf = new jsPDF('p', 'mm', 'a4');

        // Dividir em múltiplas páginas se necessário
        let heightLeft = imgHeight;
        let position = 0;

        // Adicionar primeira página
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Adicionar páginas adicionais se necessário
        while (heightLeft > 0) {
            position = -pdfHeight * Math.ceil((imgHeight - heightLeft) / pdfHeight);
            pdf.addPage();
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        // Salvar o PDF
        console.log('💾 Salvando PDF como: OS_' + os.numeroOS + '.pdf');
        pdf.save(`OS_${os.numeroOS}.pdf`);
        console.log('✅ PDF gerado e baixado com sucesso!');

        // Restaurar botão
        if (btn) {
            btn.innerHTML = btnText;
            btn.disabled = false;
        }

    } catch (error) {
        console.error('❌ Erro ao gerar PDF:', error);
        console.error('Stack trace:', error.stack);
        alert('Erro ao gerar PDF: ' + error.message);

        // Restaurar botão em caso de erro
        if (event && event.target) {
            event.target.innerHTML = '📥 Baixar PDF';
            event.target.disabled = false;
        }
    }
}

// Função para editar uma O.S.
async function editarOS(osId) {
    try {
        // Buscar dados atualizados da API
        const os = await APIClient.obterOrdemServico(osId);
        if (!os) {
            alert('Ordem de Serviço não encontrada.');
            return;
        }

        // Armazenar ID da O.S. sendo editada
        localStorage.setItem('osEditandoId', osId);

        // Navegar para a página de edição/emissão de O.S.
        window.location.href = '/emitir-os';

        // Função auxiliar para converter data pt-BR para formato input date (YYYY-MM-DD)
        const converterDataParaInput = (dataBR) => {
            if (!dataBR) return '';
            try {
                // Se já está no formato YYYY-MM-DD, retorna direto
                if (dataBR.match(/^\d{4}-\d{2}-\d{2}$/)) return dataBR;

                // Converter de DD/MM/YYYY para YYYY-MM-DD
                const partes = dataBR.split('/');
                if (partes.length === 3) {
                    const [dia, mes, ano] = partes;
                    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
                }
            } catch (e) {
                console.error('Erro ao converter data:', e);
            }
            return dataBR;
        };

        // Preencher campos do formulário
        document.getElementById('os-contrato-num').value = os.contrato || '';
        document.getElementById('os-data-assinatura').value = converterDataParaInput(os.dataAssinatura);
        document.getElementById('os-prazo-vigencia').value = os.prazoVigencia || '';
        document.getElementById('os-detentora').value = os.detentora || '';
        document.getElementById('os-cnpj').value = os.cnpj || '';
        document.getElementById('os-servico').value = os.servico || 'COFFEE BREAK';
        document.getElementById('os-grupo').value = os.grupo || '';
        document.getElementById('os-evento').value = os.evento || '';
        document.getElementById('os-data-evento').value = converterDataParaInput(os.data);
        document.getElementById('os-horario').value = os.horario || '';
        document.getElementById('os-local').value = os.local || '';
        document.getElementById('os-justificativa').value = os.justificativa || '';
        document.getElementById('os-observacoes').value = os.observacoes || '';
        document.getElementById('os-responsavel').value = os.responsavel || '';

        // Carregar signatários dinâmicos
        if (os.signatarios && os.signatarios.length > 0) {
            signatariosOS = os.signatarios.map(s => ({ cargo: s.cargo || '', nome: s.nome || '' }));
        } else {
            // Fallback para campos legados
            signatariosOS = [
                { cargo: 'Gestor do Contrato', nome: os.gestorContrato || '' },
                { cargo: os.fiscalTipo || 'Fiscal do Contrato', nome: os.fiscalContrato || '' }
            ];
        }
        renderizarSignatarios();

        // Limpar itens existentes e popular com os itens da O.S.
        itensOSSelecionados = [];

        if (os.itens && os.itens.length > 0) {
            for (const item of os.itens) {
                const diarias = item.diarias || 1;
                const qtdSolicitada = item.qtdSolicitada || item.quantidade_solicitada || (item.qtdTotal || item.quantidade_total || 0) / diarias;

                itensOSSelecionados.push({
                    categoria: item.categoria,
                    itemId: item.itemId,
                    descricao: item.descricao,
                    unidade: item.unidade || '',
                    itemBec: item.itemBec || '',
                    diarias: diarias,
                    qtdSolicitada: qtdSolicitada,
                    qtdTotal: diarias * qtdSolicitada
                });
            }
        }

        renderizarTabelaItensOS();

        // Substituir botões do formulário pelo padrão de edição
        const containerBotoes = document.getElementById('botoes-formulario-os');
        containerBotoes.innerHTML = `
            <button type="button" class="btn-small btn-primary" onclick="visualizarOS()">👁️ Visualizar</button>
            <button type="button" class="btn-small btn-success" onclick="salvarEFecharOS()">💾 Salvar e Fechar</button>
            <button type="button" class="btn-small btn-warning" onclick="salvarEContinuarOS()">💾 Salvar e Continuar</button>
            <button type="button" class="btn-small btn-danger" onclick="cancelarEdicaoOS()">❌ Cancelar</button>
        `;

        alert('✏️ Modo Edição ativado! Altere os campos necessários e use os botões para salvar ou cancelar.');

    } catch (error) {
        console.error('Erro ao carregar O.S. para edição:', error);
        alert('Erro ao carregar dados da O.S. para edição.');
    }
}

// Nova função: Restaurar O.S. para edição após navegação
async function restaurarOSParaEdicao() {
    try {
        const osIdParaEditar = localStorage.getItem('osEditandoId');
        console.log('🔍 restaurarOSParaEdicao: Verificando localStorage - osEditandoId:', osIdParaEditar);
        if (!osIdParaEditar) {
            console.log('⏭️ Sem O.S. para editar');
            return; // Sem O.S. para editar
        }

        // Remover do localStorage
        localStorage.removeItem('osEditandoId');
        console.log('✅ Removido osEditandoId do localStorage');

        // Aguardar um pouco para garantir que a página está pronta
        await new Promise(resolve => setTimeout(resolve, 200));

        // Verificar se estamos na página de emissão de O.S.
        const formOS = document.getElementById('form-emitir-os');
        console.log('🔍 Procurando form-emitir-os:', formOS ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
        if (!formOS) {
            console.log('⚠️ Formulário não encontrado, abortando restauração');
            return;
        }

        // Buscar dados da O.S.
        console.log('📡 Buscando O.S. com ID:', osIdParaEditar);
        const os = await APIClient.obterOrdemServico(parseInt(osIdParaEditar));
        console.log('📦 Dados da O.S. recebidos:', os);

        if (!os) {
            alert('Ordem de Serviço não encontrada.');
            console.error('❌ O.S. não encontrada na API');
            return;
        }

        // Definir que estamos editando (variável global)
        osEditandoId = parseInt(osIdParaEditar);
        console.log('✏️ Modo edição ativado para O.S.:', osEditandoId);

        // Função auxiliar para converter data pt-BR para formato input date (YYYY-MM-DD)
        const converterDataParaInput = (dataBR) => {
            if (!dataBR) return '';
            try {
                // Se já está no formato YYYY-MM-DD, retorna direto
                if (dataBR.match(/^\d{4}-\d{2}-\d{2}$/)) return dataBR;

                // Converter de DD/MM/YYYY para YYYY-MM-DD
                const partes = dataBR.split('/');
                if (partes.length === 3) {
                    const [dia, mes, ano] = partes;
                    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
                }
            } catch (e) {
                console.error('Erro ao converter data:', e);
            }
            return dataBR;
        };

        // Preencher campos do formulário

        // Preencher seletor de grupo primeiro (se existir)
        const grupoSelect = document.getElementById('os-grupo-select');
        if (grupoSelect && os.grupo) {
            grupoSelect.value = os.grupo;
            console.log('✅ Grupo selecionado na edição:', os.grupo);
        }

        document.getElementById('os-contrato-num').value = os.contrato || '';
        document.getElementById('os-data-assinatura').value = converterDataParaInput(os.dataAssinatura);
        document.getElementById('os-prazo-vigencia').value = os.prazoVigencia || '';
        document.getElementById('os-detentora').value = os.detentora || '';
        document.getElementById('os-cnpj').value = os.cnpj || '';
        document.getElementById('os-servico').value = os.servico || 'COFFEE BREAK';
        document.getElementById('os-grupo').value = os.grupo || '';
        document.getElementById('os-evento').value = os.evento || '';
        document.getElementById('os-data-evento').value = converterDataParaInput(os.data);
        document.getElementById('os-horario').value = os.horario || '';
        document.getElementById('os-local').value = os.local || '';
        document.getElementById('os-justificativa').value = os.justificativa || '';
        document.getElementById('os-observacoes').value = os.observacoes || '';
        document.getElementById('os-responsavel').value = os.responsavel || '';

        // Carregar signatários dinâmicos
        if (os.signatarios && os.signatarios.length > 0) {
            signatariosOS = os.signatarios.map(s => ({ cargo: s.cargo || '', nome: s.nome || '' }));
        } else {
            signatariosOS = [
                { cargo: 'Gestor do Contrato', nome: os.gestorContrato || '' },
                { cargo: os.fiscalTipo || 'Fiscal do Contrato', nome: os.fiscalContrato || '' }
            ];
        }
        renderizarSignatarios();

        // Limpar itens existentes e popular com os itens da O.S.
        itensOSSelecionados = [];

        if (os.itens && os.itens.length > 0) {
            for (const item of os.itens) {
                const diarias = item.diarias || 1;
                const qtdSolicitada = item.qtdSolicitada || item.quantidade_solicitada || (item.qtdTotal || item.quantidade_total || 0) / diarias;

                itensOSSelecionados.push({
                    categoria: item.categoria,
                    itemId: item.itemId,
                    descricao: item.descricao,
                    unidade: item.unidade || '',
                    itemBec: item.itemBec || '',
                    diarias: diarias,
                    qtdSolicitada: qtdSolicitada,
                    qtdTotal: diarias * qtdSolicitada
                });
            }
        }

        renderizarTabelaItensOS();

        // Substituir botões do formulário pelo padrão de edição
        const containerBotoes = document.getElementById('botoes-formulario-os');
        containerBotoes.innerHTML = `
            <button type="button" class="btn-small btn-primary" onclick="visualizarOS()">👁️ Visualizar</button>
            <button type="button" class="btn-small btn-success" onclick="salvarEFecharOS()">💾 Salvar e Fechar</button>
            <button type="button" class="btn-small btn-warning" onclick="salvarEContinuarOS()">💾 Salvar e Continuar</button>
            <button type="button" class="btn-small btn-danger" onclick="cancelarEdicaoOS()">❌ Cancelar</button>
        `;

        console.log('✅ O.S. restaurada para edição:', osEditandoId);

    } catch (error) {
        console.error('Erro ao restaurar O.S. para edição:', error);
    }
}

// ========================================
// CARREGAR DADOS DA DETENTORA
// ========================================
async function carregarDadosDetentora() {
    const grupoSelect = document.getElementById('os-grupo-select');
    const grupo = grupoSelect.value;

    console.log('🏢 carregarDadosDetentora() - Iniciando...');
    console.log('   Grupo selecionado:', grupo, '(tipo:', typeof grupo, ')');

    // Limpar campos se nenhum grupo selecionado
    if (!grupo) {
        console.log('⚠️  Nenhum grupo selecionado, limpando campos');
        limparCamposDetentora();
        return;
    }

    try {
        // Buscar detentora pelo grupo
        console.log('📡 Chamando API: obterDetentoraByGrupo(' + grupo + ')');
        const detentora = await APIClient.obterDetentoraByGrupo(grupo);
        console.log('📦 Resposta da API:', detentora);

        if (!detentora || detentora.erro) {
            const mensagem = detentora?.erro || `Nenhuma Detentora cadastrada para o Grupo ${grupo}`;
            console.error('❌ Detentora não encontrada:', mensagem);
            alert(`⚠️ ${mensagem}\n\nPor favor, cadastre uma empresa detentora em 🏢 Detentoras antes de emitir a O.S.`);
            grupoSelect.value = '';
            limparCamposDetentora();
            return;
        }

        console.log('📦 Dados da Detentora recebidos:', detentora);

        // Preencher campos automaticamente
        document.getElementById('os-contrato-num').value = detentora.contratoNum || '';
        document.getElementById('os-data-assinatura').value = detentora.dataAssinatura || '';
        document.getElementById('os-prazo-vigencia').value = detentora.prazoVigencia || '';
        document.getElementById('os-detentora').value = detentora.nome || '';
        document.getElementById('os-cnpj').value = detentora.cnpj || '';
        document.getElementById('os-servico').value = detentora.servico || 'COFFEE BREAK';
        document.getElementById('os-grupo').value = grupo;

        console.log('✅ Dados da Detentora preenchidos com sucesso');
        console.log('   Grupo definido:', grupo, '- Estoques serão filtrados automaticamente');

        // Feedback visual
        grupoSelect.style.borderColor = '#28a745';
        setTimeout(() => {
            grupoSelect.style.borderColor = '';
        }, 2000);

    } catch (error) {
        console.error('❌ Erro ao carregar dados da Detentora:', error);
        alert('Erro ao carregar dados da Detentora. Verifique se existe uma empresa cadastrada para este Grupo.');
        grupoSelect.value = '';
        limparCamposDetentora();
    }
}

function limparCamposDetentora() {
    document.getElementById('os-contrato-num').value = '';
    document.getElementById('os-data-assinatura').value = '';
    document.getElementById('os-prazo-vigencia').value = '';
    document.getElementById('os-detentora').value = '';
    document.getElementById('os-cnpj').value = '';
    document.getElementById('os-servico').value = '';
    document.getElementById('os-grupo').value = '';
    console.log('🧹 Campos da Detentora limpos');
}

// Nova função: Salvar e Fechar
async function salvarEFecharOS() {
    console.log('💾 salvarEFecharOS() - Iniciando...');
    console.log('   osEditandoId atual:', osEditandoId, '(tipo:', typeof osEditandoId, ')');

    if (!osEditandoId) {
        alert('❌ Erro: ID da O.S. não encontrado. Por favor, tente editar novamente.');
        console.error('❌ osEditandoId está null/undefined!');
        return;
    }

    const dadosOS = coletarDadosOS();
    if (!dadosOS) return;

    try {
        // Mapear dados para o formato esperado pela API
        // NOTA: numeroOS NÃO é enviado pois não pode ser alterado
        const dadosAPI = {
            contrato: dadosOS.contratoNum,
            dataAssinatura: dadosOS.dataAssinatura,
            prazoVigencia: dadosOS.prazoVigencia,
            detentora: dadosOS.detentora,
            cnpj: dadosOS.cnpj,
            servico: dadosOS.servico,
            grupo: dadosOS.grupo,
            evento: dadosOS.evento,
            data: dadosOS.dataEvento,
            horario: dadosOS.horario,
            local: dadosOS.local,
            responsavel: dadosOS.responsavel,
            justificativa: dadosOS.justificativa,
            gestorContrato: dadosOS.gestor,
            fiscalContrato: dadosOS.fiscal,
            fiscalTipo: dadosOS.fiscalTipo,
            signatarios: dadosOS.signatarios,
            itens: dadosOS.itens.map(item => ({
                categoria: item.categoria,
                itemId: item.itemId,
                itemBec: item.itemBec,
                descricao: item.descricao,
                unidade: item.unidade,
                qtdTotal: item.qtdTotal
            }))
        };

        // Atualizar O.S. existente
        await APIClient.atualizarOrdemServico(osEditandoId, dadosAPI);
        alert('✅ O.S. atualizada com sucesso! Estoque recalculado.');

        // Limpar estado de edição
        osEditandoId = null;
        signatariosOS = [];

        // Restaurar botões originais
        const containerBotoes = document.getElementById('botoes-formulario-os');
        containerBotoes.innerHTML = `
            <button type="button" class="btn-small btn-primary" onclick="visualizarOS()">👁️ Visualizar O.S.</button>
            <button type="submit" class="btn-small btn-success">✅ Emitir O.S.</button>
        `;

        // Limpar formulário
        document.getElementById('form-emitir-os').reset();
        document.getElementById('itens-os').innerHTML = '';
        limparCamposDetentora();

        // Recarregar dados
        await renderizarAlimentacao();
        await renderizarOrdensServico();

        // Redirecionar para lista de Ordens de Serviço
        console.log('📂 O.S. salva - redirecionando para lista de Ordens de Serviço');
        // Pequeno delay para garantir que o formulário foi limpo antes de redirecionar
        setTimeout(() => {
            window.location.href = '/ordens-servico';
        }, 100);

    } catch (error) {
        console.error('❌ Erro ao salvar O.S.:', error);
        alert('Erro ao salvar O.S.: ' + error.message);
    }
}

// Nova função: Salvar e Continuar
async function salvarEContinuarOS() {
    console.log('💾 salvarEContinuarOS() - Iniciando...');
    console.log('   osEditandoId atual:', osEditandoId, '(tipo:', typeof osEditandoId, ')');

    if (!osEditandoId) {
        alert('❌ Erro: ID da O.S. não encontrado. Por favor, tente editar novamente.');
        console.error('❌ osEditandoId está null/undefined!');
        return;
    }

    const dadosOS = coletarDadosOS();
    if (!dadosOS) return;

    try {
        // Mapear dados para o formato esperado pela API
        // NOTA: numeroOS NÃO é enviado pois não pode ser alterado
        const dadosAPI = {
            contrato: dadosOS.contratoNum,
            dataAssinatura: dadosOS.dataAssinatura,
            prazoVigencia: dadosOS.prazoVigencia,
            detentora: dadosOS.detentora,
            cnpj: dadosOS.cnpj,
            servico: dadosOS.servico,
            grupo: dadosOS.grupo,
            evento: dadosOS.evento,
            data: dadosOS.dataEvento,
            horario: dadosOS.horario,
            local: dadosOS.local,
            responsavel: dadosOS.responsavel,
            justificativa: dadosOS.justificativa,
            gestorContrato: dadosOS.gestor,
            fiscalContrato: dadosOS.fiscal,
            fiscalTipo: dadosOS.fiscalTipo,
            signatarios: dadosOS.signatarios,
            itens: dadosOS.itens.map(item => ({
                categoria: item.categoria,
                itemId: item.itemId,
                itemBec: item.itemBec,
                descricao: item.descricao,
                unidade: item.unidade,
                qtdTotal: item.qtdTotal
            }))
        };

        // Atualizar O.S. existente
        await APIClient.atualizarOrdemServico(osEditandoId, dadosAPI);
        alert('✅ O.S. atualizada com sucesso! Continue editando ou clique em "Salvar e Fechar".');

        // Recarregar dados (mas mantém modo edição)
        await renderizarAlimentacao();
        await renderizarOrdensServico();

    } catch (error) {
        console.error('❌ Erro ao salvar O.S.:', error);
        alert('Erro ao salvar O.S.: ' + error.message);
    }
}

function cancelarEdicaoOS() {
    if (!confirm('❌ Deseja realmente cancelar a edição? Todas as alterações não salvas serão perdidas.')) {
        return;
    }

    osEditandoId = null;
    signatariosOS = [];

    // Limpar formulário
    document.getElementById('form-emitir-os').reset();
    document.getElementById('itens-os').innerHTML = '';
    limparCamposDetentora();

    // Restaurar botões originais
    const containerBotoes = document.getElementById('botoes-formulario-os');
    containerBotoes.innerHTML = `
        <button type="button" class="btn-small btn-primary" onclick="visualizarOS()">👁️ Visualizar O.S.</button>
        <button type="submit" class="btn-small btn-success">✅ Emitir O.S.</button>
    `;

    alert('✅ Edição cancelada. Formulário limpo.');
}

// ========================================
// ENVIO PARA EMPRESA (Portal Detentora)
// ========================================

async function enviarParaEmpresa(osId, detentoraIdAtual, nomeDetentoraTexto) {
    let detentoraId = detentoraIdAtual || null;

    // Se já tem detentora_id vinculada, só confirma e envia
    if (detentoraId) {
        if (!confirm(`Enviar esta O.S. para a empresa detentora?\nEla ficará disponível no portal para aceite.`)) return;
    } else {
        // Tentar auto-casar pelo nome texto da O.S.
        let detentoras = [];
        try {
            const r = await fetch('/api/detentoras/?incluir_inativas=false', { credentials: 'same-origin' });
            if (r.ok) detentoras = await r.json();
        } catch (_) {}

        // Buscar correspondência exata ou parcial pelo nome
        const nomeNorm = (nomeDetentoraTexto || '').trim().toLowerCase();
        if (nomeNorm) {
            const match = detentoras.find(d => d.nome.toLowerCase() === nomeNorm)
                       || detentoras.find(d => d.nome.toLowerCase().includes(nomeNorm) || nomeNorm.includes(d.nome.toLowerCase()));
            if (match) {
                detentoraId = match.id;
                if (!confirm(`Enviar para ${match.nome}?`)) return;
            }
        }

        // Se ainda não achou, mostrar picker
        if (!detentoraId) {
            if (detentoras.length === 0) {
                alert('Nenhuma detentora cadastrada. Cadastre uma detentora primeiro.');
                return;
            }
            const opcoes = detentoras.map((d, i) => `${i + 1}. ${d.nome}${d.contratoNum ? ' — ' + d.contratoNum : ''}`).join('\n');
            const escolha = prompt(`Detentora não identificada. Selecione:\n\n${opcoes}\n\nDigite o número da opção:`);
            if (!escolha) return;
            const idx = parseInt(escolha) - 1;
            if (isNaN(idx) || idx < 0 || idx >= detentoras.length) {
                alert('Opção inválida.');
                return;
            }
            detentoraId = detentoras[idx].id;
        }
    }

    try {
        const csrfResp = await fetch('/auth/csrf-token', { credentials: 'same-origin' });
        const { csrf_token } = await csrfResp.json();

        const resp = await fetch(`/api/ordens-servico/${osId}/enviar-empresa`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf_token },
            body: JSON.stringify({ detentora_id: detentoraId })
        });

        const data = await resp.json();
        if (resp.ok) {
            alert('✅ O.S. enviada para a empresa com sucesso!');
            await filtrarOS();
        } else {
            alert('Erro: ' + (data.erro || resp.status));
        }
    } catch (e) {
        alert('Erro de conexão ao enviar O.S.');
    }
}

// Estado do modal de atividade
let _atividadeOsId = null;

async function verAtividadePortal(osId) {
    _atividadeOsId = osId;

    // Criar modal se não existir
    let modal = document.getElementById('modal-atividade-portal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-atividade-portal';
        modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:3000;align-items:center;justify-content:center;padding:1rem;';
        modal.innerHTML = `
            <div style="background:#fff;border-radius:12px;width:100%;max-width:640px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.2);">
                <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid #eee;flex-shrink:0;">
                    <h2 style="margin:0;font-size:1.1rem;color:#1a237e;" id="atividade-titulo">💬 Atividade do Portal</h2>
                    <button onclick="document.getElementById('modal-atividade-portal').style.display='none'" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:#888;">✕</button>
                </div>
                <div id="atividade-corpo" style="padding:1.25rem;overflow-y:auto;flex:1;">Carregando...</div>
                <div id="atividade-rodape" style="padding:1rem 1.25rem;border-top:1px solid #eee;flex-shrink:0;display:none;">
                    <div style="font-size:.75rem;color:#666;margin-bottom:.4rem;font-weight:600;">✏️ Responder (visível para a empresa)</div>
                    <div style="display:flex;gap:.5rem;align-items:flex-end;">
                        <textarea id="atividade-reply-txt" rows="2" maxlength="1000"
                            placeholder="Digite sua resposta ou observação..."
                            style="flex:1;resize:vertical;padding:.5rem .65rem;border:1px solid #ccc;border-radius:6px;font-size:.9rem;font-family:inherit;min-height:50px;"></textarea>
                        <button onclick="enviarRespostaOperador()"
                            style="background:#1565c0;color:#fff;border:none;border-radius:6px;padding:.55rem .9rem;font-size:.85rem;cursor:pointer;white-space:nowrap;height:fit-content;">
                            Enviar
                        </button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
    }
    modal.style.display = 'flex';
    document.getElementById('atividade-corpo').innerHTML = '<p style="text-align:center;color:#888;">Carregando...</p>';

    await _carregarAtividade(osId);
}

async function _carregarAtividade(osId) {
    try {
        const resp = await fetch(`/api/ordens-servico/${osId}/atividade-portal`, { credentials: 'same-origin' });
        const data = await resp.json();
        if (!resp.ok) { document.getElementById('atividade-corpo').innerHTML = `<p style="color:red;">Erro: ${data.erro}</p>`; return; }

        document.getElementById('atividade-titulo').textContent = `💬 Atividade — O.S. ${data.numero_os || osId}`;

        const fmt = iso => iso ? new Date(iso).toLocaleString('pt-BR') : '—';

        // Seção de aceite
        const secAceite = data.aceites.length === 0
            ? '<p style="color:#aaa;font-style:italic;font-size:.88rem;">Não há aceite registrado.</p>'
            : data.aceites.map(a => `
                <div style="padding:.6rem .75rem;background:#e8f5e9;border-radius:6px;border-left:3px solid #2e7d32;margin-bottom:.4rem;">
                    <div style="font-size:.9rem;color:#1b5e20;font-weight:600;">✅ Aceito por ${a.nomeResponsavel || '—'}</div>
                    <div style="font-size:.8rem;color:#555;margin-top:.2rem;">${fmt(a.dataHora)}</div>
                    ${a.assinaturaPath ? `<img src="/static/${a.assinaturaPath}" style="max-width:100%;border:1px solid #c8e6c9;border-radius:4px;margin-top:.4rem;" alt="Assinatura">` : ''}
                </div>`).join('');

        // Seção de revisões
        const secRevisoes = data.revisoes.length === 0
            ? '<p style="color:#aaa;font-style:italic;font-size:.88rem;">Nenhuma revisão.</p>'
            : data.revisoes.map(r => `
                <div style="padding:.55rem .75rem;border-left:3px solid ${r.descricao?.includes('[RECUSA]') ? '#e53935' : '#9fa8da'};background:${r.descricao?.includes('[RECUSA]') ? '#ffebee' : '#f5f5f5'};border-radius:0 6px 6px 0;margin-bottom:.5rem;">
                    <div style="font-size:.9rem;color:#333;">${r.descricao || '—'}</div>
                    <div style="font-size:.75rem;color:#888;margin-top:.2rem;">${fmt(r.criadoEm)}</div>
                </div>`).join('');

        // Thread de comentários — estilo chat
        const secComentarios = data.comentarios.length === 0
            ? '<p style="color:#aaa;font-style:italic;font-size:.88rem;">Nenhuma mensagem ainda.</p>'
            : data.comentarios.map(c => {
                const isOperador = c.autorPerfil === 'admin' || c.autorPerfil === 'comum';
                const autor = isOperador ? (c.autorNome || 'Operador') : (c.autorNome || 'Empresa');
                const bg = isOperador ? '#e3f2fd' : '#f5f5f5';
                const border = isOperador ? '#1565c0' : '#9e9e9e';
                const align = isOperador ? 'flex-end' : 'flex-start';
                const labelColor = isOperador ? '#0d47a1' : '#555';
                return `
                <div style="display:flex;flex-direction:column;align-items:${align};margin-bottom:.6rem;">
                    <div style="font-size:.7rem;color:${labelColor};font-weight:600;margin-bottom:.15rem;">${isOperador ? '🏢 ' : '🏭 '}${autor}</div>
                    <div style="max-width:85%;padding:.55rem .75rem;background:${bg};border-radius:8px;border-left:3px solid ${border};">
                        <div style="font-size:.9rem;color:#333;">${c.texto || '—'}</div>
                        <div style="font-size:.72rem;color:#aaa;margin-top:.2rem;text-align:right;">${fmt(c.criadoEm)}</div>
                    </div>
                </div>`;
            }).join('');

        document.getElementById('atividade-corpo').innerHTML = `
            <h4 style="margin:0 0 .6rem;font-size:.85rem;color:#555;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #eee;padding-bottom:.4rem;">Aceite</h4>
            ${secAceite}
            <h4 style="margin:1rem 0 .6rem;font-size:.85rem;color:#555;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #eee;padding-bottom:.4rem;">Revisões / Recusas</h4>
            ${secRevisoes}
            <h4 style="margin:1rem 0 .6rem;font-size:.85rem;color:#555;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #eee;padding-bottom:.4rem;">Mensagens</h4>
            <div id="atividade-thread">${secComentarios}</div>`;

        // Mostrar rodapé de resposta (apenas se OS tem detentora e status não terminal)
        const statusTerminal = ['executada', 'recusada'].includes(data.status);
        const rodape = document.getElementById('atividade-rodape');
        if (rodape) rodape.style.display = (!statusTerminal && data.status !== 'emitida') ? '' : 'none';

    } catch (e) {
        document.getElementById('atividade-corpo').innerHTML = '<p style="color:red;">Erro de conexão.</p>';
    }
}

async function enviarRespostaOperador() {
    const textarea = document.getElementById('atividade-reply-txt');
    const texto = textarea?.value?.trim();
    if (!texto || !_atividadeOsId) return;

    const btn = textarea.nextElementSibling;
    btn.disabled = true;
    btn.textContent = '...';

    try {
        const csrfResp = await fetch('/auth/csrf-token', { credentials: 'same-origin' });
        const { csrf_token } = await csrfResp.json();

        const resp = await fetch(`/api/ordens-servico/${_atividadeOsId}/comentar`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf_token },
            body: JSON.stringify({ texto })
        });
        const data = await resp.json();
        if (resp.ok) {
            textarea.value = '';
            // Recarregar thread sem fechar modal
            await _carregarAtividade(_atividadeOsId);
        } else {
            alert(data.erro || 'Erro ao enviar resposta.');
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'Enviar';
    }
}

// ============================================================
// CANCELAR O.S. (admin — após aceite da detentora)
// ============================================================

async function cancelarOS(osId, numeroOS) {
    const motivo = prompt(`Cancelar O.S. ${numeroOS}.\n\nEsta ação é irreversível — a O.S. não poderá ser reativada.\n\nInforme o motivo do cancelamento:`);
    if (motivo === null) return; // clicou Cancelar
    if (!motivo.trim()) { alert('O motivo é obrigatório para cancelar.'); return; }

    try {
        const csrfResp = await fetch('/auth/csrf-token', { credentials: 'same-origin' });
        const { csrf_token } = await csrfResp.json();

        const resp = await fetch(`/api/ordens-servico/${osId}/cancelar`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf_token },
            body: JSON.stringify({ motivo: motivo.trim() })
        });
        const data = await resp.json();
        if (resp.ok) {
            alert('✅ O.S. cancelada. Para retomar o serviço, crie uma nova O.S.');
            await filtrarOS();
        } else {
            alert('Erro: ' + (data.erro || resp.status));
        }
    } catch (e) {
        alert('Erro de conexão ao cancelar O.S.');
    }
}

// ============================================================
// ASSINAR DIGITALMENTE (operador interno — modelo SEI)
// ============================================================

function abrirModalAssinarInterno(osId) {
    const anterior = document.getElementById('modal-assinar-interno');
    if (anterior) anterior.remove();

    const overlay = document.createElement('div');
    overlay.id = 'modal-assinar-interno';
    overlay.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;align-items:center;justify-content:center;padding:1rem;';
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:12px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.25);">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid #eee;">
                <h2 style="margin:0;font-size:1.1rem;color:#1a237e;">✍️ Assinatura Digital Interna</h2>
                <button onclick="document.getElementById('modal-assinar-interno').remove()" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:#888;">✕</button>
            </div>
            <div style="padding:1.25rem;">
                <div style="display:flex;gap:.75rem;align-items:flex-start;background:#e8f5e9;border:1px solid #a5d6a7;border-radius:8px;padding:.75rem 1rem;margin-bottom:1.25rem;font-size:.85rem;">
                    <span style="font-size:1.4rem;flex-shrink:0;">🔐</span>
                    <div>
                        <strong style="display:block;margin-bottom:.2rem;color:#2e7d32;">Assinatura Digital Interna</strong>
                        <span style="color:#555;">Será registrada no PDF da O.S. com data, hora e identificação do usuário.</span>
                    </div>
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:.35rem;color:#333;">Nome completo *</label>
                    <input type="text" id="int-assinar-nome" placeholder="Nome completo do signatário" maxlength="120"
                        style="width:100%;padding:.55rem .75rem;border:1px solid #ccc;border-radius:6px;font-size:.95rem;box-sizing:border-box;"
                        oninput="atualizarPreviewInterno(this.value)">
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block;font-size:.85rem;font-weight:600;margin-bottom:.35rem;color:#333;">Cargo / Função *</label>
                    <input type="text" id="int-assinar-cargo" placeholder="Ex: Gestor do Contrato" maxlength="100"
                        style="width:100%;padding:.55rem .75rem;border:1px solid #ccc;border-radius:6px;font-size:.95rem;box-sizing:border-box;">
                </div>
                <div style="border:1.5px solid #c5cae9;border-radius:8px;padding:1rem 1.25rem;background:#fafafa;margin-bottom:1rem;min-height:80px;">
                    <span style="display:block;font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#9e9e9e;margin-bottom:.5rem;">Prévia</span>
                    <div id="int-preview-nome" style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:1.5rem;color:#1a237e;border-bottom:1px solid #c5cae9;padding-bottom:.4rem;margin-bottom:.3rem;">—</div>
                    <div id="int-preview-meta" style="font-size:.72rem;color:#aaa;"></div>
                </div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:.5rem;padding:1rem 1.25rem;border-top:1px solid #eee;">
                <button onclick="document.getElementById('modal-assinar-interno').remove()" style="padding:.55rem 1.2rem;border-radius:8px;border:1px solid #ccc;background:#f5f5f5;font-weight:600;cursor:pointer;font-size:.9rem;">Cancelar</button>
                <button onclick="confirmarAssinaturaInterna(${osId})" id="btn-confirmar-ass-int" style="padding:.55rem 1.2rem;border-radius:8px;border:none;background:#1565c0;color:#fff;font-weight:600;cursor:pointer;font-size:.9rem;">Assinar Digitalmente</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('int-assinar-nome').focus();
}

function atualizarPreviewInterno(nome) {
    const el = document.getElementById('int-preview-nome');
    const meta = document.getElementById('int-preview-meta');
    if (!el) return;
    el.textContent = nome.trim() || '—';
    if (meta) meta.textContent = nome.trim() ? `Assinado digitalmente em ${new Date().toLocaleString('pt-BR')}` : '';
}

function _gerarAssinaturaBase64Interno(nome, cargo) {
    const canvas = document.createElement('canvas');
    canvas.width = 480; canvas.height = 120;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#c5cae9'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, 80); ctx.lineTo(460, 80); ctx.stroke();
    ctx.fillStyle = '#1a237e';
    ctx.font = 'italic 28px Georgia, serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(nome, 20, 74);
    if (cargo) { ctx.fillStyle = '#555'; ctx.font = '12px Arial, sans-serif'; ctx.fillText(cargo, 20, 96); }
    ctx.fillStyle = '#aaa'; ctx.font = '10px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(new Date().toLocaleString('pt-BR'), 460, 112);
    return canvas.toDataURL('image/png');
}

async function confirmarAssinaturaInterna(osId) {
    const nome = document.getElementById('int-assinar-nome')?.value?.trim();
    const cargo = document.getElementById('int-assinar-cargo')?.value?.trim() || '';
    if (!nome) { alert('Informe o nome completo.'); return; }

    const btn = document.getElementById('btn-confirmar-ass-int');
    btn.disabled = true; btn.textContent = 'Registrando...';

    try {
        const csrfResp = await fetch('/auth/csrf-token', { credentials: 'same-origin' });
        const { csrf_token } = await csrfResp.json();

        const assinaturaBase64 = _gerarAssinaturaBase64Interno(nome, cargo);

        const resp = await fetch(`/api/ordens-servico/${osId}/assinar`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf_token },
            body: JSON.stringify({ nome_responsavel: nome, cargo, assinatura_base64: assinaturaBase64 })
        });
        const data = await resp.json();
        if (resp.ok) {
            document.getElementById('modal-assinar-interno').remove();
            alert('✅ Assinatura digital registrada com sucesso! Ela aparecerá no PDF da O.S.');
            await filtrarOS();
        } else {
            alert('Erro: ' + (data.erro || resp.status));
            btn.disabled = false; btn.textContent = 'Assinar Digitalmente';
        }
    } catch (e) {
        alert('Erro de conexão.');
        btn.disabled = false; btn.textContent = 'Assinar Digitalmente';
    }
}

async function reenviarParaEmpresa(osId) {
    if (!confirm('Reenviar esta O.S. para a empresa após a revisão solicitada?')) return;

    try {
        const csrfResp = await fetch('/auth/csrf-token', { credentials: 'same-origin' });
        const { csrf_token } = await csrfResp.json();

        const resp = await fetch(`/api/ordens-servico/${osId}/reenviar-empresa`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf_token },
            body: JSON.stringify({})
        });

        const data = await resp.json();
        if (resp.ok) {
            alert('✅ O.S. reenviada para a empresa!');
            await filtrarOS();
        } else {
            alert('Erro: ' + (data.erro || resp.status));
        }
    } catch (e) {
        alert('Erro de conexão ao reenviar O.S.');
    }
}
