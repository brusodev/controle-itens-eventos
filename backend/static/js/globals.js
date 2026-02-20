// ========================================
// SISTEMA DE CONTROLE DE ITENS - VARIÁVEIS GLOBAIS
// ========================================

// ========================================
// CONFIGURAÇÃO POR MÓDULO
// ========================================
// Labels e terminologia específica de cada módulo.
// Hospedagem usa "Lote" (em vez de "Grupo") e "CATSERV" (em vez de "ITEM BEC").
const MODULE_CONFIG = {
    coffee: {
        grupoLabel: 'Grupo',  grupoLabelUpper: 'GRUPO',
        itemCodeLabel: 'ITEM BEC', itemCodeLabelUpper: 'ITEM BEC',
        descLabel: 'DESCRIÇÃO',
        usaDiarias: true,
        colunaQtd: 'QTDE<br/>SOLICITADA',     colunaQtdCompacta: 'Qtd',
        colunaQtdTotal: 'QTDE<br/>SOLICITADA<br/>TOTAL',
        colunaValorUnit: 'VALOR UNIT.',
        // Labels de Ordem de Serviço
        osDataLabel: 'DATA',
        osHorarioLabel: 'HORÁRIO DO EVENTO',
        osLocalLabel: 'LOCAL DO EVENTO',
        // Configuração de Regiões/Grupos
        regioes: {
            tipo: 'regiao',
            tipoLabel: 'Região',
            tipoLabelPlural: 'Regiões',
            quantidade: 6,
            nomes: {
                1: 'Região 1', 2: 'Região 2', 3: 'Região 3',
                4: 'Região 4', 5: 'Região 5', 6: 'Região 6'
            }
        }
    },
    organizacao: {
        grupoLabel: 'Grupo',  grupoLabelUpper: 'GRUPO',
        itemCodeLabel: 'ITEM BEC', itemCodeLabelUpper: 'ITEM BEC',
        descLabel: 'DESCRIÇÃO',
        usaDiarias: true,
        colunaQtd: 'QTDE<br/>SOLICITADA',     colunaQtdCompacta: 'Qtd',
        colunaQtdTotal: 'QTDE<br/>SOLICITADA<br/>TOTAL',
        colunaValorUnit: 'VALOR UNIT.',
        // Labels de Ordem de Serviço
        osDataLabel: 'DATA DE ENTREGA',
        osHorarioLabel: 'HORÁRIO DE ENTREGA',
        osLocalLabel: 'LOCAL DE ENTREGA',
        // Configuração de Regiões/Grupos
        regioes: {
            tipo: 'grupo',
            tipoLabel: 'Grupo',
            tipoLabelPlural: 'Grupos',
            quantidade: 3,
            nomes: {
                1: 'Capital/RMSP',
                2: 'Interior',
                3: 'Litoral'
            }
        }
    },
    hospedagem: {
        grupoLabel: 'Lote',   grupoLabelUpper: 'LOTE',
        itemCodeLabel: 'CATSERV',  itemCodeLabelUpper: 'CATSERV',
        descLabel: 'DESCRIÇÃO',
        usaDiarias: true,
        colunaQtd: 'QTDE<br/>SOLICITADA',     colunaQtdCompacta: 'Qtd',
        colunaQtdTotal: 'QTDE<br/>SOLICITADA<br/>TOTAL',
        colunaValorUnit: 'VALOR UNIT.',
        // Labels de Ordem de Serviço
        osDataLabel: 'DATA',
        osHorarioLabel: 'HORÁRIO DO EVENTO',
        osLocalLabel: 'LOCAL DO EVENTO',
        // Configuração de Regiões/Grupos
        regioes: {
            tipo: 'lote',
            tipoLabel: 'Lote',
            tipoLabelPlural: 'Lotes',
            quantidade: 6,
            nomes: {
                1: 'Lote 1', 2: 'Lote 2', 3: 'Lote 3',
                4: 'Lote 4', 5: 'Lote 5', 6: 'Lote 6'
            }
        }
    },
    transporte: {
        grupoLabel: 'Grupo',  grupoLabelUpper: 'GRUPO',
        itemCodeLabel: 'CATSER',   itemCodeLabelUpper: 'CATSER',
        descLabel: 'ESPECIFICAÇÃO',
        usaDiarias: false,
        colunaQtd: 'QTDE KM',                 colunaQtdCompacta: 'Qtd KM',
        colunaQtdTotal: null,   // sem coluna separada de total
        colunaValorUnit: 'VALOR UNIT.<br/>DO KM',
        // Labels de Ordem de Serviço
        osDataLabel: 'DATA',
        osHorarioLabel: 'HORÁRIO DO EVENTO',
        osLocalLabel: 'LOCAL DO EVENTO',
        // Configuração de Regiões/Grupos
        regioes: {
            tipo: 'ambito',
            tipoLabel: 'Âmbito',
            tipoLabelPlural: 'Âmbitos',
            quantidade: 3,
            nomes: {
                1: 'Municipal',
                2: 'Intermunicipal',
                3: 'Interestadual'
            }
        }
    }
};

/**
 * Retorna a configuração de labels para o módulo atual.
 * @returns {Object} { grupoLabel, grupoLabelUpper, itemCodeLabel, itemCodeLabelUpper }
 */
function getModuleConfig() {
    const modulo = localStorage.getItem('modulo_atual') || 'coffee';
    return MODULE_CONFIG[modulo] || MODULE_CONFIG.coffee;
}

// Variáveis de Controle e Perfil (Fallback se não vierem do Template)
let usuarioPerfil = window.usuarioPerfil || 'comum';
let usuarioNome = window.usuarioNome || 'Usuário';

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
let itensOSSelecionados = []; // Itens selecionados para a O.S. atual
let signatariosOS = []; // Signatários dinâmicos da O.S.

// Categorias disponíveis
let categorias = {
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

// ========================================
// DADOS DE ALIMENTAÇÃO
// ========================================

let dadosAlimentacao = null;
let alimentacaoEditando = null;

// ========================================
// SUGESTÕES PARA DATALIST
// ========================================

let sugestoesOS = {
    eventos: [],
    datas: [],
    horarios: [],
    locais: [],
    responsaveis: [],
    justificativas: [],
    observacoes: [],
    gestores: [],
    fiscais: []
};

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

/**
 * Função debounce para performance em eventos de resize/scroll
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function}
 */
function debounce(func, wait = 250) {
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

/**
 * Atualiza labels dinâmicos baseados no módulo atual
 */
function atualizarLabelsModulo() {
    const cfg = getModuleConfig();
    
    // Atualizar labels de código do item (BEC/CATSER)
    document.querySelectorAll('[data-label="item-code"]').forEach(el => {
        el.textContent = cfg.itemCodeLabel;
    });
    
    // Atualizar labels de descrição
    document.querySelectorAll('[data-label="desc"]').forEach(el => {
        el.textContent = cfg.descLabel;
    });
    
    // Atualizar labels de grupo/lote
    document.querySelectorAll('[data-label="grupo"]').forEach(el => {
        el.textContent = cfg.grupoLabel;
    });
    
    console.log('✅ Labels do módulo atualizados:', cfg);
}
