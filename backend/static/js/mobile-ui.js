// ========================================
// MÓDULO: MOBILE-UI - Interface Mobile, Responsividade e Acessibilidade
// ========================================

// ========================================
// UTILIDADES DE INTERFACE
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

// ========================================
// MENU HAMBURGER (MOBILE)
// ========================================

function inicializarMenuMobile() {
    console.log('🔧 Inicializando menu mobile...');

    // Aguarda um tick para garantir que as tabs estão renderizadas
    setTimeout(() => {
        // Criar tabs no sidebar
        criarTabsSidebar();

        // Event listeners com retry para elementos que podem não estar prontos
        let tentativas = 0;
        const maxTentativas = 10;

        function conectarElementos() {
            const hamburgerBtn = document.querySelector('.hamburger-menu');
            const sidebarOverlay = document.getElementById('sidebar-overlay');
            const closeSidebarBtn = document.querySelector('.close-sidebar');

            let elementosEncontrados = false;

            if (hamburgerBtn) {
                hamburgerBtn.addEventListener('click', abrirSidebar);
                console.log('✅ Botão hamburger conectado');
                elementosEncontrados = true;
            }

            if (closeSidebarBtn) {
                closeSidebarBtn.addEventListener('click', fecharSidebar);
                console.log('✅ Botão fechar sidebar conectado');
                elementosEncontrados = true;
            }

            if (sidebarOverlay) {
                sidebarOverlay.addEventListener('click', fecharSidebar);
                console.log('✅ Overlay conectado');
                elementosEncontrados = true;
            }

            // Se elementos não foram encontrados e ainda temos tentativas, tenta novamente
            if (!elementosEncontrados && tentativas < maxTentativas) {
                tentativas++;
                console.log(`⏳ Tentando conectar elementos novamente... (${tentativas}/${maxTentativas})`);
                setTimeout(conectarElementos, 100);
            } else if (!elementosEncontrados && tentativas >= maxTentativas) {
                console.warn('⚠️ Botão hamburger não encontrado após múltiplas tentativas');
            }
        }

        conectarElementos();

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
        console.warn('⚠️ Container sidebar-tabs não encontrado! (Pode ser normal em desktop)');
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
    const hamburgerBtn = document.querySelector('.hamburger-menu');
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
    const hamburgerBtn = document.querySelector('.hamburger-menu');
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
