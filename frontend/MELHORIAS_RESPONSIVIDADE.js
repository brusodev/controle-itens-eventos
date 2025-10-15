/**
 * MELHORIAS DE RESPONSIVIDADE E UX
 * Adicione este código ao final do app.js
 */

// ========================================
// MENU HAMBURGER (MOBILE)
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Criar elementos do menu mobile se não existirem
    criarMenuMobile();
    
    // Event listeners
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('mobile-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const closeSidebar = document.querySelector('.close-sidebar');
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', abrirSidebar);
    }
    
    if (closeSidebar) {
        closeSidebar.addEventListener('click', fecharSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', fecharSidebar);
    }
    
    // Sincronizar tabs do sidebar com tabs principais
    sincronizarTabsSidebar();
});

function criarMenuMobile() {
    // Verifica se já existe
    if (document.getElementById('mobile-sidebar')) return;
    
    // Criar botão hamburger
    const hamburgerBtn = document.createElement('div');
    hamburgerBtn.className = 'mobile-menu-toggle';
    hamburgerBtn.innerHTML = '<button id="hamburger-btn" class="hamburger-btn">☰</button>';
    document.body.insertBefore(hamburgerBtn, document.body.firstChild);
    
    // Criar sidebar
    const sidebar = document.createElement('div');
    sidebar.id = 'mobile-sidebar';
    sidebar.className = 'sidebar-mobile';
    
    // Header do sidebar
    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'sidebar-mobile-header';
    sidebarHeader.innerHTML = `
        <h2>Menu</h2>
        <button class="close-sidebar">×</button>
    `;
    sidebar.appendChild(sidebarHeader);
    
    // Tabs do sidebar
    const sidebarTabs = document.createElement('div');
    sidebarTabs.className = 'sidebar-tabs';
    sidebarTabs.id = 'sidebar-tabs';
    sidebar.appendChild(sidebarTabs);
    
    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.className = 'sidebar-overlay';
    
    document.body.appendChild(sidebar);
    document.body.appendChild(overlay);
    
    // Criar tabs no sidebar baseado nas tabs principais
    criarTabsSidebar();
}

function criarTabsSidebar() {
    const sidebarTabs = document.getElementById('sidebar-tabs');
    const mainTabs = document.querySelectorAll('.tab-btn');
    
    if (!sidebarTabs || mainTabs.length === 0) return;
    
    sidebarTabs.innerHTML = '';
    
    mainTabs.forEach(tab => {
        const sidebarTab = document.createElement('button');
        sidebarTab.className = 'sidebar-tab-btn';
        sidebarTab.dataset.tab = tab.dataset.tab;
        sidebarTab.innerHTML = tab.innerHTML;
        
        if (tab.classList.contains('active')) {
            sidebarTab.classList.add('active');
        }
        
        sidebarTab.addEventListener('click', function() {
            // Ativa a tab principal
            tab.click();
            // Fecha o sidebar
            fecharSidebar();
        });
        
        sidebarTabs.appendChild(sidebarTab);
    });
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
    const sidebar = document.getElementById('mobile-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
    
    // Previne scroll do body
    document.body.style.overflow = 'hidden';
}

function fecharSidebar() {
    const sidebar = document.getElementById('mobile-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    
    // Restaura scroll do body
    document.body.style.overflow = '';
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
