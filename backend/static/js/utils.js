// ========================================
// MÓDULO: UTILS - Funções Utilitárias
// ========================================

function atualizarLabelsModulo() {
    const moduloAtual = localStorage.getItem('modulo_atual') || 'coffee';
    const moduloLabels = {
        'coffee': { titulo: 'Coffee Break', emoji: '☕', itemLabel: 'Itens do Coffee', catLabel: 'Categorias de Alimentação', novaCat: 'Nova Categoria', icon: '📦' },
        'transporte': { titulo: 'Transporte', emoji: '🚚', itemLabel: 'Itens de Transporte', catLabel: 'Modalidades de Transporte', novaCat: 'Nova Modalidade', icon: '🚗' },
        'organizacao': { titulo: 'Organização', emoji: '📋', itemLabel: 'Itens Organização', catLabel: 'Categorias de Organização', novaCat: 'Nova Categoria', icon: '📋' },
        'hospedagem': { titulo: 'Hospedagem', emoji: '🛏️', itemLabel: 'Itens de Hospedagem', catLabel: 'Modalidades de Hospedagem', novaCat: 'Nova Modalidade', icon: '🏨' }
    };
    const cfg = moduloLabels[moduloAtual] || moduloLabels['coffee'];
    const titulo = cfg.titulo;
    const emoji = cfg.emoji;
    const itemLabel = cfg.itemLabel;

    // 1. Título do Navegador e Favicon
    document.title = `Sistema - ${titulo}`;
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
        favicon.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75'>${emoji}</text></svg>`;
    }

    // 2. Título no Topbar
    const moduleTitle = document.getElementById('page-module-title');
    if (moduleTitle) {
        moduleTitle.innerHTML = `<span style="margin-right: 10px;">${emoji}</span> Módulo: ${titulo}`;
    }

    // 3. Labels nos links de menu
    const menuAlimentacao = document.querySelector('#menu-alimentacao .menu-text');
    if (menuAlimentacao) {
        menuAlimentacao.textContent = itemLabel;
    }

    // 4. Título das seções dinâmicas
    const h2Itens = document.querySelector('#tab-alimentacao h2');
    if (h2Itens) {
        h2Itens.textContent = `${emoji} Controle de itens: ${titulo}`;
    }

    // 5. Título da aba de categorias
    const tituloCategorias = document.getElementById('titulo-aba-categorias');
    if (tituloCategorias) {
        tituloCategorias.textContent = `🏷️ ${cfg.catLabel}`;
    }

    const btnNovaCat = document.getElementById('btn-nova-categoria');
    if (btnNovaCat) {
        btnNovaCat.textContent = `➕ ${cfg.novaCat}`;
    }

    console.log(`🎨 [Interface] Labels atualizadas para o módulo: ${titulo}`);
}

function formatarCategoria(categoria) {
    const nomes = {
        'estrutura_e_espaco': 'Estrutura e Espaço',
        'equipamentos': 'Equipamentos',
        'materiais_de_apoio': 'Materiais de Apoio'
    };
    return nomes[categoria] || categoria;
}

function formatarCategoriaAlimentacao(categoria) {
    const nomes = {
        'coffee_break_bebidas_quentes': 'Coffee Break e Bebidas Quentes',
        'fornecimento_agua_mineral': 'Fornecimento de Água Mineral',
        'kit_lanche': 'Kit Lanche',
        'fornecimento_biscoitos': 'Fornecimento de Biscoitos',
        'almoco_jantar': 'Almoço/Jantar',
        'transporte_veiculos_leves': 'Veículos Leves',
        'transporte_veiculos_pesados': 'Veículos Pesados',
        'transporte_fretamento': 'Fretamento',
        'montagem_decoracao': 'Montagem e Decoração',
        'recursos_humanos': 'Recursos Humanos',
        'equipamento_informatica': 'Equipamentos e Informática',
        'material_grafico_expediente': 'Material Gráfico e de Expediente',
        'hospedagem_pensao_completa': 'Pensão Completa (Café + Almoço + Jantar)',
        'hospedagem_meia_pensao': 'Meia Pensão (Café + Almoço ou Jantar)'
    };
    return nomes[categoria] || categoria;
}

// Função para formatar números com separador de milhar
function formatarNumeroMilhar(numero) {
    if (!numero && numero !== 0) return '';
    const num = parseInt(numero.toString().replace(/\D/g, '')) || 0;
    return num.toLocaleString('pt-BR');
}

// Função para remover máscara de formatação
function removerMascaraNumero(valor) {
    if (!valor) return '0';
    return valor.toString().replace(/\D/g, '') || '0';
}

// Auxiliar para formatar nome da categoria (snake_case para Título)
function formatarNomeCategoria(nome) {
    return nome
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
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

// ========================================
// UTILITÁRIOS DE DISPOSITIVO
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
