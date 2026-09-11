import { z } from 'zod'

/** 1. Ordens de Serviço — porta de gerarRelatorioOS/exportarRelatorioOSExcel (relatorios.js). */

export const filtrosRelatorioOSSchema = z.object({
  dataInicio: z.string(),
  dataFim: z.string(),
  regiao: z.string(),
  contratada: z.string(),
  servico: z.string(),
})
export type FiltrosRelatorioOS = z.infer<typeof filtrosRelatorioOSSchema>
export const EMPTY_FILTROS_OS: FiltrosRelatorioOS = {
  dataInicio: '',
  dataFim: '',
  regiao: '',
  contratada: '',
  servico: '',
}

const linhaRelatorioOSSchema = z.object({
  numeroOS: z.string(),
  dataEmissao: z.string(),
  solicitante: z.string(),
  dataEvento: z.string(),
  evento: z.string(),
  status: z.string(),
  tipo: z.string(),
  quantidade: z.number(),
  valor: z.number(),
})

export const relatorioOSSchema = z.object({
  success: z.boolean(),
  linhas: z.array(linhaRelatorioOSSchema),
  estatisticas: z.object({
    total_os: z.number(),
    total_itens: z.number(),
    regioes_atendidas: z.number(),
    valor_total: z.number(),
    por_servico: z.record(z.string(), z.number()),
    por_contratada: z.record(z.string(), z.number()),
  }),
})
export type RelatorioOS = z.infer<typeof relatorioOSSchema>
