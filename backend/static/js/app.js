// ========================================
// SISTEMA DE CONTROLE DE ITENS
// ========================================

// Estrutura de Dados
let estoque = [];
let kits = [];
let requisicoes = [];
let historico = [];
let proximoIdEstoque = 1;
let proximoIdKit = 1;
let proximoIdRequisicao = 1;
// ❌ CACHE REMOVIDO - Tudo agora vem direto da API/Banco
// let ordensServico = [];
let proximoIdOS = 1;
let osEditandoId = null; // ID da O.S. sendo editada

// ========================================
// DADOS DE ALIMENTAÇÃO
// ========================================

let dadosAlimentacao = null;
let alimentacaoEditando = null;

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
    carregarDados();
    inicializarDataAtual();
    configurarAbas();
    configurarFormularios();
    
    // Carregar dados da API
    await renderizarAlimentacao();
    await renderizarOrdensServico();
    
    atualizarInterface();
    
    // ✅ INICIALIZAR MENU MOBILE
    inicializarMenuMobile();
    
    // ✅ RESTAURAR O.S. PARA EDIÇÃO SE NECESSÁRIO
    await restaurarOSParaEdicao();
});

function carregarDados() {
    // Carregar do LocalStorage
    const estoqueLS = localStorage.getItem('estoque');
    const kitsLS = localStorage.getItem('kits');
    const requisicoesLS = localStorage.getItem('requisicoes');
    const historicoLS = localStorage.getItem('historico');
    const idEstoqueLS = localStorage.getItem('proximoIdEstoque');
    const idKitLS = localStorage.getItem('proximoIdKit');
    const idRequisicaoLS = localStorage.getItem('proximoIdRequisicao');
    const dadosAlimentacaoLS = localStorage.getItem('dadosAlimentacao');
    // ❌ CACHE REMOVIDO - O.S. vêm direto da API
    // const ordensServicoLS = localStorage.getItem('ordensServico');
    // const idOSLS = localStorage.getItem('proximoIdOS');

    if (estoqueLS) {
        estoque = JSON.parse(estoqueLS);
        proximoIdEstoque = parseInt(idEstoqueLS) || 1;
    } else {
        // Inicializar com dados de exemplo
        inicializarEstoqueExemplo();
    }

    if (kitsLS) {
        kits = JSON.parse(kitsLS);
        proximoIdKit = parseInt(idKitLS) || 1;
    }

    if (requisicoesLS) {
        requisicoes = JSON.parse(requisicoesLS);
        proximoIdRequisicao = parseInt(idRequisicaoLS) || 1;
    }

    if (historicoLS) {
        historico = JSON.parse(historicoLS);
    }

    if (dadosAlimentacaoLS) {
        const dadosCache = JSON.parse(dadosAlimentacaoLS);
        // Verificar se os dados em cache têm o campo 'preco'
        const temPreco = Object.values(dadosCache).some(cat => 
            cat.itens && cat.itens.some(item => 
                item.regioes && Object.values(item.regioes).some(r => r.preco !== undefined)
            )
        );
        
        if (temPreco) {
            console.log('✅ Cache válido com campo preço');
            dadosAlimentacao = dadosCache;
        } else {
            console.log('⚠️ Cache sem campo preço - será atualizado');
            localStorage.removeItem('dadosAlimentacao');
        }
    }

    // ❌ CACHE REMOVIDO - O.S. carregadas sob demanda da API
    // if (ordensServicoLS) {
    //     ordensServico = JSON.parse(ordensServicoLS);
    //     proximoIdOS = parseInt(idOSLS) || 1;
    // }
}

function salvarDados() {
    localStorage.setItem('estoque', JSON.stringify(estoque));
    localStorage.setItem('kits', JSON.stringify(kits));
    localStorage.setItem('requisicoes', JSON.stringify(requisicoes));
    localStorage.setItem('historico', JSON.stringify(historico));
    localStorage.setItem('proximoIdEstoque', proximoIdEstoque);
    localStorage.setItem('proximoIdKit', proximoIdKit);
    localStorage.setItem('proximoIdRequisicao', proximoIdRequisicao);
}

function inicializarEstoqueExemplo() {
    // Baseado no JSON fornecido
    const categorias = {
        'estrutura_e_espaco': [
            'Local do evento (salão, auditório, espaço aberto)',
            'Mesas e cadeiras',
            'Palco / púlpito',
            'Decoração (flores, banners, iluminação ambiente)',
            'Som e iluminação técnica',
            'Gerador de energia (reserva)',
            'Internet / Wi-Fi'
        ],
        'equipamentos': [
            'Microfones (sem fio e de lapela)',
            'Projetor / telão / TVs',
            'Computador / notebook de apoio',
            'Cabos, extensões e adaptadores',
            'Caixas de som',
            'Material de sinalização (placas, totens, adesivos)'
        ],
        'materiais_de_apoio': [
            'Lista de presença / credenciamento',
            'Crachás / pulseiras de identificação',
            'Kits para participantes (se houver)',
            'Papelaria (canetas, blocos, pranchetas)',
            'Brindes / lembranças'
        ]
    };

    for (let categoria in categorias) {
        categorias[categoria].forEach(nome => {
            estoque.push({
                id: proximoIdEstoque++,
                categoria: categoria,
                nome: nome,
                quantidade: 10, // Quantidade inicial padrão
                unidade: 'unidade',
                dataCadastro: new Date().toISOString()
            });
        });
    }

    salvarDados();
}

function inicializarDataAtual() {
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('req-data-uso').value = hoje;
}

// ========================================
// NAVEGAÇÃO POR ABAS
// ========================================

function configurarAbas() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remover active de todas as abas
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Adicionar active na aba clicada
            this.classList.add('active');
            document.getElementById('tab-' + tabName).classList.add('active');
            
            // Atualizar conteúdo da aba
            if (tabName === 'estoque') renderizarEstoque();
            if (tabName === 'alimentacao') renderizarAlimentacao();
            if (tabName === 'emitir-os') renderizarEmitirOS();
            if (tabName === 'ordens-servico') renderizarOrdensServico();
            if (tabName === 'kits') renderizarKits();
            if (tabName === 'pendentes') renderizarPendentes();
            if (tabName === 'historico') renderizarHistorico();
        });
    });
}

// ========================================
// GESTÃO DE ESTOQUE
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

function formatarCategoria(categoria) {
    const nomes = {
        'estrutura_e_espaco': 'Estrutura e Espaço',
        'equipamentos': 'Equipamentos',
        'materiais_de_apoio': 'Materiais de Apoio'
    };
    return nomes[categoria] || categoria;
}

async function renderizarAlimentacao() {
    try {
        console.log('🔄 [ALIMENTAÇÃO] Buscando dados atualizados da API...');
        dadosAlimentacao = await APIClient.listarAlimentacao();
        console.log('✅ [ALIMENTAÇÃO] Dados recebidos:', dadosAlimentacao);
        
        // Salvar no localStorage com campo preco
        localStorage.setItem('dadosAlimentacao', JSON.stringify(dadosAlimentacao));
        console.log('💾 [ALIMENTAÇÃO] Dados salvos no cache com campo preço');
        
        renderizarItensAlimentacao();
    } catch (error) {
        console.error('Erro ao carregar dados de alimentação:', error);
        alert('Erro ao carregar dados de alimentação. Verifique se o backend está rodando.');
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
    
    container.innerHTML = '';
    
    Object.keys(dadosAlimentacao).forEach(cat => {
        if (categoria && categoria !== cat) return;
        
        dadosAlimentacao[cat].itens.forEach(item => {
            if (busca && !item.descricao.toLowerCase().includes(busca)) return;
            
            // Calcular totais
            let totalInicial = 0;
            let totalGasto = 0;
            Object.values(item.regioes).forEach(r => {
                // Verificar se inicial existe e não é '__' antes de fazer replace
                if (r.inicial && r.inicial !== '__') {
                    totalInicial += parseFloat(r.inicial.replace('.', '').replace(',', '.')) || 0;
                }
                // Verificar se gasto existe antes de fazer replace
                if (r.gasto) {
                    totalGasto += parseFloat(r.gasto.replace('.', '').replace(',', '.')) || 0;
                }
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
                    <div class="quantities-summary">
                        <span class="qty-inicial">Inicial: ${totalInicial.toLocaleString()}</span>
                        <span class="qty-gasto">Gasto: ${totalGasto.toLocaleString()}</span>
                    </div>
                    <div class="regioes-summary">
                        ${Object.entries(item.regioes).map(([reg, r]) => {
                            let disp = 0;
                            if (r.inicial && r.inicial !== '__' && r.gasto) {
                                const inicial = parseFloat(r.inicial.replace('.', '').replace(',', '.')) || 0;
                                const gasto = parseFloat(r.gasto.replace('.', '').replace(',', '.')) || 0;
                                disp = inicial - gasto;
                            }
                            return `<span class="regiao-qty">Restante Reg ${reg}: ${disp.toLocaleString()}</span>`;
                        }).join('')}
                    </div>
                </div>
                <div class="item-footer">
                    <button class="btn-small btn-secondary" onclick="editarItemAlimentacao('${cat}', ${item.item})">✏️ Editar</button>
                </div>
            `;
            
            container.appendChild(card);
        });
    });
    
    if (container.innerHTML === '') {
        container.innerHTML = '<p class="empty-message">Nenhum item encontrado.</p>';
    }
}

function formatarCategoriaAlimentacao(categoria) {
    const nomes = {
        'coffee_break_bebidas_quentes': 'Coffee Break e Bebidas Quentes',
        'fornecimento_agua_mineral': 'Fornecimento de Água Mineral',
        'kit_lanche': 'Kit Lanche',
        'fornecimento_biscoitos': 'Fornecimento de Biscoitos',
        'almoco_jantar': 'Almoço/Jantar'
    };
    return nomes[categoria] || categoria;
}

function editarItemAlimentacao(categoria, itemId) {
    const item = dadosAlimentacao[categoria].itens.find(i => i.item === itemId.toString());
    if (!item) return;
    
    console.log('🔍 [EDITAR] Item completo:', item);
    console.log('🔍 [EDITAR] Regiões do item:', item.regioes);
    
    alimentacaoEditando = { categoria, itemId: itemId.toString() };
    
    document.getElementById('modal-alimentacao-titulo').textContent = 'Editar Item de Alimentação';
    document.getElementById('alimentacao-descricao').value = item.descricao;
    document.getElementById('alimentacao-unidade').value = item.unidade;
    
    const regioesDiv = document.getElementById('regioes-quantidades');
    regioesDiv.innerHTML = '';
    
    for (let reg = 1; reg <= 6; reg++) {
        const r = item.regioes[reg.toString()] || { inicial: '', gasto: '0', preco: '0' };
        console.log(`🔍 [EDITAR] Região ${reg}:`, r);
        
        // Garantir que preco nunca seja undefined
        const precoValor = (r.preco !== undefined && r.preco !== null) ? r.preco : '0';
        
        // Limpar formatação dos valores para exibição
        // Converter para número inteiro removendo decimais
        const inicialNum = r.inicial ? Math.round(parseFloat(r.inicial.replace('.', '').replace(',', '.')) || 0) : 0;
        const gastoNum = r.gasto ? Math.round(parseFloat(r.gasto.replace('.', '').replace(',', '.')) || 0) : 0;
        
        const inicialExibicao = inicialNum > 0 ? inicialNum.toString() : '';
        const gastoExibicao = gastoNum.toString();
        
        // Definir readonly apenas para usuários comuns (não admin)
        const isAdmin = usuarioPerfil === 'admin';
        const readonlyAttr = isAdmin ? '' : 'readonly';
        const readonlyStyle = isAdmin ? '' : ' style="background: #f0f0f0;"';
        
        const regDiv = document.createElement('div');
        regDiv.className = 'form-group';
        regDiv.innerHTML = `
            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Região ${reg}:</label>
            <div class="regiao-inputs">
                <div style="flex: 1;">
                    <label style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; display: block; margin-bottom: 4px;">Inicial</label>
                    <input type="number" class="regiao-inicial-input" data-reg="${reg}" value="${inicialExibicao}" placeholder="Inicial" step="1" ${readonlyAttr}${readonlyStyle}>
                </div>
                <div style="flex: 1;">
                    <label style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; display: block; margin-bottom: 4px;">Gasto</label>
                    <input type="number" class="regiao-gasto-input" data-reg="${reg}" value="${gastoExibicao}" placeholder="Gasto" step="1" ${readonlyAttr}${readonlyStyle}>
                </div>
                <div style="flex: 1;">
                    <label style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; display: block; margin-bottom: 4px;">Preço</label>
                    <input type="text" class="regiao-preco-input" data-reg="${reg}" value="${precoValor}" placeholder="Preço" ${readonlyAttr}${readonlyStyle}>
                </div>
            </div>
        `;
        regioesDiv.appendChild(regDiv);
    }
    
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
    
    // Coletar dados das regiões
    const regioes = {};
    const regioesInicialInputs = document.querySelectorAll('.regiao-inicial-input');
    const regioesGastoInputs = document.querySelectorAll('.regiao-gasto-input');
    const regioesPrecoInputs = document.querySelectorAll('.regiao-preco-input');
    
    regioesInicialInputs.forEach(input => {
        const reg = input.getAttribute('data-reg');
        if (!regioes[reg]) regioes[reg] = {};
        regioes[reg].inicial = input.value || '__';
    });
    
    regioesGastoInputs.forEach(input => {
        const reg = input.getAttribute('data-reg');
        if (!regioes[reg]) regioes[reg] = { inicial: '__' };
        regioes[reg].gasto = input.value || '0';
    });
    
    regioesPrecoInputs.forEach(input => {
        const reg = input.getAttribute('data-reg');
        if (!regioes[reg]) regioes[reg] = { inicial: '__' };
        regioes[reg].preco = input.value || '0';
    });
    
    try {
        // Atualizar via API
        await APIClient.atualizarEstoqueItem(item.id, regioes);
        
        // Atualizar localmente (merge para preservar campos existentes)
        Object.keys(regioes).forEach(reg => {
            if (!item.regioes[reg]) item.regioes[reg] = {};
            // Fazer merge para preservar 'gasto' e outros campos
            item.regioes[reg] = {
                ...item.regioes[reg],
                ...regioes[reg]
            };
        });
        
        alert('Estoque atualizado com sucesso!');
        fecharModalAlimentacao();
        renderizarItensAlimentacao();
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar dados: ' + error.message);
    }
});

// ========================================
// EMISSÃO DE ORDENS DE SERVIÇO
// ========================================

function renderizarEmitirOS() {
    // Limpar itens anteriores
    document.getElementById('itens-os').innerHTML = '';
    // Adicionar um item inicial
    adicionarItemOS();
    
    // ✅ CORRIGIR: Restaurar botões do formulário
    const containerBotoes = document.getElementById('botoes-formulario-os');
    if (containerBotoes) {
        containerBotoes.innerHTML = `
            <button type="button" class="btn-small btn-primary" onclick="visualizarOS()">👁️ Visualizar O.S.</button>
            <button type="submit" class="btn-small btn-success">✅ Emitir O.S.</button>
        `;
    }
}

function adicionarItemOS() {
    const container = document.getElementById('itens-os');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-os';
    itemDiv.innerHTML = `
        <div class="form-row">
            <div class="form-field">
                <label class="field-label">Categoria</label>
                <select class="os-categoria" onchange="atualizarItensOS(this)">
                    <option value="">Selecione Categoria</option>
                    <option value="coffee_break_bebidas_quentes">Coffee Break e Bebidas Quentes</option>
                    <option value="fornecimento_agua_mineral">Fornecimento de Água Mineral</option>
                    <option value="kit_lanche">Kit Lanche</option>
                    <option value="fornecimento_biscoitos">Fornecimento de Biscoitos</option>
                    <option value="almoco_jantar">Almoço/Jantar</option>
                </select>
            </div>
            <div class="form-field">
                <label class="field-label">Item</label>
                <select class="os-item">
                    <option value="">Selecione Item</option>
                </select>
            </div>
            <div class="form-field">
                <label class="field-label">Diárias</label>
                <input type="number" class="os-diarias" placeholder="Diárias" min="1" value="1">
            </div>
            <div class="form-field">
                <label class="field-label">Qtd</label>
                <input type="number" class="os-quantidade" placeholder="Qtd" min="0">
            </div>
        </div>
        <button type="button" class="btn-small btn-danger" onclick="removerItemOS(this)">🗑️ Remover</button>
    `;
    container.appendChild(itemDiv);
}

function atualizarItensOS(select) {
    // Buscar no form-row (pai do form-field)
    const formRow = select.closest('.form-row');
    const itemSelect = formRow.querySelector('.os-item');
    const categoria = select.value;
    itemSelect.innerHTML = '<option value="">Selecione Item</option>';
    if (categoria && dadosAlimentacao[categoria]) {
        dadosAlimentacao[categoria].itens.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;  // ✅ Database ID
            option.textContent = item.descricao;
            option.setAttribute('data-unidade', item.unidade);
            option.setAttribute('data-item-bec', item.natureza);  // ✅ Código BEC da CATEGORIA
            itemSelect.appendChild(option);
        });
    }
}

function removerItemOS(btn) {
    btn.parentElement.remove();
}

async function visualizarOS() {
    const form = document.getElementById('form-emitir-os');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const dadosOS = coletarDadosOS();
    if (!dadosOS) return;
    
    // 🔍 DEBUG: Verificar dados coletados
    console.log('\n' + '='.repeat(60));
    console.log('🔍 DEBUG visualizarOS() - Dados coletados do formulário:');
    console.log('='.repeat(60));
    console.log('Total de itens:', dadosOS.itens.length);
    dadosOS.itens.forEach((item, idx) => {
        console.log(`\nItem ${idx + 1}:`);
        console.log('  Descrição:', item.descricao);
        console.log('  Diárias:', item.diarias, typeof item.diarias);
        console.log('  Qtd Solicitada:', item.qtdSolicitada, typeof item.qtdSolicitada);
        console.log('  Qtd Total:', item.qtdTotal, typeof item.qtdTotal);
    });
    console.log('='.repeat(60) + '\n');

    // 🔢 Buscar próximo número do backend se for nova O.S.
    if (!osEditandoId) {
        try {
            const response = await fetch('/api/ordens-servico/proximo-numero');
            const data = await response.json();
            dadosOS.numeroOS = data.proximoNumero;
            console.log('🔢 Próximo número obtido do backend:', dadosOS.numeroOS);
        } catch (error) {
            console.error('❌ Erro ao buscar próximo número:', error);
            alert('Erro ao buscar número da O.S. Verifique a conexão com o servidor.');
            return;
        }
    }

    const preview = gerarPreviewOS(dadosOS);
    document.getElementById('preview-os').innerHTML = preview;
    document.getElementById('modal-visualizar-os').style.display = 'flex';
}

function fecharModalVisualizarOS() {
    const modal = document.getElementById('modal-visualizar-os');
    modal.style.display = 'none';
    
    // Limpar conteúdo para evitar exibir dados antigos na próxima abertura
    const preview = document.getElementById('preview-os');
    if (preview) {
        preview.innerHTML = '<p style="text-align: center; padding: 20px;">Carregando...</p>';
    }
}

function coletarDadosOS() {
    const itensOS = [];
    const itemDivs = document.querySelectorAll('.item-os');
    
    itemDivs.forEach((div, index) => {
        const categoria = div.querySelector('.os-categoria').value;
        const itemSelect = div.querySelector('.os-item');
        const itemId = parseInt(itemSelect.value);  // ✅ CORRIGIDO: agora é o ID do banco (número)
        const diarias = parseInt(div.querySelector('.os-diarias').value) || 1;
        const quantidade = parseFloat(div.querySelector('.os-quantidade').value) || 0;
        
        if (categoria && itemId && quantidade) {
            // ✅ CORRIGIDO: buscar item pelo ID (campo 'id') ao invés de 'item'
            const item = dadosAlimentacao[categoria].itens.find(i => i.id === itemId);
            const selectedOption = itemSelect.options[itemSelect.selectedIndex];
            const itemBec = selectedOption.getAttribute('data-item-bec') || dadosAlimentacao[categoria].natureza;
            
            // Buscar preço baseado na região selecionada (grupo)
            const grupoSelect = document.getElementById('os-grupo-select');
            const grupo = grupoSelect ? grupoSelect.value : document.getElementById('os-grupo').value || '1';
            
            // Pegar preço da região correspondente ao grupo
            let valorUnit = 0;
            if (item.regioes && item.regioes[grupo] && item.regioes[grupo].preco) {
                try {
                    const precoStr = item.regioes[grupo].preco.replace('.', '').replace(',', '.');
                    valorUnit = parseFloat(precoStr) || 0;
                } catch (e) {
                    valorUnit = 0;
                }
            }
            
            itensOS.push({
                num: index + 1,
                descricao: item.descricao,
                unidade: item.unidade,
                itemBec: itemBec,  // ✅ CORRIGIDO: usar código BEC do data attribute
                diarias: diarias,
                qtdSolicitada: quantidade,
                qtdTotal: diarias * quantidade,
                valorUnit: valorUnit,
                categoria,
                itemId  // ✅ CORRIGIDO: agora é o ID correto do banco
            });
        }
    });

    if (itensOS.length === 0) {
        alert('Adicione pelo menos um item à O.S.');
        return null;
    }

    return {
        contratoNum: document.getElementById('os-contrato-num').value,
        dataAssinatura: document.getElementById('os-data-assinatura').value,
        prazoVigencia: document.getElementById('os-prazo-vigencia').value,
        detentora: document.getElementById('os-detentora').value,
        cnpj: document.getElementById('os-cnpj').value,
        servico: document.getElementById('os-servico').value,
        grupo: document.getElementById('os-grupo').value,
        evento: document.getElementById('os-evento').value,
        dataEvento: document.getElementById('os-data-evento').value,
        horario: document.getElementById('os-horario').value,
        local: document.getElementById('os-local').value,
        justificativa: document.getElementById('os-justificativa').value,
        observacoes: document.getElementById('os-observacoes').value,  // ✅ Adicionar observações
        gestor: document.getElementById('os-gestor').value,
        fiscal: document.getElementById('os-fiscal').value,
        fiscalTipo: document.getElementById('os-fiscal-tipo').value,  // ✅ Adicionar tipo de fiscal
        responsavel: document.getElementById('os-responsavel').value,
        itens: itensOS,
        dataEmissao: new Date().toLocaleDateString('pt-BR'),
        numeroOS: `${proximoIdOS}/2025`
    };
}

function gerarPreviewOS(dados) {
    const valorTotal = dados.itens.reduce((sum, item) => sum + (item.valorUnit * item.qtdTotal), 0);
    
    return `
        <div class="os-document">
            <div class="os-header">
                <img src="/static/timbrado.png" alt="Logo" class="os-logo-img">
                <div class="os-title">
                    <h2>GOVERNO DO ESTADO DE SÃO PAULO</h2>
                    <h3>SECRETARIA DE ESTADO DA EDUCAÇÃO</h3>
                    <h3>DEPARTAMENTO DE ADMINISTRAÇÃO</h3>
                    <h2 style="margin-top: 10px;">ORDEM DE SERVIÇO</h2>
                </div>
                <div class="os-info-box">
                    <div>DATA DE EMISSÃO:</div>
                    <div><strong>${dados.dataEmissao}</strong></div>
                    <div style="margin-top: 5px;">NÚMERO:</div>
                    <div><strong>${dados.numeroOS}</strong></div>
                </div>
            </div>

            <div class="os-section">
                <table class="os-table">
                    <tr>
                        <td style="width: 30%;"><strong>CONTRATO Nº:</strong></td>
                        <td>${dados.contratoNum || ''}</td>
                        <td style="width: 30%;"><strong>DATA ASSINATURA:</strong></td>
                        <td>${dados.dataAssinatura || ''}</td>
                    </tr>
                    <tr>
                        <td><strong>DETENTORA:</strong></td>
                        <td colspan="3">${dados.detentora}</td>
                    </tr>
                    <tr>
                        <td><strong>SERVIÇO:</strong></td>
                        <td>${dados.servico || 'COFFEE BREAK'}</td>
                        <td><strong>PRAZO VIGÊNCIA:</strong></td>
                        <td>${dados.prazoVigencia || ''}</td>
                    </tr>
                    <tr>
                        <td><strong>CNPJ:</strong></td>
                        <td>${dados.cnpj}</td>
                        <td><strong>GRUPO:</strong></td>
                        <td>${dados.grupo || ''}</td>
                    </tr>
                </table>
            </div>

            <div class="os-section">
                <table class="os-table">
                    <tr>
                        <td style="width: 30%;"><strong>EVENTO:</strong></td>
                        <td colspan="3">${dados.evento}</td>
                    </tr>
                    <tr>
                        <td><strong>DATA:</strong></td>
                        <td colspan="3">${dados.dataEvento}</td>
                    </tr>
                    <tr>
                        <td><strong>HORÁRIO DO EVENTO:</strong></td>
                        <td colspan="3">${dados.horario || ''}</td>
                    </tr>
                    <tr>
                        <td><strong>LOCAL DO EVENTO:</strong></td>
                        <td colspan="3">${dados.local}</td>
                    </tr>
                    <tr>
                        <td><strong>RESPONSÁVEL:</strong></td>
                        <td colspan="3">${dados.responsavel || ''}</td>
                    </tr>
                </table>
            </div>

            <div class="os-section">
                <table class="os-items-table">
                    <thead>
                        <tr style="background-color: #c6e0b4;">
                            <th style="width: 5%;">Nº</th>
                            <th style="width: 25%;">DESCRIÇÃO</th>
                            <th style="width: 10%;">ITEM BEC</th>
                            <th style="width: 8%;">DIÁRIAS</th>
                            <th style="width: 10%;">QTDE<br/>SOLICITADA</th>
                            <th style="width: 12%;">QTDE<br/>SOLICITADA<br/>TOTAL</th>
                            <th style="width: 15%;">VALOR UNIT.</th>
                            <th style="width: 15%;">VALOR<br/>TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dados.itens.map(item => {
                            const diarias = item.diarias || 1;
                            const qtdSolicitada = item.qtdSolicitada || (item.qtdTotal / diarias);
                            const qtdTotal = item.qtdTotal;
                            const valorTotal = item.valorUnit * qtdTotal;
                            
                            // Formatar números com separador de milhares
                            const qtdSolFmt = qtdSolicitada.toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 0});
                            const qtdTotalFmt = qtdTotal.toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 0});
                            const valorTotalFmt = valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                            
                            return `
                            <tr style="background-color: #e2efd9;">
                                <td style="text-align: center;">${item.num}</td>
                                <td style="text-align: left; padding-left: 8px;">${item.descricao}</td>
                                <td style="text-align: center;">${item.itemBec || ''}</td>
                                <td style="text-align: center;">${diarias}</td>
                                <td style="text-align: right; padding-right: 8px;">${qtdSolFmt}</td>
                                <td style="text-align: right; padding-right: 8px;">${qtdTotalFmt}</td>
                                <td style="text-align: right; padding-right: 8px;">R$ ${item.valorUnit.toFixed(2).replace('.', ',')}</td>
                                <td style="text-align: right; padding-right: 8px;">R$ ${valorTotalFmt}</td>
                            </tr>
                        `}).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #c6e0b4;">
                            <td colspan="7" style="text-align: right; padding-right: 8px;"><strong>VALOR TOTAL:</strong></td>
                            <td style="text-align: right; padding-right: 8px;"><strong>R$ ${valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="os-section">
                <p style="margin: 5px 0;"><strong>JUSTIFICATIVA:</strong></p>
                <div class="os-justificativa">${(dados.justificativa || '').replace(/\n/g, '<br>')}</div>
            </div>

            ${dados.observacoes ? `
            <div class="os-section">
                <p style="margin: 5px 0;"><strong>OBSERVAÇÕES:</strong></p>
                <div class="os-justificativa">${dados.observacoes.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}

            <div class="os-footer">
                <p style="text-align: center; margin-bottom: 20px;">São Paulo, ${formatarDataExtenso(dados.dataEmissao)}.</p>
                <div class="os-signatures">
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <p><strong>${dados.gestor}</strong></p>
                        <p>Gestor do Contrato</p>
                    </div>
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <p><strong>${dados.fiscal}</strong></p>
                        <p>${dados.fiscalTipo || 'Fiscal do Contrato'}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Função auxiliar para formatar data no formato extenso
function formatarDataExtenso(dataStr) {
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                   'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    let data;
    if (dataStr && dataStr.includes('/')) {
        const [dia, mes, ano] = dataStr.split('/');
        data = new Date(ano, mes - 1, dia);
    } else {
        data = new Date();
    }
    
    return `${data.getDate()} de ${meses[data.getMonth()]} de ${data.getFullYear()}`;
}

// Formulário de Emissão de O.S.
document.getElementById('form-emitir-os').addEventListener('submit', function(e) {
    e.preventDefault();
    visualizarOS();
});

async function confirmarEmissaoOS() {
    const dadosOS = coletarDadosOS();
    if (!dadosOS) return;
    
    console.log('🔍 confirmarEmissaoOS - Modo:', osEditandoId ? 'EDIÇÃO' : 'CRIAÇÃO');
    console.log('📋 osEditandoId:', osEditandoId);
    
    // 🔍 DEBUG: Verificar dados ANTES do mapeamento
    console.log('\n' + '='.repeat(60));
    console.log('� DEBUG confirmarEmissaoOS() - ANTES do mapeamento:');
    console.log('='.repeat(60));
    dadosOS.itens.forEach((item, idx) => {
        console.log(`\nItem ${idx + 1}:`);
        console.log('  Descrição:', item.descricao);
        console.log('  Diárias:', item.diarias, typeof item.diarias);
        console.log('  Qtd Solicitada:', item.qtdSolicitada, typeof item.qtdSolicitada);
        console.log('  Qtd Total:', item.qtdTotal, typeof item.qtdTotal);
    });
    console.log('='.repeat(60) + '\n');
    
    try {
        // Mapear dados para o formato esperado pela API
        const dadosAPI = {
            numeroOS: dadosOS.numeroOS,
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
            justificativa: dadosOS.justificativa,
            observacoes: dadosOS.observacoes,  // ✅ Adicionar observações
            gestorContrato: dadosOS.gestor,
            fiscalContrato: dadosOS.fiscal,
            fiscalTipo: dadosOS.fiscalTipo,  // ✅ Adicionar tipo de fiscal
            responsavel: dadosOS.responsavel,
            itens: dadosOS.itens.map(item => ({
                categoria: item.categoria,
                itemId: item.itemId,
                itemBec: item.itemBec,
                descricao: item.descricao,
                unidade: item.unidade,
                diarias: item.diarias,  // ✅ Adicionar diárias
                qtdSolicitada: item.qtdSolicitada,  // ✅ Adicionar quantidade solicitada
                qtdTotal: item.qtdTotal
            }))
        };
        
        // 🔍 DEBUG: Verificar dados DEPOIS do mapeamento
        console.log('\n' + '='.repeat(60));
        console.log('🔍 DEBUG confirmarEmissaoOS() - DEPOIS do mapeamento (dadosAPI):');
        console.log('='.repeat(60));
        dadosAPI.itens.forEach((item, idx) => {
            console.log(`\nItem ${idx + 1}:`);
            console.log('  Descrição:', item.descricao);
            console.log('  Diárias:', item.diarias, typeof item.diarias);
            console.log('  Qtd Solicitada:', item.qtdSolicitada, typeof item.qtdSolicitada);
            console.log('  Qtd Total:', item.qtdTotal, typeof item.qtdTotal);
        });
        console.log('='.repeat(60) + '\n');
        
        console.log('🚀 Dados para enviar à API:', dadosAPI);
        
        // Verificar se é criação ou atualização
        const eraEdicao = !!osEditandoId; // Guardar estado antes de zerar
        
        if (osEditandoId) {
            // Atualizar O.S. existente (chamado pelo modal de visualização)
            console.log(`📡 Enviando PUT para /api/ordens-servico/${osEditandoId}`);
            const osAtualizada = await APIClient.atualizarOrdemServico(osEditandoId, dadosAPI);
            console.log('✅ Resposta da API:', osAtualizada);
            alert('O.S. atualizada com sucesso! Estoque recalculado.');
            
            // Limpar estado de edição
            osEditandoId = null;
            
            // Restaurar botões originais
            const containerBotoes = document.getElementById('botoes-formulario-os');
            containerBotoes.innerHTML = `
                <button type="button" class="btn-small btn-primary" onclick="visualizarOS()">👁️ Visualizar O.S.</button>
                <button type="submit" class="btn-small btn-success">✅ Emitir O.S.</button>
            `;
        } else {
            // Criar nova O.S.
            const novaOS = await APIClient.criarOrdemServico(dadosAPI);
            alert('O.S. emitida com sucesso! Estoque atualizado.');
        }
        
        // Limpar formulário e fechar modal
        document.getElementById('form-emitir-os').reset();
        document.getElementById('itens-os').innerHTML = '';
        limparCamposDetentora(); // Limpar campos da Detentora também
        
        // Recarregar dados ANTES de fechar modal
        console.log('🔄 Recarregando alimentação...');
        await renderizarAlimentacao();
        console.log('🔄 Recarregando lista de O.S. do banco...');
        await renderizarOrdensServico();
        console.log('✅ Listas recarregadas com dados atualizados do banco!');
        
        // Agora sim fechar modal
        fecharModalVisualizarOS();
        renderizarEmitirOS();
        
        // Se criou nova O.S. (não edição), redirecionar para página de O.S.
        if (!eraEdicao) {
            console.log('📂 Nova O.S. criada - redirecionando para lista de Ordens de Serviço');
            // Pequeno delay para garantir que o formulário foi limpo antes de redirecionar
            setTimeout(() => {
                window.location.href = '/ordens-servico';
            }, 100);
        }
        
    } catch (error) {
        console.error('❌ Erro ao emitir O.S.:', error);
        alert('Erro ao emitir O.S.: ' + error.message);
    }
}

// ========================================
// VISUALIZAR ORDENS DE SERVIÇO
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
            container.innerHTML = '<p class="empty-message">Nenhuma Ordem de Serviço encontrada.</p>';
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

function normalizarDadosOS(os) {
    // Função para formatar data ISO para pt-BR
    const formatarData = (dataISO) => {
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
        observacoes: os.observacoes || '',  // ✅ Adicionar observações
        gestor: os.gestorContrato || os.gestor || '',
        fiscal: os.fiscalContrato || os.fiscal || '',
        fiscalTipo: os.fiscalTipo || 'Fiscal do Contrato',  // ✅ Adicionar tipo de fiscal
        // Formatar data de emissão corretamente
        dataEmissao: os.dataEmissaoCompleta ? formatarData(os.dataEmissaoCompleta) : (os.dataEmissao ? formatarData(os.dataEmissao) : new Date().toLocaleDateString('pt-BR')),
        itens: (os.itens || []).map((item, index) => ({
            num: item.num || index + 1,
            descricao: item.descricao,
            itemBec: item.itemBec || '',
            diarias: item.diarias || 1,
            qtdSolicitada: item.qtdSolicitada || item.qtdTotal,
            qtdTotal: item.qtdTotal,
            valorUnit: item.valorUnit || 0,
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
    
    try {
        console.log(`🗑️ Excluindo O.S. ${numeroOS} (ID: ${osId})...`);
        
        // Chamar API para deletar
        await APIClient.deletarOrdemServico(osId);
        
        console.log('✅ O.S. excluída com sucesso!');
        alert(`✅ O.S. ${numeroOS} excluída com sucesso!\n\nO estoque foi revertido automaticamente.`);
        
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
        
        console.log('� Dados da API - Evento:', os.evento);
        console.log('� Dados da API - Justificativa:', os.justificativa?.substring(0, 50) + '...');
        
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
        document.getElementById('os-observacoes').value = os.observacoes || '';  // ✅ Adicionar observações
        document.getElementById('os-gestor').value = os.gestorContrato || '';
        document.getElementById('os-fiscal').value = os.fiscalContrato || '';
        document.getElementById('os-fiscal-tipo').value = os.fiscalTipo || 'Fiscal do Contrato';  // ✅ Adicionar tipo de fiscal
        document.getElementById('os-responsavel').value = os.responsavel || '';
        
        // Limpar itens existentes
        document.getElementById('itens-os').innerHTML = '';
        
        // Adicionar itens da O.S.
        if (os.itens && os.itens.length > 0) {
            for (const item of os.itens) {
                await adicionarItemOS();
                
                // Aguardar para garantir que o item foi adicionado
                await new Promise(resolve => setTimeout(resolve, 50));
                
                const itemDivs = document.querySelectorAll('.item-os');
                const ultimoItem = itemDivs[itemDivs.length - 1];
                
                if (ultimoItem) {
                    // Preencher categoria
                    const categoriaSelect = ultimoItem.querySelector('.os-categoria');
                    categoriaSelect.value = item.categoria;
                    
                    // Disparar evento change para carregar itens
                    categoriaSelect.dispatchEvent(new Event('change'));
                    
                    // Aguardar carregamento dos itens
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Preencher item
                    const itemSelect = ultimoItem.querySelector('.os-item');
                    itemSelect.value = item.itemId;  // ✅ CORRIGIDO: agora itemId retorna o ID correto do banco
                    
                    // Preencher diárias
                    const diariasInput = ultimoItem.querySelector('.os-diarias');
                    diariasInput.value = item.diarias || 1;
                    
                    // Preencher quantidade solicitada (não total!)
                    const qtdInput = ultimoItem.querySelector('.os-quantidade');
                    qtdInput.value = item.qtdSolicitada || item.quantidade_solicitada || (item.qtdTotal || item.quantidade_total) / (item.diarias || 1);
                }
            }
        }
        
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
        document.getElementById('os-gestor').value = os.gestorContrato || '';
        document.getElementById('os-fiscal').value = os.fiscalContrato || '';
        document.getElementById('os-fiscal-tipo').value = os.fiscalTipo || 'Fiscal do Contrato';
        document.getElementById('os-responsavel').value = os.responsavel || '';
        
        // Limpar itens existentes
        document.getElementById('itens-os').innerHTML = '';
        
        // Adicionar itens da O.S.
        if (os.itens && os.itens.length > 0) {
            for (const item of os.itens) {
                await adicionarItemOS();
                
                // Aguardar para garantir que o item foi adicionado
                await new Promise(resolve => setTimeout(resolve, 50));
                
                const itemDivs = document.querySelectorAll('.item-os');
                const ultimoItem = itemDivs[itemDivs.length - 1];
                
                if (ultimoItem) {
                    // Preencher categoria
                    const categoriaSelect = ultimoItem.querySelector('.os-categoria');
                    categoriaSelect.value = item.categoria;
                    
                    // Disparar evento change para carregar itens
                    categoriaSelect.dispatchEvent(new Event('change'));
                    
                    // Aguardar carregamento dos itens
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Preencher item
                    const itemSelect = ultimoItem.querySelector('.os-item');
                    itemSelect.value = item.itemId;  // ✅ CORRIGIDO: agora itemId retorna o ID correto do banco
                    
                    // Preencher diárias
                    const diariasInput = ultimoItem.querySelector('.os-diarias');
                    diariasInput.value = item.diarias || 1;
                    
                    // Preencher quantidade solicitada
                    const qtdInput = ultimoItem.querySelector('.os-quantidade');
                    qtdInput.value = item.qtdSolicitada || item.quantidade_solicitada || (item.qtdTotal || item.quantidade_total) / (item.diarias || 1);
                }
            }
        }
        
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
        
        // Restaurar botões originais
        const containerBotoes = document.getElementById('botoes-formulario-os');
        containerBotoes.innerHTML = `
            <button type="button" class="btn-small btn-primary" onclick="visualizarOS()">👁️ Visualizar O.S.</button>
            <button type="submit" class="btn-small btn-success">✅ Emitir O.S.</button>
        `;
        
        // Limpar formulário
        document.getElementById('form-emitir-os').reset();
        document.getElementById('itens-os').innerHTML = '';
        limparCamposDetentora(); // Limpar campos da Detentora também
        
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
    
    // Limpar formulário
    document.getElementById('form-emitir-os').reset();
    document.getElementById('itens-os').innerHTML = '';
    limparCamposDetentora(); // Limpar campos da Detentora também
    
    // Restaurar botões originais
    const containerBotoes = document.getElementById('botoes-formulario-os');
    containerBotoes.innerHTML = `
        <button type="button" class="btn-small btn-primary" onclick="visualizarOS()">👁️ Visualizar O.S.</button>
        <button type="submit" class="btn-small btn-success">✅ Emitir O.S.</button>
    `;
    
    alert('✅ Edição cancelada. Formulário limpo.');
}

// Modal de Item
let itemEditandoId = null;

function mostrarModalNovoItem() {
    itemEditandoId = null;
    document.getElementById('modal-titulo').textContent = 'Adicionar Item ao Estoque';
    document.getElementById('form-item').reset();
    document.getElementById('item-unidade').value = 'unidade';
    document.getElementById('modal-item').style.display = 'flex';
}

function editarItem(id) {
    const item = estoque.find(i => i.id === id);
    if (!item) return;
    
    itemEditandoId = id;
    document.getElementById('modal-titulo').textContent = 'Editar Item';
    document.getElementById('item-categoria').value = item.categoria;
    document.getElementById('item-nome').value = item.nome;
    document.getElementById('item-quantidade').value = item.quantidade;
    document.getElementById('item-unidade').value = item.unidade;
    document.getElementById('modal-item').style.display = 'flex';
}

function fecharModalItem() {
    document.getElementById('modal-item').style.display = 'none';
    itemEditandoId = null;
}

function removerItem(id) {
    if (!confirm('Deseja realmente remover este item do estoque?')) return;
    
    estoque = estoque.filter(item => item.id !== id);
    salvarDados();
    renderizarEstoque();
}

// ========================================
// NOVA REQUISIÇÃO
// ========================================

function adicionarItemRequisicao() {
    const container = document.getElementById('itens-requisicao');
    const index = container.children.length;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-requisicao';
    itemDiv.innerHTML = `
        <div class="form-row">
            <div class="form-group flex-2">
                <label>Item *</label>
                <select class="req-item-select" required onchange="atualizarEstoqueDisponivel(this)">
                    <option value="">Selecione um item</option>
                    ${estoque.map(item => `
                        <option value="${item.id}" data-max="${item.quantidade}" data-unidade="${item.unidade}">
                            ${item.nome} (Disponível: ${item.quantidade} ${item.unidade})
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Quantidade *</label>
                <input type="number" class="req-item-qtd" min="1" required>
            </div>
            <div class="form-group form-group-btn">
                <button type="button" class="btn-small btn-danger" onclick="removerItemRequisicao(this)">🗑️</button>
            </div>
        </div>
        <small class="estoque-info"></small>
    `;
    
    container.appendChild(itemDiv);
}

function removerItemRequisicao(btn) {
    btn.closest('.item-requisicao').remove();
}

function atualizarEstoqueDisponivel(select) {
    const itemDiv = select.closest('.item-requisicao');
    const info = itemDiv.querySelector('.estoque-info');
    const qtdInput = itemDiv.querySelector('.req-item-qtd');
    
    const option = select.options[select.selectedIndex];
    const max = parseInt(option.getAttribute('data-max')) || 0;
    const unidade = option.getAttribute('data-unidade') || 'unidade';
    
    qtdInput.max = max;
    qtdInput.value = Math.min(1, max);
    
    if (max === 0) {
        info.textContent = '⚠️ Item sem estoque disponível';
        info.style.color = '#dc3545';
        qtdInput.disabled = true;
    } else if (max < 5) {
        info.textContent = `⚠️ Estoque baixo: apenas ${max} ${unidade} disponível(is)`;
        info.style.color = '#ff9800';
        qtdInput.disabled = false;
    } else {
        info.textContent = `✓ ${max} ${unidade} disponível(is)`;
        info.style.color = '#28a745';
        qtdInput.disabled = false;
    }
}

// ========================================
// FORMULÁRIOS
// ========================================

function configurarFormularios() {
    // Form: Adicionar/Editar Item
    document.getElementById('form-item').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const dados = {
            categoria: document.getElementById('item-categoria').value,
            nome: document.getElementById('item-nome').value,
            quantidade: parseInt(document.getElementById('item-quantidade').value),
            unidade: document.getElementById('item-unidade').value
        };
        
        if (itemEditandoId) {
            // Editar
            const item = estoque.find(i => i.id === itemEditandoId);
            Object.assign(item, dados);
        } else {
            // Adicionar
            estoque.push({
                id: proximoIdEstoque++,
                ...dados,
                dataCadastro: new Date().toISOString()
            });
        }
        
        salvarDados();
        fecharModalItem();
        renderizarEstoque();
    });
    
    // Form: Nova Requisição
    document.getElementById('form-requisicao').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const itensReq = [];
        const itensDiv = document.querySelectorAll('#itens-requisicao .item-requisicao');
        
        if (itensDiv.length === 0) {
            alert('Adicione pelo menos um item à requisição.');
            return;
        }
        
        let temErro = false;
        itensDiv.forEach(div => {
            const select = div.querySelector('.req-item-select');
            const qtdInput = div.querySelector('.req-item-qtd');
            
            // Verificar se os elementos existem
            if (!select || !qtdInput) {
                return; // Pula este item se os elementos não existem
            }
            
            const itemId = parseInt(select.value);
            const qtd = parseInt(qtdInput.value);
            
            // Se não tiver valor selecionado, pula (não considera erro)
            if (!itemId || !qtd || isNaN(qtd)) {
                return;
            }
            
            const item = estoque.find(i => i.id === itemId);
            
            if (!item) {
                alert('Item não encontrado no estoque.');
                temErro = true;
                return;
            }
            
            if (qtd > item.quantidade) {
                alert(`Quantidade solicitada de "${item.nome}" excede o estoque disponível.`);
                temErro = true;
                return;
            }
            
            itensReq.push({
                itemId: itemId,
                itemNome: item.nome,
                quantidade: qtd,
                unidade: item.unidade
            });
        });
        
        if (temErro) return;
        
        // Verificar se pelo menos um item válido foi adicionado
        if (itensReq.length === 0) {
            alert('Adicione pelo menos um item válido à requisição.');
            return;
        }
        
        const requisicao = {
            id: proximoIdRequisicao++,
            solicitante: document.getElementById('req-solicitante').value,
            recebedor: document.getElementById('req-recebedor').value,
            dataUso: document.getElementById('req-data-uso').value,
            observacao: document.getElementById('req-observacao').value,
            itens: itensReq,
            status: 'pendente',
            dataSolicitacao: new Date().toISOString()
        };
        
        requisicoes.push(requisicao);
        salvarDados();
        
        alert('Requisição enviada com sucesso! Aguarde aprovação.');
        this.reset();
        document.getElementById('itens-requisicao').innerHTML = '';
        inicializarDataAtual();
        
        atualizarInterface();
    });
    
    // Form: Criar/Editar Kit
    document.getElementById('form-kit').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const itensKitDiv = document.querySelectorAll('#itens-kit .item-requisicao');
        
        if (itensKitDiv.length === 0) {
            alert('Adicione pelo menos um item ao kit.');
            return;
        }
        
        const itensKit = [];
        let valid = true;
        
        itensKitDiv.forEach(div => {
            const select = div.querySelector('.kit-item-select');
            const qtdInput = div.querySelector('.kit-item-qtd');
            
            // Verificar se os elementos existem
            if (!select || !qtdInput) {
                valid = false;
                return;
            }
            
            const itemId = parseInt(select.value);
            const qtd = parseInt(qtdInput.value);
            
            if (!itemId || !qtd) {
                valid = false;
                return;
            }
            
            const item = estoque.find(i => i.id === itemId);
            
            if (!item) {
                alert('Item não encontrado no estoque.');
                valid = false;
                return;
            }
            
            itensKit.push({
                itemId: itemId,
                itemNome: item.nome,
                quantidade: qtd,
                unidade: item.unidade
            });
        });
        
        if (!valid) {
            alert('Preencha todos os campos do kit.');
            return;
        }
        
        const dadosKit = {
            nome: document.getElementById('kit-nome').value,
            descricao: document.getElementById('kit-descricao').value,
            itens: itensKit
        };
        
        if (kitEditandoId) {
            // Editar kit existente
            const kit = kits.find(k => k.id === kitEditandoId);
            Object.assign(kit, dadosKit);
        } else {
            // Criar novo kit
            kits.push({
                id: proximoIdKit++,
                ...dadosKit,
                dataCriacao: new Date().toISOString()
            });
        }
        
        salvarDados();
        fecharModalKit();
        alert('Kit salvo com sucesso!');
        atualizarInterface();
    });
}

// ========================================
// REQUISIÇÕES PENDENTES
// ========================================

function renderizarPendentes() {
    const container = document.getElementById('lista-pendentes');
    const pendentes = requisicoes.filter(r => r.status === 'pendente');
    
    container.innerHTML = '';
    
    if (pendentes.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma requisição pendente.</p>';
        return;
    }
    
    pendentes.forEach(req => {
        const card = document.createElement('div');
        card.className = 'requisicao-card';
        
        card.innerHTML = `
            <div class="req-header">
                <div>
                    <strong>Requisição #${req.id}</strong>
                    <span class="badge badge-warning">Pendente</span>
                </div>
                <small>${formatarData(req.dataSolicitacao)}</small>
            </div>
            <div class="req-body">
                <p><strong>Solicitante:</strong> ${req.solicitante}</p>
                <p><strong>Recebedor:</strong> ${req.recebedor}</p>
                <p><strong>Data de uso:</strong> ${formatarDataSimples(req.dataUso)}</p>
                <p><strong>Itens:</strong> ${req.itens.length} item(ns)</p>
                ${req.observacao ? `<p><strong>Obs:</strong> ${req.observacao}</p>` : ''}
            </div>
            <div class="req-footer">
                <button class="btn-small btn-secondary" onclick="verDetalhesRequisicao(${req.id})">👁️ Detalhes</button>
                <button class="btn-small btn-success" onclick="aprovarRequisicao(${req.id})">✓ Aprovar</button>
                <button class="btn-small btn-danger" onclick="rejeitarRequisicao(${req.id})">✗ Rejeitar</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function verDetalhesRequisicao(id) {
    const req = requisicoes.find(r => r.id === id);
    if (!req) return;
    
    const detalhes = document.getElementById('detalhes-requisicao');
    
    detalhes.innerHTML = `
        <h2>Requisição #${req.id}</h2>
        <div class="detalhes-grid">
            <div class="detalhe-item">
                <strong>Status:</strong>
                <span class="badge badge-${req.status === 'pendente' ? 'warning' : req.status === 'aprovada' ? 'success' : 'danger'}">
                    ${req.status.toUpperCase()}
                </span>
            </div>
            <div class="detalhe-item">
                <strong>Solicitante:</strong> ${req.solicitante}
            </div>
            <div class="detalhe-item">
                <strong>Recebedor:</strong> ${req.recebedor}
            </div>
            <div class="detalhe-item">
                <strong>Data de Uso:</strong> ${formatarDataSimples(req.dataUso)}
            </div>
            <div class="detalhe-item">
                <strong>Data de Solicitação:</strong> ${formatarData(req.dataSolicitacao)}
            </div>
            ${req.dataAprovacao ? `
                <div class="detalhe-item">
                    <strong>Data de ${req.status === 'aprovada' ? 'Aprovação' : 'Rejeição'}:</strong> 
                    ${formatarData(req.dataAprovacao)}
                </div>
            ` : ''}
            ${req.aprovadoPor ? `
                <div class="detalhe-item">
                    <strong>${req.status === 'aprovada' ? 'Aprovado' : 'Rejeitado'} por:</strong> 
                    ${req.aprovadoPor}
                </div>
            ` : ''}
        </div>
        
        ${req.observacao ? `
            <div class="detalhe-item-full">
                <strong>Observações:</strong>
                <p>${req.observacao}</p>
            </div>
        ` : ''}
        
        ${req.motivoRejeicao ? `
            <div class="detalhe-item-full alert-danger">
                <strong>Motivo da Rejeição:</strong>
                <p>${req.motivoRejeicao}</p>
            </div>
        ` : ''}
        
        <h3>Itens Solicitados</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantidade</th>
                    <th>Estoque Atual</th>
                </tr>
            </thead>
            <tbody>
                ${req.itens.map(item => {
                    const estoqueItem = estoque.find(e => e.id === item.itemId);
                    const qtdDisponivel = estoqueItem ? estoqueItem.quantidade : 0;
                    return `
                        <tr>
                            <td>${item.itemNome}</td>
                            <td>${item.quantidade} ${item.unidade}</td>
                            <td>${qtdDisponivel} ${item.unidade}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    document.getElementById('modal-requisicao').style.display = 'flex';
}

function fecharModalRequisicao() {
    document.getElementById('modal-requisicao').style.display = 'none';
}

function aprovarRequisicao(id) {
    const req = requisicoes.find(r => r.id === id);
    if (!req) return;
    
    // Verificar se há estoque suficiente
    for (let item of req.itens) {
        const estoqueItem = estoque.find(e => e.id === item.itemId);
        if (!estoqueItem || estoqueItem.quantidade < item.quantidade) {
            alert(`Estoque insuficiente para "${item.itemNome}". Requisição não pode ser aprovada.`);
            return;
        }
    }
    
    const aprovador = prompt('Digite seu nome para confirmar a aprovação:');
    if (!aprovador) return;
    
    // Dar baixa no estoque
    req.itens.forEach(item => {
        const estoqueItem = estoque.find(e => e.id === item.itemId);
        estoqueItem.quantidade -= item.quantidade;
    });
    
    // Atualizar requisição
    req.status = 'aprovada';
    req.dataAprovacao = new Date().toISOString();
    req.aprovadoPor = aprovador;
    
    // Adicionar ao histórico
    historico.push({
        id: Date.now(),
        tipo: 'aprovacao',
        requisicaoId: req.id,
        ...req,
        dataHistorico: new Date().toISOString()
    });
    
    salvarDados();
    alert('Requisição aprovada! Estoque atualizado.');
    atualizarInterface();
}

function rejeitarRequisicao(id) {
    const motivo = prompt('Digite o motivo da rejeição:');
    if (!motivo) return;
    
    const aprovador = prompt('Digite seu nome para confirmar a rejeição:');
    if (!aprovador) return;
    
    const req = requisicoes.find(r => r.id === id);
    if (!req) return;
    
    req.status = 'rejeitada';
    req.dataAprovacao = new Date().toISOString();
    req.aprovadoPor = aprovador;
    req.motivoRejeicao = motivo;
    
    // Adicionar ao histórico
    historico.push({
        id: Date.now(),
        tipo: 'rejeicao',
        requisicaoId: req.id,
        ...req,
        dataHistorico: new Date().toISOString()
    });
    
    salvarDados();
    alert('Requisição rejeitada.');
    atualizarInterface();
}

// ========================================
// HISTÓRICO
// ========================================

function renderizarHistorico() {
    const container = document.getElementById('lista-historico');
    filtrarHistorico();
}

function filtrarHistorico() {
    const container = document.getElementById('lista-historico');
    const busca = document.getElementById('filtro-historico').value.toLowerCase();
    const status = document.getElementById('filtro-status').value;
    
    let itensFiltrados = requisicoes.filter(r => r.status !== 'pendente');
    
    if (busca) {
        itensFiltrados = itensFiltrados.filter(r => 
            r.solicitante.toLowerCase().includes(busca) ||
            r.recebedor.toLowerCase().includes(busca) ||
            r.id.toString().includes(busca)
        );
    }
    
    if (status) {
        itensFiltrados = itensFiltrados.filter(r => r.status === status);
    }
    
    // Ordenar por data (mais recente primeiro)
    itensFiltrados.sort((a, b) => new Date(b.dataAprovacao) - new Date(a.dataAprovacao));
    
    container.innerHTML = '';
    
    if (itensFiltrados.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum registro encontrado.</p>';
        return;
    }
    
    itensFiltrados.forEach(req => {
        const card = document.createElement('div');
        card.className = 'historico-item';
        
        const badgeClass = req.status === 'aprovada' ? 'badge-success' : 'badge-danger';
        
        card.innerHTML = `
            <div class="historico-header">
                <div>
                    <strong>Requisição #${req.id}</strong>
                    <span class="badge ${badgeClass}">${req.status.toUpperCase()}</span>
                </div>
                <small>${formatarData(req.dataAprovacao)}</small>
            </div>
            <div class="historico-body">
                <div class="historico-info">
                    <p><strong>Solicitante:</strong> ${req.solicitante}</p>
                    <p><strong>Recebedor:</strong> ${req.recebedor}</p>
                    <p><strong>Data de uso:</strong> ${formatarDataSimples(req.dataUso)}</p>
                </div>
                <div class="historico-info">
                    <p><strong>${req.status === 'aprovada' ? 'Aprovado' : 'Rejeitado'} por:</strong> ${req.aprovadoPor}</p>
                    <p><strong>Itens:</strong> ${req.itens.length} item(ns)</p>
                </div>
            </div>
            <div class="historico-footer">
                <button class="btn-small btn-secondary" onclick="verDetalhesRequisicao(${req.id})">👁️ Ver Detalhes</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// ========================================
// UTILIDADES
// ========================================

function atualizarInterface() {
    // Atualizar badge de pendentes (se existir)
    const badgePendentes = document.getElementById('badge-pendentes');
    if (badgePendentes) {
        const pendentes = requisicoes.filter(r => r.status === 'pendente').length;
        badgePendentes.textContent = pendentes;
    }
    
    // Atualizar select de kits na requisição
    atualizarSelectKits();
    
    // Atualizar aba ativa (compatibilidade com antigas abas)
    const tabBtnAtivo = document.querySelector('.tab-btn.active');
    if (tabBtnAtivo) {
        const abaAtiva = tabBtnAtivo.getAttribute('data-tab');
        if (abaAtiva === 'estoque') renderizarEstoque();
        if (abaAtiva === 'kits') renderizarKits();
        if (abaAtiva === 'pendentes') renderizarPendentes();
        if (abaAtiva === 'historico') renderizarHistorico();
    }
}

function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatarDataSimples(dataString) {
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
}

// ========================================
// GESTÃO DE KITS
// ========================================

function renderizarKits() {
    filtrarKits();
}

function filtrarKits() {
    const container = document.getElementById('lista-kits');
    const busca = document.getElementById('filtro-kits').value.toLowerCase();
    
    let kitsFiltrados = kits;
    
    if (busca) {
        kitsFiltrados = kitsFiltrados.filter(kit => 
            kit.nome.toLowerCase().includes(busca) ||
            (kit.descricao && kit.descricao.toLowerCase().includes(busca))
        );
    }
    
    container.innerHTML = '';
    
    if (kitsFiltrados.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum kit encontrado. Crie seu primeiro kit!</p>';
        return;
    }
    
    kitsFiltrados.forEach(kit => {
        const card = document.createElement('div');
        card.className = 'item-card kit-card';
        
        const totalItens = kit.itens.length;
        
        card.innerHTML = `
            <div class="item-header">
                <span class="item-categoria">🎁 KIT</span>
                <span class="badge badge-success">${totalItens} ${totalItens === 1 ? 'item' : 'itens'}</span>
            </div>
            <div class="item-body">
                <h3>${kit.nome}</h3>
                ${kit.descricao ? `<p class="kit-descricao">${kit.descricao}</p>` : ''}
            </div>
            <div class="item-footer">
                <button class="btn-small btn-secondary" onclick="verDetalhesKit(${kit.id})">👁️ Ver</button>
                <button class="btn-small btn-secondary" onclick="editarKit(${kit.id})">✏️ Editar</button>
                <button class="btn-small btn-danger" onclick="removerKit(${kit.id})">🗑️ Remover</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Modal de Kit
let kitEditandoId = null;

function mostrarModalNovoKit() {
    kitEditandoId = null;
    document.getElementById('modal-kit-titulo').textContent = 'Criar Novo Kit';
    document.getElementById('form-kit').reset();
    document.getElementById('itens-kit').innerHTML = '';
    document.getElementById('modal-kit').style.display = 'flex';
    
    // Adicionar primeiro item automaticamente
    adicionarItemKit();
}

function editarKit(id) {
    const kit = kits.find(k => k.id === id);
    if (!kit) return;
    
    kitEditandoId = id;
    document.getElementById('modal-kit-titulo').textContent = 'Editar Kit';
    document.getElementById('kit-nome').value = kit.nome;
    document.getElementById('kit-descricao').value = kit.descricao || '';
    
    // Limpar e adicionar itens do kit
    const container = document.getElementById('itens-kit');
    container.innerHTML = '';
    
    kit.itens.forEach(item => {
        adicionarItemKit(item.itemId, item.quantidade);
    });
    
    document.getElementById('modal-kit').style.display = 'flex';
}

function fecharModalKit() {
    document.getElementById('modal-kit').style.display = 'none';
    kitEditandoId = null;
}

function adicionarItemKit(itemIdPreSelecionado = null, quantidadePreSelecionada = 1) {
    const container = document.getElementById('itens-kit');
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-requisicao';
    itemDiv.innerHTML = `
        <div class="form-row">
            <div class="form-group flex-2">
                <label>Item *</label>
                <select class="kit-item-select" required>
                    <option value="">Selecione um item</option>
                    ${estoque.map(item => `
                        <option value="${item.id}" ${itemIdPreSelecionado === item.id ? 'selected' : ''}>
                            ${item.nome}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Quantidade *</label>
                <input type="number" class="kit-item-qtd" min="1" value="${quantidadePreSelecionada}" required>
            </div>
            <div class="form-group form-group-btn">
                <button type="button" class="btn-small btn-danger" onclick="removerItemKit(this)">🗑️</button>
            </div>
        </div>
    `;
    
    container.appendChild(itemDiv);
}

function removerItemKit(btn) {
    btn.closest('.item-requisicao').remove();
}

function removerKit(id) {
    if (!confirm('Deseja realmente remover este kit?')) return;
    
    kits = kits.filter(kit => kit.id !== id);
    salvarDados();
    renderizarKits();
}

function verDetalhesKit(id) {
    const kit = kits.find(k => k.id === id);
    if (!kit) return;
    
    const container = document.getElementById('conteudo-detalhes-kit');
    
    let html = `
        <h2>🎁 ${kit.nome}</h2>
        ${kit.descricao ? `<p class="kit-descricao-detalhes">${kit.descricao}</p>` : ''}
        
        <h3>Itens do Kit</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantidade</th>
                    <th>Estoque Atual</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    kit.itens.forEach(item => {
        const estoqueItem = estoque.find(e => e.id === item.itemId);
        if (estoqueItem) {
            const statusClass = estoqueItem.quantidade >= item.quantidade ? 'badge-success' : 'badge-danger';
            html += `
                <tr>
                    <td>${item.itemNome}</td>
                    <td>${item.quantidade} ${item.unidade}</td>
                    <td><span class="badge ${statusClass}">${estoqueItem.quantidade} ${item.unidade}</span></td>
                </tr>
            `;
        }
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
    document.getElementById('modal-detalhes-kit').style.display = 'flex';
}

function fecharModalDetalhesKit() {
    document.getElementById('modal-detalhes-kit').style.display = 'none';
}

// Atualizar select de kits na requisição
function atualizarSelectKits() {
    const select = document.getElementById('select-kit');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione um kit</option>';
    
    kits.forEach(kit => {
        const option = document.createElement('option');
        option.value = kit.id;
        option.textContent = `${kit.nome} (${kit.itens.length} ${kit.itens.length === 1 ? 'item' : 'itens'})`;
        select.appendChild(option);
    });
}

// Adicionar kit na requisição
function adicionarKitNaRequisicao() {
    const selectKit = document.getElementById('select-kit');
    const kitId = parseInt(selectKit.value);
    
    if (!kitId) {
        alert('Selecione um kit primeiro.');
        return;
    }
    
    const kit = kits.find(k => k.id === kitId);
    if (!kit) return;
    
    // Verificar se há estoque suficiente para todos os itens do kit
    let estoqueInsuficiente = false;
    kit.itens.forEach(item => {
        const estoqueItem = estoque.find(e => e.id === item.itemId);
        if (!estoqueItem || estoqueItem.quantidade < item.quantidade) {
            estoqueInsuficiente = true;
        }
    });
    
    if (estoqueInsuficiente) {
        if (!confirm('ATENÇÃO: Alguns itens do kit não possuem estoque suficiente. Deseja adicionar mesmo assim?')) {
            return;
        }
    }
    
    // Adicionar todos os itens do kit
    kit.itens.forEach(item => {
        const container = document.getElementById('itens-requisicao');
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-requisicao';
        itemDiv.innerHTML = `
            <div class="form-row">
                <div class="form-group flex-2">
                    <label>Item *</label>
                    <select class="req-item-select" required onchange="atualizarEstoqueDisponivel(this)">
                        <option value="">Selecione um item</option>
                        ${estoque.map(e => `
                            <option value="${e.id}" data-max="${e.quantidade}" data-unidade="${e.unidade}" ${e.id === item.itemId ? 'selected' : ''}>
                                ${e.nome} (Disponível: ${e.quantidade} ${e.unidade})
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Quantidade *</label>
                    <input type="number" class="req-item-qtd" min="1" value="${item.quantidade}" required>
                </div>
                <div class="form-group form-group-btn">
                    <button type="button" class="btn-small btn-danger" onclick="removerItemRequisicao(this)">🗑️</button>
                </div>
            </div>
            <small class="estoque-info"></small>
        `;
        
        container.appendChild(itemDiv);
        
        // Atualizar info de estoque
        const select = itemDiv.querySelector('.req-item-select');
        atualizarEstoqueDisponivel(select);
    });
    
    // Resetar select do kit
    selectKit.value = '';
    
    alert(`Kit "${kit.nome}" adicionado com ${kit.itens.length} ${kit.itens.length === 1 ? 'item' : 'itens'}!`);
}

// Fechar modais ao clicar fora
window.onclick = function(event) {
    if (event.target.className === 'modal') {
        event.target.style.display = 'none';
    }
}
/**
 * MELHORIAS DE RESPONSIVIDADE E UX
 * Adicione este código ao final do app.js
 */

// ========================================
// MENU HAMBURGER (MOBILE)
// ========================================

function inicializarMenuMobile() {
    console.log('🔧 Inicializando menu mobile...');
    
    // Aguarda um tick para garantir que as tabs estão renderizadas
    setTimeout(() => {
        // Criar tabs no sidebar
        criarTabsSidebar();
        
        // Event listeners
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const closeSidebarBtn = document.querySelector('.close-sidebar');
        
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', abrirSidebar);
            console.log('✅ Botão hamburger conectado');
        } else {
            console.warn('⚠️ Botão hamburger não encontrado');
        }
        
        if (closeSidebarBtn) {
            closeSidebarBtn.addEventListener('click', fecharSidebar);
            console.log('✅ Botão fechar sidebar conectado');
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', fecharSidebar);
            console.log('✅ Overlay conectado');
        }
        
        // Sincronizar tabs do sidebar com tabs principais
        sincronizarTabsSidebar();
        
        console.log('✅ Menu mobile inicializado com sucesso!');
    }, 100);
}

function criarTabsSidebar() {
    const sidebarTabs = document.getElementById('sidebar-tabs');
    const mainTabs = document.querySelectorAll('.tab-btn');
    
    console.log('🔍 Criando tabs no sidebar...');
    console.log('📋 Tabs principais encontradas:', mainTabs.length);
    
    if (!sidebarTabs) {
        console.error('❌ Container sidebar-tabs não encontrado!');
        return;
    }
    
    if (mainTabs.length === 0) {
        console.error('❌ Nenhuma tab principal encontrada!');
        return;
    }
    
    sidebarTabs.innerHTML = '';
    
    mainTabs.forEach((tab, index) => {
        const sidebarTab = document.createElement('button');
        sidebarTab.className = 'sidebar-tab-btn';
        sidebarTab.dataset.tab = tab.dataset.tab;
        sidebarTab.innerHTML = tab.innerHTML;
        
        if (tab.classList.contains('active')) {
            sidebarTab.classList.add('active');
        }
        
        sidebarTab.addEventListener('click', function() {
            console.log('📱 Tab do sidebar clicada:', tab.dataset.tab);
            // Ativa a tab principal
            tab.click();
            // Fecha o sidebar
            fecharSidebar();
        });
        
        sidebarTabs.appendChild(sidebarTab);
        console.log(`✅ Tab ${index + 1} adicionada ao sidebar:`, tab.innerHTML);
    });
    
    console.log(`✅ ${mainTabs.length} tabs adicionadas ao sidebar!`);
}

function sincronizarTabsSidebar() {
    const mainTabs = document.querySelectorAll('.tab-btn');
    
    mainTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Atualiza tabs do sidebar
            const sidebarTab = document.querySelector(`.sidebar-tab-btn[data-tab="${this.dataset.tab}"]`);
            if (sidebarTab) {
                document.querySelectorAll('.sidebar-tab-btn').forEach(t => t.classList.remove('active'));
                sidebarTab.classList.add('active');
            }
        });
    });
}

function abrirSidebar() {
    console.log('📱 Abrindo sidebar...');
    const sidebar = document.getElementById('mobile-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const hamburgerToggle = document.querySelector('.mobile-menu-toggle');
    
    if (sidebar) {
        sidebar.classList.add('active');
        console.log('✅ Classe active adicionada ao sidebar');
    }
    if (overlay) {
        overlay.classList.add('active');
        console.log('✅ Classe active adicionada ao overlay');
    }
    if (hamburgerBtn) {
        hamburgerBtn.classList.add('active');
    }
    
    // Esconder botão hamburger quando sidebar abrir
    if (hamburgerToggle) {
        hamburgerToggle.classList.add('hidden');
        console.log('✅ Botão hamburger escondido');
    }
    
    // Previne scroll do body
    document.body.style.overflow = 'hidden';
    console.log('✅ Sidebar aberto!');
}

function fecharSidebar() {
    console.log('📱 Fechando sidebar...');
    const sidebar = document.getElementById('mobile-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const hamburgerToggle = document.querySelector('.mobile-menu-toggle');
    
    if (sidebar) {
        sidebar.classList.remove('active');
        console.log('✅ Classe active removida do sidebar');
    }
    if (overlay) {
        overlay.classList.remove('active');
        console.log('✅ Classe active removida do overlay');
    }
    if (hamburgerBtn) {
        hamburgerBtn.classList.remove('active');
    }
    
    // Mostrar botão hamburger quando sidebar fechar
    if (hamburgerToggle) {
        hamburgerToggle.classList.remove('hidden');
        console.log('✅ Botão hamburger visível novamente');
    }
    
    // Restaura scroll do body
    document.body.style.overflow = '';
    console.log('✅ Sidebar fechado!');
}

// ========================================
// LOADING STATE
// ========================================

function criarLoadingOverlay() {
    if (document.getElementById('loading-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="spinner"></div>
        <p>Carregando...</p>
    `;
    document.body.appendChild(overlay);
}

function showLoading(message = 'Carregando...') {
    criarLoadingOverlay();
    const overlay = document.getElementById('loading-overlay');
    const p = overlay.querySelector('p');
    if (p) p.textContent = message;
    overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('active');
}

// ========================================
// TOAST NOTIFICATIONS
// ========================================

function showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Mostra o toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove após duração
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Substitui alert() padrão em funções existentes
// Exemplo de uso:
// alert('Sucesso!') => showToast('Sucesso!', 'success')
// alert('Erro!') => showToast('Erro!', 'error')

// ========================================
// MELHORIAS NAS TABELAS (SCROLL HORIZONTAL)
// ========================================

function tornarTabelasResponsivas() {
    const tabelas = document.querySelectorAll('table');
    
    tabelas.forEach(tabela => {
        // Verifica se já está em container responsivo
        if (tabela.parentElement.classList.contains('table-responsive')) return;
        
        // Cria wrapper responsivo
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive';
        tabela.parentNode.insertBefore(wrapper, tabela);
        wrapper.appendChild(tabela);
    });
}

// Executa ao carregar
document.addEventListener('DOMContentLoaded', tornarTabelasResponsivas);

// Re-executa quando novas tabelas são adicionadas (ex: ao renderizar O.S.)
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach(function(node) {
                if (node.tagName === 'TABLE') {
                    tornarTabelasResponsivas();
                }
            });
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// ========================================
// ORIENTAÇÃO DO DISPOSITIVO
// ========================================

function detectarOrientacao() {
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    document.body.classList.toggle('landscape', isLandscape);
    document.body.classList.toggle('portrait', !isLandscape);
}

window.addEventListener('orientationchange', detectarOrientacao);
window.addEventListener('resize', detectarOrientacao);
detectarOrientacao();

// ========================================
// SMOOTH SCROLL
// ========================================

function scrollSuave(elementoId) {
    const elemento = document.getElementById(elementoId);
    if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ========================================
// CONFIRMAÇÃO ANTES DE SAIR (SE FORMULÁRIO PREENCHIDO)
// ========================================

let formularioModificado = false;

function monitorarFormulario() {
    const form = document.getElementById('form-emitir-os');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            formularioModificado = true;
        });
    });
    
    // Reset após submit
    form.addEventListener('submit', () => {
        formularioModificado = false;
    });
}

window.addEventListener('beforeunload', function(e) {
    if (formularioModificado) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
        return e.returnValue;
    }
});

document.addEventListener('DOMContentLoaded', monitorarFormulario);

// ========================================
// UTILITÁRIOS
// ========================================

// Detecta se é mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// Detecta se é tablet
function isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
}

// Detecta se é desktop
function isDesktop() {
    return window.innerWidth > 1024;
}

// Debounce para eventos de resize
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exemplo de uso do debounce no resize
window.addEventListener('resize', debounce(function() {
    console.log('📱 Resize detectado:', {
        width: window.innerWidth,
        isMobile: isMobile(),
        isTablet: isTablet(),
        isDesktop: isDesktop()
    });
}, 250));

// ========================================
// MELHORIAS DE ACESSIBILIDADE
// ========================================

// Adiciona indicadores visuais de foco para teclado
document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        document.body.classList.add('user-is-tabbing');
    }
});

document.addEventListener('mousedown', function() {
    document.body.classList.remove('user-is-tabbing');
});

// CSS relacionado (adicionar ao styles.css):
/*
.user-is-tabbing *:focus {
    outline: 3px solid #667eea !important;
    outline-offset: 2px;
}
*/

console.log('✅ Melhorias de responsividade carregadas!');

// ========================================
// RELATÓRIOS
// ========================================

/**
 * Carregar categorias no filtro de relatório de estoque
 */
async function carregarCategoriasRelatorio() {
    try {
        const response = await fetch('/api/alimentacao/categorias');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('rel-estoque-categoria');
            if (select) {
                select.innerHTML = '<option value="">Todas</option>';
                
                data.categorias.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.nome;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

// Carregar categorias quando abrir aba de relatórios
document.addEventListener('DOMContentLoaded', function() {
    const tabRelatorios = document.querySelector('[data-tab="relatorios"]');
    if (tabRelatorios) {
        tabRelatorios.addEventListener('click', carregarCategoriasRelatorio);
    }
});

/**
 * Gerar Relatório de Ordens de Serviço
 */
async function gerarRelatorioOS() {
    const dataInicio = document.getElementById('rel-os-data-inicio').value;
    const dataFim = document.getElementById('rel-os-data-fim').value;
    const regiao = document.getElementById('rel-os-regiao').value;
    const contratada = document.getElementById('rel-os-contratada').value;
    const servico = document.getElementById('rel-os-servico').value;
    
    const params = new URLSearchParams();
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    if (regiao) params.append('regiao', regiao);
    if (contratada) params.append('contratada', contratada);
    if (servico) params.append('servico', servico);
    
    try {
        const response = await fetch(`/api/relatorios/ordens-servico?${params}`);
        const data = await response.json();
        
        if (data.success) {
            exibirResultadoRelatorioOS(data);
        } else {
            alert('Erro ao gerar relatório: ' + data.error);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao gerar relatório');
    }
}

function exibirResultadoRelatorioOS(data) {
    const resultado = document.getElementById('resultado-rel-os');
    const stats = document.getElementById('stats-rel-os');
    const tabela = document.getElementById('tabela-rel-os');
    
    // Mostrar resultado
    resultado.style.display = 'block';
    
    // Estatísticas
    stats.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${data.estatisticas.total_os}</div>
            <div class="stat-label">Total de O.S.</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.estatisticas.regioes_atendidas}</div>
            <div class="stat-label">Regiões Atendidas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${Object.keys(data.estatisticas.por_servico).length}</div>
            <div class="stat-label">Tipos de Serviço</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${Object.keys(data.estatisticas.por_contratada).length}</div>
            <div class="stat-label">Contratadas</div>
        </div>
    `;
    
    // Tabela
    let tabelaHTML = `
        <div class="relatorio-tabela">
            <table>
                <thead>
                    <tr>
                        <th>Nº O.S.</th>
                        <th>Data Emissão</th>
                        <th>Serviço</th>
                        <th>Evento</th>
                        <th>Contratada</th>
                        <th>Região</th>
                        <th>Itens</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    data.ordens.forEach(os => {
        const dataEmissao = os.dataEmissao ? new Date(os.dataEmissao).toLocaleDateString('pt-BR') : '-';
        tabelaHTML += `
            <tr>
                <td><strong>${os.numeroOS}</strong></td>
                <td>${dataEmissao}</td>
                <td>${os.servico || '-'}</td>
                <td>${os.evento || '-'}</td>
                <td>${os.detentora || '-'}</td>
                <td>${os.regiaoEstoque || '-'}</td>
                <td>${os.itens ? os.itens.length : 0}</td>
            </tr>
        `;
    });
    
    tabelaHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    tabela.innerHTML = tabelaHTML;
}

/**
 * Gerar PDF do Relatório de O.S.
 */
function gerarPDFRelatorioOS() {
    const dataInicio = document.getElementById('rel-os-data-inicio').value;
    const dataFim = document.getElementById('rel-os-data-fim').value;
    const regiao = document.getElementById('rel-os-regiao').value;
    
    const params = new URLSearchParams();
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    if (regiao) params.append('regiao', regiao);
    
    window.open(`/api/relatorios/pdf/ordens-servico?${params}`, '_blank');
}

/**
 * Gerar Relatório de Estoque
 */
async function gerarRelatorioEstoque() {
    const categoriaId = document.getElementById('rel-estoque-categoria').value;
    const regiao = document.getElementById('rel-estoque-regiao').value;
    
    const params = new URLSearchParams();
    if (categoriaId) params.append('categoria_id', categoriaId);
    if (regiao) params.append('regiao', regiao);
    
    try {
        const response = await fetch(`/api/relatorios/estoque-posicao?${params}`);
        const data = await response.json();
        
        if (data.success) {
            exibirResultadoRelatorioEstoque(data);
        } else {
            alert('Erro ao gerar relatório: ' + data.error);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao gerar relatório');
    }
}

function exibirResultadoRelatorioEstoque(data) {
    const resultado = document.getElementById('resultado-rel-estoque');
    const stats = document.getElementById('stats-rel-estoque');
    const tabela = document.getElementById('tabela-rel-estoque');
    
    resultado.style.display = 'block';
    
    // Estatísticas
    stats.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${data.resumo.total_itens}</div>
            <div class="stat-label">Total de Itens</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.resumo.total_inicial.toLocaleString('pt-BR')}</div>
            <div class="stat-label">Quantidade Inicial</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.resumo.total_gasto.toLocaleString('pt-BR')}</div>
            <div class="stat-label">Quantidade Gasta</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.resumo.percentual_uso_geral.toFixed(1)}%</div>
            <div class="stat-label">Percentual de Uso</div>
        </div>
    `;
    
    // Tabela
    let tabelaHTML = `
        <div class="relatorio-tabela">
            <table>
                <thead>
                    <tr>
                        <th>Categoria</th>
                        <th>Item</th>
                        <th>Unidade</th>
                        <th>Região</th>
                        <th>Inicial</th>
                        <th>Gasto</th>
                        <th>Disponível</th>
                        <th>% Uso</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    data.estoque.forEach(item => {
        const corUso = item.percentual_uso > 80 ? 'color: #dc3545; font-weight: bold;' : 
                       item.percentual_uso > 50 ? 'color: #ff9800; font-weight: bold;' : '';
        
        tabelaHTML += `
            <tr>
                <td>${item.categoria}</td>
                <td>${item.descricao}</td>
                <td>${item.unidade}</td>
                <td>${item.regiao}</td>
                <td>${item.quantidade_inicial.toLocaleString('pt-BR')}</td>
                <td>${item.quantidade_gasto.toLocaleString('pt-BR')}</td>
                <td>${item.quantidade_disponivel.toLocaleString('pt-BR')}</td>
                <td style="${corUso}">${item.percentual_uso.toFixed(1)}%</td>
            </tr>
        `;
    });
    
    tabelaHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    tabela.innerHTML = tabelaHTML;
}

/**
 * Gerar PDF do Relatório de Estoque
 */
function gerarPDFRelatorioEstoque() {
    const categoriaId = document.getElementById('rel-estoque-categoria').value;
    const regiao = document.getElementById('rel-estoque-regiao').value;
    
    const params = new URLSearchParams();
    if (categoriaId) params.append('categoria_id', categoriaId);
    if (regiao) params.append('regiao', regiao);
    
    window.open(`/api/relatorios/pdf/estoque?${params}`, '_blank');
}

/**
 * Gerar Relatório de Movimentações
 */
async function gerarRelatorioMovimentacoes() {
    const dataInicio = document.getElementById('rel-mov-data-inicio').value;
    const dataFim = document.getElementById('rel-mov-data-fim').value;
    const regiao = document.getElementById('rel-mov-regiao').value;
    const tipo = document.getElementById('rel-mov-tipo').value;
    
    const params = new URLSearchParams();
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    if (regiao) params.append('regiao', regiao);
    if (tipo) params.append('tipo', tipo);
    
    try {
        const response = await fetch(`/api/relatorios/movimentacoes?${params}`);
        const data = await response.json();
        
        if (data.success) {
            exibirResultadoRelatorioMovimentacoes(data);
        } else {
            alert('Erro ao gerar relatório: ' + data.error);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao gerar relatório');
    }
}

function exibirResultadoRelatorioMovimentacoes(data) {
    const resultado = document.getElementById('resultado-rel-mov');
    const stats = document.getElementById('stats-rel-mov');
    const tabela = document.getElementById('tabela-rel-mov');
    
    resultado.style.display = 'block';
    
    // Estatísticas
    stats.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${data.resumo.total_movimentacoes}</div>
            <div class="stat-label">Total de Movimentações</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.resumo.total_saidas.toLocaleString('pt-BR')}</div>
            <div class="stat-label">Total de Saídas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.resumo.total_entradas.toLocaleString('pt-BR')}</div>
            <div class="stat-label">Total de Entradas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.resumo.saldo.toLocaleString('pt-BR')}</div>
            <div class="stat-label">Saldo</div>
        </div>
    `;
    
    // Tabela
    let tabelaHTML = `
        <div class="relatorio-tabela">
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Item</th>
                        <th>O.S.</th>
                        <th>Região</th>
                        <th>Quantidade</th>
                        <th>Tipo</th>
                        <th>Observação</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    data.movimentacoes.forEach(mov => {
        const badgeClass = mov.tipo === 'SAIDA' ? 'badge-saida' : 'badge-entrada';
        
        tabelaHTML += `
            <tr>
                <td>${mov.data}</td>
                <td>${mov.item_descricao}</td>
                <td>${mov.numero_os}</td>
                <td>${mov.regiao}</td>
                <td>${mov.quantidade.toLocaleString('pt-BR')}</td>
                <td><span class="${badgeClass}">${mov.tipo}</span></td>
                <td>${mov.observacao || '-'}</td>
            </tr>
        `;
    });
    
    tabelaHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    tabela.innerHTML = tabelaHTML;
}

/**
 * Gerar Relatório de Consumo por Categoria
 */
async function gerarRelatorioCategoria() {
    const dataInicio = document.getElementById('rel-cat-data-inicio').value;
    const dataFim = document.getElementById('rel-cat-data-fim').value;
    
    const params = new URLSearchParams();
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    
    try {
        const response = await fetch(`/api/relatorios/consumo-por-categoria?${params}`);
        const data = await response.json();
        
        if (data.success) {
            exibirResultadoRelatorioCategoria(data);
        } else {
            alert('Erro ao gerar relatório: ' + data.error);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao gerar relatório');
    }
}

function exibirResultadoRelatorioCategoria(data) {
    const resultado = document.getElementById('resultado-rel-cat');
    const tabela = document.getElementById('tabela-rel-cat');
    
    resultado.style.display = 'block';
    
    // Tabela agrupada por categoria
    let tabelaHTML = '<div class="relatorio-tabela">';
    
    data.categorias.forEach(cat => {
        tabelaHTML += `
            <h5 style="margin-top: 20px; color: #667eea;">${cat.categoria} (BEC: ${cat.natureza || 'N/A'})</h5>
            <p style="font-size: 0.9rem; color: #6c757d; margin-bottom: 10px;">
                Total de itens diferentes: ${cat.total_itens_diferentes} | 
                Consumo total: ${cat.total_consumo.toLocaleString('pt-BR')}
            </p>
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Unidade</th>
                        <th>Quantidade Consumida</th>
                        <th>Vezes Utilizado</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        cat.itens.forEach(item => {
            tabelaHTML += `
                <tr>
                    <td>${item.descricao}</td>
                    <td>${item.unidade}</td>
                    <td>${item.total_consumido.toLocaleString('pt-BR')}</td>
                    <td>${item.vezes_utilizado}</td>
                </tr>
            `;
        });
        
        tabelaHTML += `
                </tbody>
            </table>
        `;
    });
    
    tabelaHTML += '</div>';
    tabela.innerHTML = tabelaHTML;
}

/**
 * Gerar Relatório de Top Itens
 */
async function gerarRelatorioTopItens() {
    const dataInicio = document.getElementById('rel-top-data-inicio').value;
    const dataFim = document.getElementById('rel-top-data-fim').value;
    const limite = document.getElementById('rel-top-limite').value;
    
    const params = new URLSearchParams();
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    if (limite) params.append('limite', limite);
    
    try {
        const response = await fetch(`/api/relatorios/itens-mais-utilizados?${params}`);
        const data = await response.json();
        
        if (data.success) {
            exibirResultadoRelatorioTopItens(data);
        } else {
            alert('Erro ao gerar relatório: ' + data.error);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao gerar relatório');
    }
}

function exibirResultadoRelatorioTopItens(data) {
    const resultado = document.getElementById('resultado-rel-top');
    const tabela = document.getElementById('tabela-rel-top');
    
    resultado.style.display = 'block';
    
    // Tabela com ranking
    let tabelaHTML = `
        <div class="relatorio-tabela">
            <table>
                <thead>
                    <tr>
                        <th>Posição</th>
                        <th>Item</th>
                        <th>Categoria</th>
                        <th>Unidade</th>
                        <th>Quantidade Consumida</th>
                        <th>Vezes Utilizado</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    data.ranking.forEach(item => {
        const posClass = item.posicao <= 3 ? `top-${item.posicao}` : '';
        
        tabelaHTML += `
            <tr>
                <td><span class="ranking-position ${posClass}">${item.posicao}</span></td>
                <td><strong>${item.descricao}</strong></td>
                <td>${item.categoria}</td>
                <td>${item.unidade}</td>
                <td>${item.total_consumido.toLocaleString('pt-BR')}</td>
                <td>${item.vezes_utilizado}</td>
            </tr>
        `;
    });
    
    tabelaHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    tabela.innerHTML = tabelaHTML;
}

console.log('✅ Funções de relatórios carregadas!');
