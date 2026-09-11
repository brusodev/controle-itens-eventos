import { z } from 'zod'

/** 5. Itens Mais Utilizados — porta de gerarRelatorioTopItens/exportarTopItensExcel (relatorios.js). */

export const ORDENAR_TOP_ITENS = ['total_consumido', 'vezes_utilizado'] as const
export type OrdenarTopItens = (typeof ORDENAR_TOP_ITENS)[number]

export const filtrosTopItensSchema = z.object({
  dataInicio: z.string(),
  dataFim: z.string(),
  grupo: z.string(),
  ordenarPor: z.enum(ORDENAR_TOP_ITENS),
  limite: z.string(),
})
export type FiltrosTopItens = z.infer<typeof filtrosTopItensSchema>
export const EMPTY_FILTROS_TOP_ITENS: FiltrosTopItens = {
  dataInicio: '',
  dataFim: '',
  grupo: '',
  ordenarPor: 'total_consumido',
  limite: '10',
}

const itemRankingSchema = z.object({
  posicao: z.number(),
  descricao: z.string().nullable(),
  unidade: z.string().nullable(),
  categoria: z.string().nullable(),
  total_consumido: z.number(),
  vezes_utilizado: z.number(),
})

export const relatorioTopItensSchema = z.object({
  success: z.boolean(),
  ranking: z.array(itemRankingSchema),
})
export type RelatorioTopItens = z.infer<typeof relatorioTopItensSchema>
