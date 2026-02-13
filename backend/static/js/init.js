// ========================================
// MÓDULO: INIT - Inicialização do Sistema
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
    // ✅ ATUALIZAR LABELS DO MÓDULO IMEDIATAMENTE (ANTES DA API)
    atualizarLabelsModulo();

    carregarDados();
    carregarCategoriasLocalStorage();
    inicializarDataAtual();
    configurarAbas();
    configurarFormularios();
    renderizarCategorias();

    // Carregar dados da API
    try {
        await renderizarAlimentacao();
        await renderizarOrdensServico();
        await carregarSugestoesOS();
    } catch (error) {
        console.error("❌ Erro ao carregar dados da API:", error);
    }

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
