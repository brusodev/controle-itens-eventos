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

/**
 * Payload de PUT /api/alimentacao/item/<id>/estoque — porta do form de
 * edição em estoque.js:333-393. Nunca sobrescreve o saldo diretamente: o
 * backend deriva `gasto` do ledger de movimentações e grava um ajuste
 * rastreável quando o valor enviado diverge do atual (ver plano § Domínio 3
 * — regra central do ledger). O frontend só manda "qual deveria ser o
 * gasto agora", nunca calcula o delta.
 */
export const regiaoEstoqueFormSchema = z.object({
  inicial: z.string(),
  gasto: z.string(),
  preco: z.string(),
})

export const atualizarEstoqueSchema = z.object({
  regioes: z.record(z.string(), regiaoEstoqueFormSchema),
  natureza: z.string().nullable().optional(),
})

export type RegiaoEstoqueForm = z.infer<typeof regiaoEstoqueFormSchema>
export type AtualizarEstoquePayload = z.infer<typeof atualizarEstoqueSchema>

/**
 * Payload de POST /api/itens/ — porta de configurarFormularios() em
 * kits-requisicoes.js:75-150. `item` (código) é gerado no client como
 * sequencial da categoria (maior código existente + 1) — ver
 * gerarProximoCodigoItem() em novo-item logic.
 */
export const novoItemSchema = z.object({
  categoria_id: z.number(),
  item: z.string().min(1),
  descricao: z.string().min(1, 'Nome é obrigatório.'),
  unidade: z.string().min(1),
  natureza: z.string().nullable().optional(),
  regioes: z.record(z.string(), z.object({ inicial: z.string(), gasto: z.string() })),
})

export type NovoItemPayload = z.infer<typeof novoItemSchema>

/** `EMPTY_NOVO_ITEM_FORM` — o que o usuário de fato digita no modal (categoria + nome + quantidade + unidade + código). */
export interface NovoItemForm {
  categoria: string // chave em DadosAlimentacao, ex. "coffee_break_bebidas_quentes"
  nome: string
  quantidadeInicial: string
  unidade: string
  natureza: string
}

export const EMPTY_NOVO_ITEM_FORM: NovoItemForm = {
  categoria: '',
  nome: '',
  quantidadeInicial: '',
  unidade: 'unidade',
  natureza: '',
}
