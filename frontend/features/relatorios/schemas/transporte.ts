import { z } from 'zod'

/**
 * 7. Transportes por Setor — porta de gerarRelatorioTransporteSetores
 * (relatorios.js). Só existe no módulo transporte — backend filtra
 * modulo='transporte' fixo, sem parâmetro.
 */

export const filtrosTransporteSchema = z.object({
  setor: z.string(),
  status: z.string(),
  dataInicio: z.string(),
  dataFim: z.string(),
  empresa: z.string(),
})
export type FiltrosTransporte = z.infer<typeof filtrosTransporteSchema>
export const EMPTY_FILTROS_TRANSPORTE: FiltrosTransporte = {
  setor: '',
  status: '',
  dataInicio: '',
  dataFim: '',
  empresa: '',
}

const ordemTransporteSchema = z.object({
  id: z.number(),
  numeroOS: z.string(),
  setor: z.string(),
  evento: z.string(),
  dataEvento: z.string(),
  empresa: z.string(),
  status: z.string(),
  dataEmissao: z.string(),
  totalItens: z.number(),
  valorTotal: z.number(),
})

const resumoSetorSchema = z.object({
  setor: z.string(),
  qtdOS: z.number(),
  valorTotal: z.number(),
})

export const relatorioTransporteSchema = z.object({
  success: z.boolean(),
  ordens: z.array(ordemTransporteSchema),
  setores: z.array(resumoSetorSchema),
  estatisticas: z.object({
    total_os: z.number(),
    total_setores: z.number(),
    valor_total_geral: z.number(),
    valor_medio_os: z.number(),
  }),
})
export type RelatorioTransporte = z.infer<typeof relatorioTransporteSchema>
