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

            card.innerHTML = `
                <div class="item-header">
                    <span class="item-categoria">O.S. ${os.numeroOS}</span>
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
                    <button class="btn-small btn-warning" onclick="editarOS(${os.id})">✏️ Editar</button>
                    <button class="btn-small btn-success" onclick="imprimirOS(${os.id})">🖨️ Imprimir</button>
                    <button class="btn-small btn-secondary" onclick="baixarPDFTextoSelecionavel(${os.id})">📄 PDF</button>
                    ${usuarioPerfil === 'admin' ? `<button class="btn-small btn-danger" onclick="excluirOS(${os.id}, '${os.numeroOS}')">🗑️ Excluir</button>` : ''}
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
