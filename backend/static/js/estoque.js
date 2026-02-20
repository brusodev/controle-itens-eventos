// ========================================
// MÓDULO: ESTOQUE - Gestão de Estoque e Alimentação
// ========================================

function renderizarEstoque() {
    const container = document.getElementById('lista-estoque');
    const filtroCategoria = document.getElementById('filtro-categoria');

    // Atualizar filtro de categorias
    const categorias = [...new Set(estoque.map(item => item.categoria))];
    filtroCategoria.innerHTML = '<option value="">Todas as categorias</option>';
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = formatarCategoria(cat);
        filtroCategoria.appendChild(option);
    });

    filtrarEstoque();
}

function filtrarEstoque() {
    const container = document.getElementById('lista-estoque');
    const busca = document.getElementById('filtro-estoque').value.toLowerCase();
    const categoria = document.getElementById('filtro-categoria').value;

    let itensFiltrados = estoque;

    if (busca) {
        itensFiltrados = itensFiltrados.filter(item =>
            item.nome.toLowerCase().includes(busca)
        );
    }

    if (categoria) {
        itensFiltrados = itensFiltrados.filter(item => item.categoria === categoria);
    }

    container.innerHTML = '';

    if (itensFiltrados.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum item encontrado.</p>';
        return;
    }

    itensFiltrados.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';

        const statusClass = item.quantidade === 0 ? 'badge-danger' :
                           item.quantidade < 5 ? 'badge-warning' : 'badge-success';

        card.innerHTML = `
            <div class="item-header">
                <span class="item-categoria">${formatarCategoria(item.categoria)}</span>
                <span class="badge ${statusClass}">${item.quantidade} ${item.unidade}</span>
            </div>
            <div class="item-body">
                <h3>${item.nome}</h3>
            </div>
            <div class="item-footer">
                <button class="btn-small btn-secondary" onclick="editarItem(${item.id})">✏️ Editar</button>
                <button class="btn-small btn-danger" onclick="removerItem(${item.id})">🗑️ Remover</button>
            </div>
        `;

        container.appendChild(card);
    });
}

async function renderizarAlimentacao() {
    try {
        console.log('🔄 [ALIMENTAÇÃO] Buscando dados atualizados da API...');
        dadosAlimentacao = await APIClient.listarAlimentacao();
        console.log('✅ [ALIMENTAÇÃO] Dados recebidos:', dadosAlimentacao);

        if (!dadosAlimentacao || Object.keys(dadosAlimentacao).length === 0) {
            console.warn('⚠️ [ALIMENTAÇÃO] Nenhum dado retornado da API.');
        }

        // Salvar no localStorage com campo preco
        localStorage.setItem('dadosAlimentacao', JSON.stringify(dadosAlimentacao));
        console.log('💾 [ALIMENTAÇÃO] Dados salvos no cache');

        renderizarItensAlimentacao();
    } catch (error) {
        console.error('❌ [ALIMENTAÇÃO] Erro ao carregar dados:', error);
        // Evitar alert repetitivo, apenas logar
    }
}

function renderizarItensAlimentacao() {
    const container = document.getElementById('lista-alimentacao');
    const filtroCategoria = document.getElementById('filtro-categoria-alimentacao');

    // Atualizar filtro de categorias
    const categorias = Object.keys(dadosAlimentacao);
    filtroCategoria.innerHTML = '<option value="">Todas as categorias</option>';
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = formatarCategoriaAlimentacao(cat) + (dadosAlimentacao[cat].natureza ? ` (${dadosAlimentacao[cat].natureza})` : '');
        filtroCategoria.appendChild(option);
    });

    filtrarAlimentacao();
}

function filtrarAlimentacao() {
    const container = document.getElementById('lista-alimentacao');
    const busca = document.getElementById('filtro-alimentacao').value.toLowerCase();
    const categoria = document.getElementById('filtro-categoria-alimentacao').value;

    // Obter configuração do módulo atual
    const cfg = getModuleConfig();
    const cfgRegioes = cfg.regioes;
    const maxRegioes = cfgRegioes.quantidade;

    container.innerHTML = '';

    Object.keys(dadosAlimentacao).forEach(cat => {
        if (categoria && categoria !== cat) return;

        dadosAlimentacao[cat].itens.forEach(item => {
            if (busca && !item.descricao.toLowerCase().includes(busca)) return;

            // Função auxiliar para parsear valores que podem ser string ou número
            const safeParse = (val) => {
                if (val === undefined || val === null || val === '__') return 0;
                if (typeof val === 'number') return val;
                // Se for string, remove pontos de milhar e troca vírgula por ponto
                return parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || 0;
            };

            // Calcular totais
            let totalInicial = 0;
            let totalGasto = 0;
            Object.values(item.regioes).forEach(r => {
                totalInicial += safeParse(r.inicial);
                totalGasto += safeParse(r.gasto);
            });
            const totalDisponivel = totalInicial - totalGasto;

            // DEBUG: Log para verificar cálculos
            if (item.descricao.includes('Coffee Break Tipo 1')) {
                console.log('🔍 [DEBUG] Coffee Break Tipo 1:');
                console.log('   - Total Inicial:', totalInicial);
                console.log('   - Total Gasto:', totalGasto);
                console.log('   - Total Disponível:', totalDisponivel);
                console.log('   - Regiões:', item.regioes);
            }

            const statusClass = totalDisponivel === 0 ? 'badge-danger' : totalDisponivel < 1000 ? 'badge-warning' : 'badge-success';

            const card = document.createElement('div');
            card.className = 'item-card';

            card.innerHTML = `
                <div class="item-header">
                    <span class="item-categoria">${formatarCategoriaAlimentacao(cat)} (${dadosAlimentacao[cat].natureza})</span>
                    <span class="badge ${statusClass}">Disponível: ${totalDisponivel.toLocaleString()}</span>
                </div>
                <div class="item-body">
                    <h3>${item.descricao}</h3>
                    ${(item.natureza && item.natureza !== '') ? `<div style="font-size: 0.85rem; color: #666; margin-bottom: 8px;">Código: ${item.natureza}</div>` : ''}
                    <div class="quantities-summary">
                        <span class="qty-inicial">Inicial: ${totalInicial.toLocaleString()}</span>
                        <span class="qty-gasto">Gasto: ${totalGasto.toLocaleString()}</span>
                    </div>
                    <div class="regioes-summary">
                        <div class="regioes-header">
                            <div class="regiao-col-header">${cfgRegioes.tipoLabel}</div>
                            <div class="regiao-col-header">Inicial</div>
                            <div class="regiao-col-header">Usado</div>
                            <div class="regiao-col-header">Rest.</div>
                        </div>
                        ${Array.from({length: maxRegioes}, (_, i) => i + 1).map(reg => {
                            const r = item.regioes[reg.toString()] || { inicial: 0, gasto: 0 };
                            let inicial = 0;
                            let gasto = 0;
                            let disp = 0;

                            // Função auxiliar para parsear valores que podem ser string ou número
                            const safeParse = (val) => {
                                if (val === undefined || val === null || val === '__') return 0;
                                if (typeof val === 'number') return val;
                                return parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || 0;
                            };

                            inicial = safeParse(r.inicial);
                            gasto = safeParse(r.gasto);
                            disp = inicial - gasto;

                            const statusClass = disp === 0 ? 'danger' : disp < 100 ? 'warning' : 'success';
                            const labelRegiao = cfgRegioes.nomes[reg] || `${cfgRegioes.tipoLabel} ${reg}`;

                            return `
                                <div class="regiao-row ${statusClass}">
                                    <div class="regiao-col regiao-nome">${labelRegiao}</div>
                                    <div class="regiao-col regiao-inicial">${inicial.toLocaleString()}</div>
                                    <div class="regiao-col regiao-gasto">${gasto.toLocaleString()}</div>
                                    <div class="regiao-col regiao-restante">${disp.toLocaleString()}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                <div class="item-footer">
                    <button class="btn-small btn-secondary" onclick="editarItemAlimentacao('${cat}', '${item.item}')">✏️ Editar</button>
                </div>
            `;

            container.appendChild(card);
        });
    });

    if (container.innerHTML === '') {
        container.innerHTML = '<p class="empty-message">Nenhum item encontrado.</p>';
    }
}

function editarItemAlimentacao(categoria, itemId) {
    const item = dadosAlimentacao[categoria].itens.find(i => i.item === itemId.toString());
    if (!item) return;

    console.log('🔍 [EDITAR] Item completo:', item);
    console.log('🔍 [EDITAR] Regiões do item:', item.regioes);

    alimentacaoEditando = { categoria, itemId: itemId.toString() };

    // Atualizar título do modal de acordo com o módulo
    const moduloAtual = localStorage.getItem('modulo_atual') || 'coffee';
    const titulosModal = {
        'coffee': 'Editar Item de Alimentação',
        'transporte': 'Editar Item de Transporte',
        'hospedagem': 'Editar Item de Hospedagem',
        'organizacao': 'Editar Item de Organização'
    };
    document.getElementById('modal-alimentacao-titulo').textContent = titulosModal[moduloAtual] || 'Editar Item';
    
    document.getElementById('alimentacao-descricao').value = item.descricao;
    document.getElementById('alimentacao-unidade').value = item.unidade;
    
    // Carregar código BEC/CATSER
    const codigoBecInput = document.getElementById('alimentacao-codigo-bec');
    if (codigoBecInput) {
        codigoBecInput.value = item.natureza || '';
    }
    
    // Atualizar label do código BEC/CATSER baseado no módulo
    const cfg = getModuleConfig();
    const labelCodigoBec = document.getElementById('label-alimentacao-codigo-bec');
    if (labelCodigoBec) {
        labelCodigoBec.textContent = `Código ${cfg.itemCodeLabel}:`;
    }

    const regioesDiv = document.getElementById('regioes-quantidades');
    regioesDiv.innerHTML = '';

    // Configuração de regiões do módulo
    const cfgRegioes = cfg.regioes;
    const maxRegioes = cfgRegioes.quantidade;

    for (let reg = 1; reg <= maxRegioes; reg++) {
        const r = item.regioes[reg.toString()] || { inicial: '', gasto: '0', preco: '0' };
        console.log(`🔍 [EDITAR] Região ${reg}:`, r);

        // Garantir que preco nunca seja undefined
        const precoValor = (r.preco !== undefined && r.preco !== null) ? r.preco : '0';

        // Função auxiliar para parsear valores que podem ser string ou número
        const safeParseInt = (val) => {
            if (val === undefined || val === null || val === '__') return 0;
            if (typeof val === 'number') return Math.round(val);
            return Math.round(parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || 0);
        };

        const inicialNum = safeParseInt(r.inicial);
        const gastoNum = safeParseInt(r.gasto);

        // Aplicar formatação com separador de milhar
        const inicialExibicao = inicialNum > 0 ? formatarNumeroMilhar(inicialNum) : '';
        const gastoExibicao = formatarNumeroMilhar(gastoNum);

        // Definir readonly apenas para usuários comuns (não admin)
        const isAdmin = usuarioPerfil === 'admin';
        const readonlyAttr = isAdmin ? '' : 'readonly';
        const readonlyStyle = isAdmin ? '' : ' style="background: #f0f0f0;"';

        // Usar nome da região do config
        const labelRegiao = cfgRegioes.nomes[reg] || `${cfgRegioes.tipoLabel} ${reg}`;
        const regDiv = document.createElement('div');
        regDiv.className = 'form-group';
        regDiv.innerHTML = `
            <label style="font-weight: 600; margin-bottom: 8px; display: block;">${labelRegiao}:</label>
            <div class="regiao-inputs">
                <div style="flex: 1;">
                    <label style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; display: block; margin-bottom: 4px;">Inicial</label>
                    <input type="text" class="regiao-inicial-input" data-reg="${reg}" value="${inicialExibicao}" placeholder="Inicial" ${readonlyAttr}${readonlyStyle}>
                </div>
                <div style="flex: 1;">
                    <label style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; display: block; margin-bottom: 4px;">Gasto</label>
                    <input type="text" class="regiao-gasto-input" data-reg="${reg}" value="${gastoExibicao}" placeholder="Gasto" ${readonlyAttr}${readonlyStyle}>
                </div>
                <div style="flex: 1;">
                    <label style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; display: block; margin-bottom: 4px;">Preço</label>
                    <input type="text" class="regiao-preco-input" data-reg="${reg}" value="${precoValor}" placeholder="Preço" ${readonlyAttr}${readonlyStyle}>
                </div>
            </div>
        `;
        regioesDiv.appendChild(regDiv);
    }

    // Adicionar event listeners para formatação automática
    document.querySelectorAll('.regiao-inicial-input, .regiao-gasto-input').forEach(input => {
        input.addEventListener('input', function(e) {
            // Aplicar formatação enquanto digita
            const valor = this.value.replace(/\D/g, '');
            this.value = valor ? formatarNumeroMilhar(valor) : '';
        });
    });

    document.getElementById('modal-alimentacao').style.display = 'flex';
}

function fecharModalAlimentacao() {
    document.getElementById('modal-alimentacao').style.display = 'none';
    alimentacaoEditando = null;
}

// Formulário de Alimentação
document.getElementById('form-alimentacao').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!alimentacaoEditando) return;

    const { categoria, itemId } = alimentacaoEditando;
    const item = dadosAlimentacao[categoria].itens.find(i => i.item === itemId);

    // Coletar código BEC/CATSER
    const codigoBec = document.getElementById('alimentacao-codigo-bec')?.value || null;

    // Coletar dados das regiões
    const regioes = {};
    const regioesInicialInputs = document.querySelectorAll('.regiao-inicial-input');
    const regioesGastoInputs = document.querySelectorAll('.regiao-gasto-input');
    const regioesPrecoInputs = document.querySelectorAll('.regiao-preco-input');

    regioesInicialInputs.forEach(input => {
        const reg = input.getAttribute('data-reg');
        if (!regioes[reg]) regioes[reg] = {};
        // Remover máscara antes de enviar
        regioes[reg].inicial = removerMascaraNumero(input.value) || '__';
    });

    regioesGastoInputs.forEach(input => {
        const reg = input.getAttribute('data-reg');
        if (!regioes[reg]) regioes[reg] = { inicial: '__' };
        // Remover máscara antes de enviar
        regioes[reg].gasto = removerMascaraNumero(input.value) || '0';
    });

    regioesPrecoInputs.forEach(input => {
        const reg = input.getAttribute('data-reg');
        if (!regioes[reg]) regioes[reg] = { inicial: '__' };
        regioes[reg].preco = input.value || '0';
    });

    try {
        // Atualizar via API (incluindo código BEC/CATSER)
        await APIClient.atualizarEstoqueItem(item.id, regioes, codigoBec);

        // Atualizar localmente (merge para preservar campos existentes)
        Object.keys(regioes).forEach(reg => {
            if (!item.regioes[reg]) item.regioes[reg] = {};
            // Fazer merge para preservar 'gasto' e outros campos
            item.regioes[reg] = {
                ...item.regioes[reg],
                ...regioes[reg]
            };
        });
        
        // Atualizar código BEC/CATSER localmente
        if (codigoBec !== null) {
            item.natureza = codigoBec;
        }

        alert('Estoque atualizado com sucesso!');
        fecharModalAlimentacao();
        renderizarItensAlimentacao();
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar dados: ' + error.message);
    }
});
