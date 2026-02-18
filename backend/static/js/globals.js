// ========================================
// SISTEMA DE CONTROLE DE ITENS - VARIÁVEIS GLOBAIS
// ========================================

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
