/**
 * Formatadores reutilizáveis — porta fiel dos helpers de
 * backend/static/js/utils.js (ver plano § Paridade: "portar, não reinventar").
 *
 * `escaparHtml` não tem equivalente aqui: React escapa toda interpolação
 * por padrão, então a classe inteira de bug que essa função existia para
 * mitigar (innerHTML sem escape) desaparece por construção.
 */

const CATEGORIAS: Record<string, string> = {
  estrutura_e_espaco: 'Estrutura e Espaço',
  equipamentos: 'Equipamentos',
  materiais_de_apoio: 'Materiais de Apoio',
}

const CATEGORIAS_ALIMENTACAO: Record<string, string> = {
  coffee_break_bebidas_quentes: 'Coffee Break e Bebidas Quentes',
  fornecimento_agua_mineral: 'Fornecimento de Água Mineral',
  kit_lanche: 'Kit Lanche',
  fornecimento_biscoitos: 'Fornecimento de Biscoitos',
  almoco_jantar: 'Almoço/Jantar',
  transporte_veiculos_leves: 'Veículos Leves',
  transporte_veiculos_pesados: 'Veículos Pesados',
  transporte_fretamento: 'Fretamento',
  montagem_decoracao: 'Montagem e Decoração',
  recursos_humanos: 'Recursos Humanos',
  equipamento_informatica: 'Equipamentos e Informática',
  material_grafico_expediente: 'Material Gráfico e de Expediente',
  hospedagem_pensao_completa: 'Pensão Completa (Café + Almoço + Jantar)',
  hospedagem_meia_pensao: 'Meia Pensão (Café + Almoço ou Jantar)',
}

export function formatarCategoria(categoria: string): string {
  return CATEGORIAS[categoria] ?? categoria
}

export function formatarCategoriaAlimentacao(categoria: string): string {
  return CATEGORIAS_ALIMENTACAO[categoria] ?? categoria
}

/** "12000" | 12000 → "12.000" */
export function formatarNumeroMilhar(numero: string | number | null | undefined): string {
  if (numero === null || numero === undefined || numero === '') return ''
  const num = parseInt(String(numero).replace(/\D/g, ''), 10) || 0
  return num.toLocaleString('pt-BR')
}

/** "12.000" → "12000" — inverso de formatarNumeroMilhar, para enviar ao backend. */
export function removerMascaraNumero(valor: string | number | null | undefined): string {
  if (!valor) return '0'
  return String(valor).replace(/\D/g, '') || '0'
}

/** snake_case → Título Com Cada Palavra Maiúscula */
export function formatarNomeCategoria(nome: string): string {
  return nome
    .split('_')
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ')
}

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

/** "07/05/2026" → "7 de maio de 2026". Sem data válida, usa a data atual. */
export function formatarDataExtenso(dataStr?: string | null): string {
  let data: Date
  if (dataStr?.includes('/')) {
    const [dia, mes, ano] = dataStr.split('/').map(Number)
    data = new Date(ano, mes - 1, dia)
  } else {
    data = new Date()
  }
  return `${data.getDate()} de ${MESES[data.getMonth()]} de ${data.getFullYear()}`
}

/** ISO datetime → "07/05/2026 14:30" */
export function formatarData(dataISO: string): string {
  return new Date(dataISO).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "2026-05-07" (ISO date) → "07/05/2026" */
export function formatarDataSimples(dataString: string): string {
  const [ano, mes, dia] = dataString.split('-')
  return `${dia}/${mes}/${ano}`
}

/** 1234.5 → "R$ 1.234,50" — usado nos relatórios de valor (O.S., pagamentos, transporte). */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
