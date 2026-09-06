import { z } from 'zod'

/** Espelha EstoqueRegional.to_dict() em backend/models.py:118 — valores em formato BR (vírgula decimal). */
export const regiaoEstoqueSchema = z.object({
  inicial: z.string(),
  gasto: z.string(),
  preco: z.string(),
})

/** Espelha Item.to_dict() em backend/models.py:70. */
export const itemEstoqueSchema = z.object({
  id: z.number(),
  categoria_id: z.number(),
  item: z.string(), // item_codigo — nome mantido igual à API para não duplicar tradução
  descricao: z.string(),
  unidade: z.string(),
  natureza: z.string().nullable(),
  regioes: z.record(z.string(), regiaoEstoqueSchema).optional(),
})

/** Espelha o dict retornado por listar_alimentacao() em alimentacao_routes.py:20. */
export const categoriaAlimentacaoSchema = z.object({
  natureza: z.string().nullable(),
  categoria_db_id: z.number(),
  itens: z.array(itemEstoqueSchema),
})

export const dadosAlimentacaoSchema = z.record(z.string(), categoriaAlimentacaoSchema)

export type ItemEstoque = z.infer<typeof itemEstoqueSchema>
export type CategoriaAlimentacao = z.infer<typeof categoriaAlimentacaoSchema>
export type DadosAlimentacao = z.infer<typeof dadosAlimentacaoSchema>
