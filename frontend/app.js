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
let ordensServico = [];
let proximoIdOS = 1;

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
    const ordensServicoLS = localStorage.getItem('ordensServico');
    const idOSLS = localStorage.getItem('proximoIdOS');

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
        dadosAlimentacao = JSON.parse(dadosAlimentacaoLS);
    }

    if (ordensServicoLS) {
        ordensServico = JSON.parse(ordensServicoLS);
        proximoIdOS = parseInt(idOSLS) || 1;
    }
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
        dadosAlimentacao = await APIClient.listarAlimentacao();
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
                if (r.inicial !== '__') totalInicial += parseFloat(r.inicial.replace('.', '').replace(',', '.')) || 0;
                totalGasto += parseFloat(r.gasto.replace('.', '').replace(',', '.')) || 0;
            });
            const totalDisponivel = totalInicial - totalGasto;
            
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
                            const disp = r.inicial !== '__' ? (parseFloat(r.inicial.replace('.', '').replace(',', '.')) || 0) - (parseFloat(r.gasto.replace('.', '').replace(',', '.')) || 0) : 0;
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
    
    alimentacaoEditando = { categoria, itemId: itemId.toString() };
    
    document.getElementById('modal-alimentacao-titulo').textContent = 'Editar Item de Alimentação';
    document.getElementById('alimentacao-descricao').value = item.descricao;
    document.getElementById('alimentacao-unidade').value = item.unidade;
    
    const regioesDiv = document.getElementById('regioes-quantidades');
    regioesDiv.innerHTML = '';
    
    for (let reg = 1; reg <= 6; reg++) {
        const r = item.regioes[reg.toString()] || { inicial: '', gasto: '0' };
        const regDiv = document.createElement('div');
        regDiv.className = 'form-group';
        regDiv.innerHTML = `
            <label>Região ${reg}:</label>
            <div class="regiao-inputs">
                <input type="text" class="regiao-inicial-input" data-reg="${reg}" value="${r.inicial}" placeholder="Inicial">
                <input type="text" class="regiao-gasto-input" data-reg="${reg}" value="${r.gasto}" placeholder="Gasto">
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
    
    try {
        // Atualizar via API
        await APIClient.atualizarEstoqueItem(item.id, regioes);
        
        // Atualizar localmente
        Object.keys(regioes).forEach(reg => {
            if (!item.regioes[reg]) item.regioes[reg] = {};
            item.regioes[reg] = regioes[reg];
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
    // ✅ LIMPAR COMPLETAMENTE O FORMULÁRIO
    const form = document.getElementById('form-emitir-os');
    if (form) {
        form.reset(); // Limpa todos os inputs, selects, textareas
    }
    
    // Limpar container de itens
    const containerItens = document.getElementById('itens-os');
    if (containerItens) {
        containerItens.innerHTML = '';
    }
    
    // Adicionar um item inicial limpo
    adicionarItemOS();
}

function adicionarItemOS() {
    const container = document.getElementById('itens-os');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-os';
    itemDiv.innerHTML = `
        <div class="form-row">
            <select class="os-categoria flex-1" onchange="atualizarItensOS(this)">
                <option value="">Selecione Categoria</option>
                <option value="coffee_break_bebidas_quentes">Coffee Break e Bebidas Quentes</option>
                <option value="fornecimento_agua_mineral">Fornecimento de Água Mineral</option>
                <option value="kit_lanche">Kit Lanche</option>
                <option value="fornecimento_biscoitos">Fornecimento de Biscoitos</option>
                <option value="almoco_jantar">Almoço/Jantar</option>
            </select>
            <select class="os-item flex-2" onchange="verificarEstoqueDisponivel(this)">
                <option value="">Selecione Item</option>
            </select>
            <input type="number" class="os-diarias flex-1" placeholder="Diárias" min="1" value="1" onchange="verificarEstoqueDisponivel(this)">
            <input type="number" class="os-quantidade flex-1" placeholder="Qtd" min="0" onchange="verificarEstoqueDisponivel(this)">
        </div>
        <div class="estoque-info-os" style="margin-top: 8px; padding: 8px; border-radius: 6px; font-size: 0.85rem;"></div>
        <button type="button" class="btn-small btn-danger" onclick="removerItemOS(this)">Remover</button>
    `;
    container.appendChild(itemDiv);
}

/**
 * Verificar estoque disponível em tempo real
 */
async function verificarEstoqueDisponivel(element) {
    const itemDiv = element.closest('.item-os');
    const itemSelect = itemDiv.querySelector('.os-item');
    const itemId = parseInt(itemSelect.value);
    const diarias = parseInt(itemDiv.querySelector('.os-diarias').value) || 1;
    const quantidade = parseFloat(itemDiv.querySelector('.os-quantidade').value) || 0;
    const infoDiv = itemDiv.querySelector('.estoque-info-os');
    
    // Limpar mensagem se não há item selecionado
    if (!itemId || !quantidade) {
        infoDiv.innerHTML = '';
        infoDiv.style.background = '';
        infoDiv.style.border = '';
        return;
    }
    
    // Obter região do grupo selecionado
    const grupo = document.getElementById('os-grupo').value;
    if (!grupo) {
        infoDiv.innerHTML = '<span style="color: #ff9800; font-weight: 600;">⚠️ Selecione o grupo primeiro para verificar o estoque disponível</span>';
        infoDiv.style.background = '#fff3cd';
        infoDiv.style.border = '1px solid #ff9800';
        return;
    }
    
    // Mapear grupo para região
    const regiaoMap = {
        '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6
    };
    const regiao = regiaoMap[grupo];
    
    if (!regiao) {
        infoDiv.innerHTML = '<span style="color: #dc3545; font-weight: 600;">❌ Grupo inválido</span>';
        infoDiv.style.background = '#f8d7da';
        infoDiv.style.border = '1px solid #dc3545';
        return;
    }
    
    // Buscar dados do item
    const categoriaSelect = itemDiv.querySelector('.os-categoria');
    const categoria = categoriaSelect.value;
    
    if (!categoria || !dadosAlimentacao[categoria]) {
        return;
    }
    
    const item = dadosAlimentacao[categoria].itens.find(i => i.id === itemId);
    if (!item || !item.regioes) {
        infoDiv.innerHTML = '<span style="color: #dc3545; font-weight: 600;">❌ Item sem estoque cadastrado</span>';
        infoDiv.style.background = '#f8d7da';
        infoDiv.style.border = '1px solid #dc3545';
        return;
    }
    
    // Verificar estoque da região
    const estoqueRegiao = item.regioes[regiao];
    if (!estoqueRegiao) {
        infoDiv.innerHTML = `<span style="color: #dc3545; font-weight: 600;">❌ Sem estoque cadastrado na Região ${regiao}</span>`;
        infoDiv.style.background = '#f8d7da';
        infoDiv.style.border = '1px solid #dc3545';
        return;
    }
    
    // Calcular disponível
    const inicial = parseFloat(estoqueRegiao.inicial.replace('.', '').replace(',', '.')) || 0;
    const gasto = parseFloat(estoqueRegiao.gasto.replace('.', '').replace(',', '.')) || 0;
    const disponivel = inicial - gasto;
    const necessario = diarias * quantidade;
    
    // Gerar mensagem com cores
    let mensagem = '';
    
    if (disponivel === 0) {
        mensagem = `<strong style="color: #dc3545;">❌ ESTOQUE ZERADO na Região ${regiao}</strong><br>` +
                   `<span style="color: #721c24;">Não é possível emitir esta O.S. Cadastre estoque primeiro.</span>`;
        infoDiv.style.background = '#f8d7da';
        infoDiv.style.border = '2px solid #dc3545';
    } else if (necessario > disponivel) {
        const falta = necessario - disponivel;
        mensagem = `<strong style="color: #dc3545;">❌ ESTOQUE INSUFICIENTE na Região ${regiao}</strong><br>` +
                   `<span style="color: #721c24;">` +
                   `📦 Disponível: <strong>${disponivel.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${item.unidade}</strong> | ` +
                   `📋 Necessário: <strong>${necessario.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${item.unidade}</strong> | ` +
                   `⚠️ Faltam: <strong>${falta.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${item.unidade}</strong>` +
                   `</span>`;
        infoDiv.style.background = '#f8d7da';
        infoDiv.style.border = '2px solid #dc3545';
    } else if (necessario > disponivel * 0.8) {
        const restara = disponivel - necessario;
        mensagem = `<strong style="color: #ff9800;">⚠️ ATENÇÃO - Estoque ficará baixo na Região ${regiao}</strong><br>` +
                   `<span style="color: #856404;">` +
                   `📦 Disponível: <strong>${disponivel.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${item.unidade}</strong> | ` +
                   `📋 Será usado: <strong>${necessario.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${item.unidade}</strong> | ` +
                   `📉 Restará: <strong>${restara.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${item.unidade}</strong>` +
                   `</span>`;
        infoDiv.style.background = '#fff3cd';
        infoDiv.style.border = '2px solid #ff9800';
    } else {
        const restara = disponivel - necessario;
        const percentualUso = (necessario / disponivel * 100).toFixed(1);
        mensagem = `<strong style="color: #28a745;">✅ Estoque Suficiente na Região ${regiao}</strong><br>` +
                   `<span style="color: #155724;">` +
                   `📦 Disponível: <strong>${disponivel.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${item.unidade}</strong> | ` +
                   `📋 Será usado: <strong>${necessario.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${item.unidade}</strong> (${percentualUso}%) | ` +
                   `📈 Restará: <strong>${restara.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${item.unidade}</strong>` +
                   `</span>`;
        infoDiv.style.background = '#d4edda';
        infoDiv.style.border = '2px solid #28a745';
    }
    
    infoDiv.innerHTML = mensagem;
}

/**
 * Atualizar todos os indicadores de estoque quando o grupo mudar
 */
function atualizarTodosEstoques() {
    const itemDivs = document.querySelectorAll('.item-os');
    itemDivs.forEach(itemDiv => {
        const itemSelect = itemDiv.querySelector('.os-item');
        if (itemSelect && itemSelect.value) {
            verificarEstoqueDisponivel(itemSelect);
        }
    });
}

function atualizarItensOS(select) {
    const itemSelect = select.parentElement.querySelector('.os-item');
    const categoria = select.value;
    itemSelect.innerHTML = '<option value="">Selecione Item</option>';
    if (categoria && dadosAlimentacao[categoria]) {
        dadosAlimentacao[categoria].itens.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;  // ✅ CORRIGIDO: Usa ID único em vez de item_codigo
            option.textContent = item.descricao;
            option.setAttribute('data-unidade', item.unidade);
            option.setAttribute('data-item-codigo', item.item);  // Guarda código para referência
            itemSelect.appendChild(option);
        });
    }
}

function removerItemOS(btn) {
    btn.parentElement.remove();
}

function visualizarOS() {
    const form = document.getElementById('form-emitir-os');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const dadosOS = coletarDadosOS();
    if (!dadosOS) return;

    const preview = gerarPreviewOS(dadosOS);
    document.getElementById('preview-os').innerHTML = preview;
    
    // ✅ RESTAURAR BOTÕES ORIGINAIS DO MODAL (para nova O.S.)
    const modalButtons = document.querySelector('#modal-visualizar-os .modal-content > div:last-child');
    modalButtons.innerHTML = `
        <button class="btn btn-success" onclick="confirmarEmissaoOS()">✅ Confirmar e Emitir</button>
        <button class="btn btn-secondary" onclick="fecharModalVisualizarOS()">Voltar</button>
    `;
    
    document.getElementById('modal-visualizar-os').style.display = 'flex';
}

function fecharModalVisualizarOS() {
    document.getElementById('modal-visualizar-os').style.display = 'none';
    
    // ✅ RESTAURAR BOTÕES PADRÃO AO FECHAR MODAL
    const modalButtons = document.querySelector('#modal-visualizar-os .modal-content > div:last-child');
    if (modalButtons) {
        modalButtons.innerHTML = `
            <button class="btn btn-success" onclick="confirmarEmissaoOS()">✅ Confirmar e Emitir</button>
            <button class="btn btn-secondary" onclick="fecharModalVisualizarOS()">Voltar</button>
        `;
    }
}

function coletarDadosOS() {
    const itensOS = [];
    const itemDivs = document.querySelectorAll('.item-os');
    
    itemDivs.forEach((div, index) => {
        const categoria = div.querySelector('.os-categoria').value;
        const itemSelect = div.querySelector('.os-item');
        const itemId = parseInt(itemSelect.value);  // ✅ CORRIGIDO: Converte para número
        const diarias = parseInt(div.querySelector('.os-diarias').value) || 1;
        const quantidade = parseFloat(div.querySelector('.os-quantidade').value) || 0;
        
        if (categoria && itemId && quantidade) {
            // ✅ CORRIGIDO: Busca pelo ID único em vez de item_codigo
            const item = dadosAlimentacao[categoria].itens.find(i => i.id === itemId);
            
            if (!item) {
                console.error(`Item com ID ${itemId} não encontrado na categoria ${categoria}`);
                return;
            }
            
            itensOS.push({
                num: index + 1,
                descricao: item.descricao,
                itemBec: dadosAlimentacao[categoria].natureza,
                diarias: diarias,
                qtdSolicitada: quantidade,
                qtdTotal: diarias * quantidade,
                valorUnit: 25.60, // Valor exemplo - pode ser configurável
                categoria,
                itemId  // Agora é o ID único correto
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
        gestor: document.getElementById('os-gestor').value,
        fiscal: document.getElementById('os-fiscal').value,
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
                <div class="os-logo">🏛️</div>
                <div class="os-title">
                    <h2>GOVERNO DO ESTADO DE SÃO PAULO</h2>
                    <h3>SECRETARIA DE ESTADO DA EDUCAÇÃO</h3>
                    <h3>DEPARTAMENTO DE ADMINISTRAÇÃO</h3>
                    <h2 style="margin-top: 20px;">ORDEM DE SERVIÇO</h2>
                </div>
                <div class="os-info-box">
                    <div>DATA DE EMISSÃO: <strong>${dados.dataEmissao}</strong></div>
                    <div>NÚMERO: <strong>${dados.numeroOS}</strong></div>
                </div>
            </div>

            <div class="os-section">
                <table class="os-table">
                    <tr>
                        <td><strong>CONTRATO Nº:</strong></td>
                        <td colspan="3">${dados.contratoNum}</td>
                    </tr>
                    <tr>
                        <td><strong>DATA DA ASSINATURA:</strong></td>
                        <td>${dados.dataAssinatura ? new Date(dados.dataAssinatura + 'T00:00:00').toLocaleDateString('pt-BR') : ''}</td>
                        <td><strong>PRAZO DE VIGÊNCIA:</strong></td>
                        <td>${dados.prazoVigencia}</td>
                    </tr>
                    <tr>
                        <td><strong>NOME DA DETENTORA:</strong></td>
                        <td colspan="3">${dados.detentora}</td>
                    </tr>
                    <tr>
                        <td><strong>SERVIÇO:</strong></td>
                        <td>${dados.servico}</td>
                        <td><strong>CNPJ:</strong></td>
                        <td>${dados.cnpj}</td>
                    </tr>
                    <tr>
                        <td colspan="3"></td>
                        <td><strong>GRUPO:</strong> ${dados.grupo}</td>
                    </tr>
                </table>
            </div>

            <div class="os-section">
                <div><strong>EVENTO:</strong> ${dados.evento}</div>
                <div><strong>DATA:</strong> ${dados.dataEvento}</div>
                <div><strong>LOCAL DO EVENTO:</strong> ${dados.local}</div>
                <div><strong>HORÁRIO DO EVENTO:</strong> ${dados.dataEvento} - ${dados.horario}</div>
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
                                <td style="text-align: center;">${item.itemBec}</td>
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
                <p><strong>JUSTIFICATIVA:</strong></p>
                <div class="os-justificativa">${dados.justificativa.replace(/\n/g, '<br>')}</div>
            </div>

            <div class="os-footer">
                <p>São Paulo, ${dados.dataEmissao}.</p>
                <div class="os-signatures">
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <p>${dados.gestor}</p>
                        <p>Gestor do Contrato</p>
                    </div>
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <p>${dados.fiscal}</p>
                        <p>Fiscal do Contrato</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Formulário de Emissão de O.S.
document.getElementById('form-emitir-os').addEventListener('submit', function(e) {
    e.preventDefault();
    visualizarOS();
});

async function confirmarEmissaoOS() {
    const dadosOS = coletarDadosOS();
    if (!dadosOS) return;
    
    try {
        // Criar O.S. via API (backend atualiza estoque automaticamente)
        const novaOS = await APIClient.criarOrdemServico(dadosOS);
        
        alert('O.S. emitida com sucesso! Estoque atualizado.');
        
        // ✅ LIMPAR FORMULÁRIO COMPLETAMENTE
        const form = document.getElementById('form-emitir-os');
        form.reset(); // Limpa campos de texto, selects, etc.
        
        // Limpar itens da O.S. e adicionar um item inicial limpo
        renderizarEmitirOS();
        
        // Fechar modal de visualização
        fecharModalVisualizarOS();
        
        // Recarregar dados de estoque e lista de O.S.
        await renderizarAlimentacao();
        await renderizarOrdensServico();
        
        // Voltar para a aba de Ordens de Serviço para ver a O.S. criada
        abrirAba(null, 'ordens-servico');
        
    } catch (error) {
        console.error('Erro ao emitir O.S.:', error);
        alert('Erro ao emitir O.S.: ' + error.message);
    }
}

// ========================================
// VISUALIZAR ORDENS DE SERVIÇO
// ========================================

async function renderizarOrdensServico() {
    await filtrarOS();
}

async function filtrarOS() {
    const container = document.getElementById('lista-ordens-servico');
    const busca = document.getElementById('filtro-os').value.toLowerCase();
    
    container.innerHTML = '<p class="empty-message">Carregando...</p>';
    
    try {
        // Buscar O.S. da API
        ordensServico = await APIClient.listarOrdensServico(busca);
        
        container.innerHTML = '';
        
        if (ordensServico.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhuma Ordem de Serviço encontrada.</p>';
            return;
        }
        
        ordensServico.reverse().forEach(os => {
            const card = document.createElement('div');
            card.className = 'item-card';
            
            card.innerHTML = `
                <div class="item-header">
                    <span class="item-categoria">O.S. ${os.numeroOS}</span>
                </div>
                <div class="item-body">
                    <h3>${os.evento || 'Sem título'}</h3>
                    <p><strong>Detentora:</strong> ${os.detentora || 'N/A'}</p>
                    <p><strong>Data do Evento:</strong> ${os.data || 'N/A'}</p>
                    <p><strong>Emitida em:</strong> ${new Date(os.dataEmissao).toLocaleDateString('pt-BR')}</p>
                    <p><strong>Itens:</strong> ${os.itens ? os.itens.length : 0}</p>
                </div>
                <div class="item-footer">
                    <button class="btn-small btn-primary" onclick="visualizarOSEmitida(${os.id})">👁️ Visualizar</button>
                    <button class="btn-small btn-success" onclick="imprimirOS(${os.id})">🖨️ Imprimir</button>
                    <button class="btn-small btn-secondary" onclick="baixarPDFOS(${os.id})">📄 PDF</button>
                </div>
            `;
            
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Erro ao carregar O.S.:', error);
        container.innerHTML = '<p class="error-message">Erro ao carregar ordens de serviço. Verifique se o backend está rodando.</p>';
    }
}

function visualizarOSEmitida(osId) {
    const os = ordensServico.find(o => o.id === osId);
    if (!os) return;
    
    const preview = gerarPreviewOS(os);
    document.getElementById('preview-os').innerHTML = preview;
    
    // Mudar os botões do modal para incluir imprimir e PDF
    const modalButtons = document.querySelector('#modal-visualizar-os .modal-content > div:last-child');
    modalButtons.innerHTML = `
        <button class="btn btn-success" onclick="imprimirOS(${osId})">🖨️ Imprimir</button>
        <button class="btn btn-primary" onclick="baixarPDFOS(${osId})">📥 Baixar PDF</button>
        <button class="btn btn-secondary" onclick="fecharModalVisualizarOS()">Fechar</button>
    `;
    
    document.getElementById('modal-visualizar-os').style.display = 'flex';
}

// Função para imprimir O.S.
function imprimirOS(osId) {
    const os = ordensServico.find(o => o.id === osId);
    if (!os) return;
    
    const preview = gerarPreviewOS(os);
    
    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ordem de Serviço - ${os.numeroOS}</title>
            <style>
                @page {
                    margin: 1cm;
                }
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: white;
                }
                .os-document {
                    max-width: 100%;
                    margin: 0 auto;
                    background: white;
                }
                .os-header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 10px;
                }
                .os-header h1 {
                    margin: 5px 0;
                    font-size: 16px;
                    text-transform: uppercase;
                }
                .os-header h2 {
                    margin: 5px 0;
                    font-size: 14px;
                }
                .os-header .os-numero {
                    font-size: 18px;
                    font-weight: bold;
                    margin-top: 10px;
                }
                .os-section {
                    margin-bottom: 15px;
                }
                .os-section h3 {
                    font-size: 12px;
                    margin: 10px 0 5px 0;
                    padding: 3px 5px;
                    background: #f0f0f0;
                    border-left: 3px solid #333;
                }
                .os-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 10px;
                    font-size: 11px;
                }
                .os-table td {
                    padding: 5px;
                    border: 1px solid #ddd;
                }
                .os-table td:first-child {
                    font-weight: bold;
                    width: 30%;
                    background: #f9f9f9;
                }
                .os-items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0;
                    font-size: 10px;
                }
                .os-items-table th {
                    background: #333;
                    color: white;
                    padding: 8px 5px;
                    text-align: left;
                    border: 1px solid #000;
                }
                .os-items-table td {
                    padding: 5px;
                    border: 1px solid #ddd;
                }
                .os-items-table tr:nth-child(even) {
                    background: #f9f9f9;
                }
                .os-justificativa {
                    font-size: 0.85em;
                    line-height: 1.4;
                    padding: 10px;
                    border: 1px solid #ddd;
                    background: #f9f9f9;
                    white-space: pre-line;
                }
                .os-signatures {
                    display: flex;
                    justify-content: space-around;
                    margin-top: 40px;
                    page-break-inside: avoid;
                }
                .signature-box {
                    text-align: center;
                    flex: 1;
                    margin: 0 10px;
                }
                .signature-line {
                    border-top: 1px solid #333;
                    margin-top: 60px;
                    padding-top: 5px;
                    font-size: 10px;
                }
                .signature-box p {
                    margin: 2px 0;
                    font-size: 10px;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                    .os-document {
                        box-shadow: none;
                    }
                }
            </style>
        </head>
        <body>
            ${preview}
        </body>
        </html>
    `);
    printWindow.document.close();
    
    // Aguardar o carregamento e imprimir
    printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
    };
}

// Função para baixar PDF da O.S.
async function baixarPDFOS(osId) {
    const os = ordensServico.find(o => o.id === osId);
    if (!os) return;
    
    try {
        // Mostrar mensagem de processamento
        const btn = event.target;
        const btnText = btn.innerHTML;
        btn.innerHTML = '⏳ Gerando PDF...';
        btn.disabled = true;
        
        // Obter o elemento de preview
        const previewElement = document.querySelector('.os-preview');
        
        // Temporariamente remover limitações de altura para captura completa
        const originalMaxHeight = previewElement.style.maxHeight;
        const originalOverflow = previewElement.style.overflow;
        previewElement.style.maxHeight = 'none';
        previewElement.style.overflow = 'visible';
        
        // Aguardar um momento para o DOM se atualizar
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Converter para canvas usando html2canvas
        const canvas = await html2canvas(previewElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: previewElement.scrollWidth,
            windowHeight: previewElement.scrollHeight
        });
        
        // Restaurar estilos originais
        previewElement.style.maxHeight = originalMaxHeight;
        previewElement.style.overflow = originalOverflow;
        
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
        pdf.save(`OS_${os.numeroOS}.pdf`);
        
        // Restaurar botão
        btn.innerHTML = btnText;
        btn.disabled = false;
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Erro ao gerar PDF. Tente novamente.');
        
        // Restaurar botão em caso de erro
        const btn = event.target;
        btn.innerHTML = '📥 Baixar PDF';
        btn.disabled = false;
    }
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
    // Atualizar badge de pendentes
    const pendentes = requisicoes.filter(r => r.status === 'pendente').length;
    document.getElementById('badge-pendentes').textContent = pendentes;
    
    // Atualizar select de kits na requisição
    atualizarSelectKits();
    
    // Atualizar aba ativa
    const abaAtiva = document.querySelector('.tab-btn.active').getAttribute('data-tab');
    if (abaAtiva === 'estoque') renderizarEstoque();
    if (abaAtiva === 'kits') renderizarKits();
    if (abaAtiva === 'pendentes') renderizarPendentes();
    if (abaAtiva === 'historico') renderizarHistorico();
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
            select.innerHTML = '<option value="">Todas</option>';
            
            data.categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nome;
                select.appendChild(option);
            });
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

