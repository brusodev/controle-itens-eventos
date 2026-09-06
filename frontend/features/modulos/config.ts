/**
 * Configuração por módulo de negócio — porta tipada de
 * backend/static/js/globals.js (MODULE_CONFIG).
 *
 * Cada módulo define rótulos e comportamento próprios (código do item,
 * se usa diárias, se usa trajeto). Isso substitui o `localStorage.modulo_atual`
 * lido dentro do client HTTP: aqui vira um union type que o TypeScript
 * verifica em build — um campo condicional por módulo (ex.: trajeto, só em
 * Transporte) deixa de ser um `if` solto que pode vazar entre módulos.
 */

export const MODULOS = [
  'coffee',
  'organizacao',
  'hospedagem',
  'transporte',
  'trofeus',
  'servicos_graficos',
] as const

export type Modulo = (typeof MODULOS)[number]

export interface RegiaoConfig {
  tipo: string
  tipoLabel: string
  tipoLabelPlural: string
  quantidade: number
  nomes: Record<number, string>
}

export interface ModuloConfig {
  titulo: string
  emoji: string
  itemLabel: string
  grupoLabel: string
  grupoLabelUpper: string
  itemCodeLabel: string
  itemCodeLabelUpper: string
  descLabel: string
  usaDiarias: boolean
  usaTrajeto?: boolean
  colunaQtd: string
  colunaQtdCompacta: string
  colunaQtdTotal: string | null
  colunaValorUnit: string
  osDataLabel: string
  osHorarioLabel: string
  osLocalLabel: string
  regioes: RegiaoConfig
}

// `satisfies` em vez de anotação direta: garante que os 6 módulos existam
// (como em MODULOS) sem perder a inferência de literal de cada chave.
export const MODULE_CONFIG = {
  coffee: {
    titulo: 'Coffee Break',
    emoji: '☕',
    itemLabel: 'Itens do Coffee',
    grupoLabel: 'Grupo',
    grupoLabelUpper: 'GRUPO',
    itemCodeLabel: 'ITEM BEC',
    itemCodeLabelUpper: 'ITEM BEC',
    descLabel: 'DESCRIÇÃO',
    usaDiarias: true,
    colunaQtd: 'QTDE SOLICITADA',
    colunaQtdCompacta: 'Qtd',
    colunaQtdTotal: 'QTDE SOLICITADA TOTAL',
    colunaValorUnit: 'VALOR UNIT.',
    osDataLabel: 'DATA',
    osHorarioLabel: 'HORÁRIO DO EVENTO',
    osLocalLabel: 'LOCAL DO EVENTO',
    regioes: {
      tipo: 'regiao',
      tipoLabel: 'Região',
      tipoLabelPlural: 'Regiões',
      quantidade: 6,
      nomes: { 1: 'Região 1', 2: 'Região 2', 3: 'Região 3', 4: 'Região 4', 5: 'Região 5', 6: 'Região 6' },
    },
  },
  organizacao: {
    titulo: 'Organização',
    emoji: '📋',
    itemLabel: 'Itens Organização',
    grupoLabel: 'Grupo',
    grupoLabelUpper: 'GRUPO',
    itemCodeLabel: 'ITEM BEC',
    itemCodeLabelUpper: 'ITEM BEC',
    descLabel: 'DESCRIÇÃO',
    usaDiarias: true,
    colunaQtd: 'QTDE SOLICITADA',
    colunaQtdCompacta: 'Qtd',
    colunaQtdTotal: 'QTDE SOLICITADA TOTAL',
    colunaValorUnit: 'VALOR UNIT.',
    osDataLabel: 'DATA DE ENTREGA',
    osHorarioLabel: 'HORÁRIO DE ENTREGA',
    osLocalLabel: 'LOCAL DE ENTREGA',
    regioes: {
      tipo: 'grupo',
      tipoLabel: 'Grupo',
      tipoLabelPlural: 'Grupos',
      quantidade: 3,
      nomes: { 1: 'Capital/RMSP', 2: 'Interior', 3: 'Litoral' },
    },
  },
  hospedagem: {
    titulo: 'Hospedagem',
    emoji: '🛏️',
    itemLabel: 'Itens de Hospedagem',
    grupoLabel: 'Lote',
    grupoLabelUpper: 'LOTE',
    itemCodeLabel: 'CATSERV',
    itemCodeLabelUpper: 'CATSERV',
    descLabel: 'DESCRIÇÃO',
    usaDiarias: true,
    colunaQtd: 'QTDE SOLICITADA',
    colunaQtdCompacta: 'Qtd',
    colunaQtdTotal: 'QTDE SOLICITADA TOTAL',
    colunaValorUnit: 'VALOR UNIT.',
    osDataLabel: 'DATA',
    osHorarioLabel: 'HORÁRIO DO EVENTO',
    osLocalLabel: 'LOCAL DO EVENTO',
    regioes: {
      tipo: 'lote',
      tipoLabel: 'Lote',
      tipoLabelPlural: 'Lotes',
      quantidade: 6,
      nomes: { 1: 'Lote 1', 2: 'Lote 2', 3: 'Lote 3', 4: 'Lote 4', 5: 'Lote 5', 6: 'Lote 6' },
    },
  },
  transporte: {
    titulo: 'Transporte',
    emoji: '🚚',
    itemLabel: 'Itens de Transporte',
    grupoLabel: 'Grupo',
    grupoLabelUpper: 'GRUPO',
    itemCodeLabel: 'CATSER',
    itemCodeLabelUpper: 'CATSER',
    descLabel: 'ESPECIFICAÇÃO',
    usaDiarias: false,
    usaTrajeto: true,
    colunaQtd: 'QTDE KM',
    colunaQtdCompacta: 'Qtd KM',
    colunaQtdTotal: null,
    colunaValorUnit: 'VALOR UNIT. DO KM',
    osDataLabel: 'DATA',
    osHorarioLabel: 'HORÁRIO DO EVENTO',
    osLocalLabel: 'LOCAL DO EVENTO',
    regioes: {
      tipo: 'ambito',
      tipoLabel: 'Âmbito',
      tipoLabelPlural: 'Âmbitos',
      quantidade: 3,
      nomes: { 1: 'Municipal', 2: 'Intermunicipal', 3: 'Interestadual' },
    },
  },
  trofeus: {
    titulo: 'Troféus',
    emoji: '🏆',
    itemLabel: 'Itens de Troféus',
    grupoLabel: 'Grupo',
    grupoLabelUpper: 'GRUPO',
    itemCodeLabel: 'ITEM BEC',
    itemCodeLabelUpper: 'ITEM BEC',
    descLabel: 'DESCRIÇÃO',
    usaDiarias: true,
    colunaQtd: 'QTDE SOLICITADA',
    colunaQtdCompacta: 'Qtd',
    colunaQtdTotal: 'QTDE SOLICITADA TOTAL',
    colunaValorUnit: 'VALOR UNIT.',
    osDataLabel: 'DATA',
    osHorarioLabel: 'HORÁRIO DO EVENTO',
    osLocalLabel: 'LOCAL DO EVENTO',
    regioes: {
      tipo: 'grupo',
      tipoLabel: 'Grupo',
      tipoLabelPlural: 'Grupos',
      quantidade: 2,
      nomes: { 1: 'Grupo 1', 2: 'Grupo 2' },
    },
  },
  servicos_graficos: {
    titulo: 'Serviços Gráficos',
    emoji: '🖨️',
    itemLabel: 'Itens Gráficos',
    grupoLabel: 'Grupo',
    grupoLabelUpper: 'GRUPO',
    itemCodeLabel: 'ITEM BEC',
    itemCodeLabelUpper: 'ITEM BEC',
    descLabel: 'DESCRIÇÃO',
    usaDiarias: false,
    colunaQtd: 'QTDE SOLICITADA',
    colunaQtdCompacta: 'Qtd',
    colunaQtdTotal: 'QTDE SOLICITADA TOTAL',
    colunaValorUnit: 'VALOR UNIT.',
    osDataLabel: 'DATA',
    osHorarioLabel: 'HORÁRIO',
    osLocalLabel: 'LOCAL',
    regioes: {
      tipo: 'grupo',
      tipoLabel: 'Grupo',
      tipoLabelPlural: 'Grupos',
      quantidade: 1,
      nomes: { 1: 'Único' },
    },
  },
} as const satisfies Record<Modulo, ModuloConfig>

export function getModuloConfig(modulo: Modulo): ModuloConfig {
  return MODULE_CONFIG[modulo]
}
