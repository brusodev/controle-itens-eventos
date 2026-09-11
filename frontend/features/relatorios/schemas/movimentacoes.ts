import { z } from 'zod'

/** 3. Movimentações — porta de gerarRelatorioMovimentacoes (relatorios.js). Sem exportação no legado. */

export const filtrosMovimentacoesSchema = z.object({
  dataInicio: z.string(),
  dataFim: z.string(),
  regiao: z.string(),
  tipo: z.string(),
})
export type FiltrosMovimentacoes = z.infer<typeof filtrosMovimentacoesSchema>
export const EMPTY_FILTROS_MOVIMENTACOES: FiltrosMovimentacoes = {
  dataInicio: '',
  dataFim: '',
  regiao: '',
  tipo: '',
}

const linhaMovimentacaoSchema = z.object({
  id: z.number(),
  data: z.string(),
  item_descricao: z.string().nullable(),
  numero_os: z.string().nullable(),
  regiao: z.number().nullable(),
  quantidade: z.number(),
  tipo: z.string(),
  observacao: z.string().nullable(),
})

export const relatorioMovimentacoesSchema = z.object({
  success: z.boolean(),
  movimentacoes: z.array(linhaMovimentacaoSchema),
  resumo: z.object({
    total_movimentacoes: z.number(),
    total_saidas: z.number(),
    total_entradas: z.number(),
    saldo: z.number(),
  }),
})
export type RelatorioMovimentacoes = z.infer<typeof relatorioMovimentacoesSchema>
