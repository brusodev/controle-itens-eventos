import { z } from 'zod'

/** 4. Consumo por Categoria — porta de gerarRelatorioCategoria (relatorios.js). Sem exportação no legado. */

export const filtrosConsumoSchema = z.object({ dataInicio: z.string(), dataFim: z.string() })
export type FiltrosConsumo = z.infer<typeof filtrosConsumoSchema>
export const EMPTY_FILTROS_CONSUMO: FiltrosConsumo = { dataInicio: '', dataFim: '' }

const itemConsumoSchema = z.object({
  descricao: z.string().nullable(),
  unidade: z.string().nullable(),
  total_consumido: z.number(),
  vezes_utilizado: z.number(),
})

const categoriaConsumoSchema = z.object({
  categoria: z.string().nullable(),
  natureza: z.string().nullable(),
  itens: z.array(itemConsumoSchema),
  total_itens_diferentes: z.number(),
  total_consumo: z.number(),
})

export const relatorioConsumoSchema = z.object({
  success: z.boolean(),
  categorias: z.array(categoriaConsumoSchema),
})
export type RelatorioConsumo = z.infer<typeof relatorioConsumoSchema>
