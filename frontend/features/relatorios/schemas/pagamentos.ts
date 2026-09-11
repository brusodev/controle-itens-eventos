import { z } from 'zod'

/** 8. Controle de Pagamentos — porta de gerarRelatorioPagamentos (relatorios.js). */

export const STATUS_PAGAMENTO = ['pago', 'pendente', 'vencido', 'sem_prazo'] as const
export type StatusPagamento = (typeof STATUS_PAGAMENTO)[number]

export const filtrosPagamentosSchema = z.object({
  status: z.string(),
  dataInicioVencimento: z.string(),
  dataFimVencimento: z.string(),
  modulo: z.string(),
  empresa: z.string(),
})
export type FiltrosPagamentos = z.infer<typeof filtrosPagamentosSchema>
export const EMPTY_FILTROS_PAGAMENTOS: FiltrosPagamentos = {
  status: '',
  dataInicioVencimento: '',
  dataFimVencimento: '',
  modulo: '',
  empresa: '',
}

const pagamentoSchema = z.object({
  id: z.number(),
  numeroOS: z.string(),
  empresa: z.string(),
  modulo: z.string(),
  regiao: z.union([z.number(), z.string()]),
  dataEmissao: z.string(),
  vencimento: z.string(),
  valorTotal: z.number(),
  status: z.enum(STATUS_PAGAMENTO),
})

export const relatorioPagamentosSchema = z.object({
  success: z.boolean(),
  pagamentos: z.array(pagamentoSchema),
  estatisticas: z.object({
    total: z.number(),
    pagos: z.number(),
    pendentes: z.number(),
    vencidos: z.number(),
    sem_prazo: z.number(),
    valor_total: z.number(),
  }),
})
export type RelatorioPagamentos = z.infer<typeof relatorioPagamentosSchema>
