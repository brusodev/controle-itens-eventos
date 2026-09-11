import { z } from 'zod'

/** 2. Posição de Estoque — porta de gerarRelatorioEstoque/gerarPDFRelatorioEstoque (relatorios.js). */

export const filtrosEstoqueSchema = z.object({ categoriaId: z.string(), regiao: z.string() })
export type FiltrosEstoque = z.infer<typeof filtrosEstoqueSchema>
export const EMPTY_FILTROS_ESTOQUE: FiltrosEstoque = { categoriaId: '', regiao: '' }

const linhaEstoqueSchema = z.object({
  item_id: z.number(),
  descricao: z.string(),
  unidade: z.string().nullable(),
  categoria: z.string().nullable(),
  natureza: z.string().nullable(),
  regiao: z.number().nullable(),
  quantidade_inicial: z.number(),
  quantidade_gasto: z.number(),
  quantidade_disponivel: z.number(),
  percentual_uso: z.number(),
})

export const relatorioEstoqueSchema = z.object({
  success: z.boolean(),
  estoque: z.array(linhaEstoqueSchema),
  resumo: z.object({
    total_itens: z.number(),
    total_inicial: z.number(),
    total_gasto: z.number(),
    total_disponivel: z.number(),
    percentual_uso_geral: z.number(),
  }),
})
export type RelatorioEstoque = z.infer<typeof relatorioEstoqueSchema>
