import { z } from 'zod'

/**
 * 6. Eventos — Organização — porta de gerarRelatorioOrgEventos
 * (relatorios.js). Só existe no módulo organizacao — backend filtra
 * modulo='organizacao' fixo, sem parâmetro.
 */

export const filtrosOrganizacaoSchema = z.object({
  grupo: z.string(),
  status: z.string(),
  dataInicio: z.string(),
  dataFim: z.string(),
  empresa: z.string(),
})
export type FiltrosOrganizacao = z.infer<typeof filtrosOrganizacaoSchema>
export const EMPTY_FILTROS_ORGANIZACAO: FiltrosOrganizacao = {
  grupo: '',
  status: '',
  dataInicio: '',
  dataFim: '',
  empresa: '',
}

const eventoOrganizacaoSchema = z.object({
  id: z.number(),
  numeroOS: z.string(),
  evento: z.string(),
  dataEvento: z.string(),
  local: z.string(),
  grupo: z.union([z.number(), z.string()]),
  grupoNome: z.string(),
  empresa: z.string(),
  status: z.string(),
  dataEmissao: z.string(),
  qtdPessoas: z.number(),
  custoMontagem: z.number(),
  custoRH: z.number(),
  custoTI: z.number(),
  custoGrafico: z.number(),
  custoTotal: z.number(),
  custoPorPessoa: z.number(),
  totalItens: z.number(),
})

export const relatorioOrganizacaoSchema = z.object({
  success: z.boolean(),
  eventos: z.array(eventoOrganizacaoSchema),
  estatisticas: z.object({
    total_eventos: z.number(),
    total_pessoas: z.number(),
    custo_total_geral: z.number(),
    custo_medio_evento: z.number(),
    custo_medio_pessoa: z.number(),
  }),
})
export type RelatorioOrganizacao = z.infer<typeof relatorioOrganizacaoSchema>
