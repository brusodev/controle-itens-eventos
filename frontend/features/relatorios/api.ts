import { apiFetch } from '@/lib/api'
import type { Modulo } from '@/features/modulos/config'
import {
  relatorioConsumoSchema,
  relatorioEstoqueSchema,
  relatorioMovimentacoesSchema,
  relatorioOrganizacaoSchema,
  relatorioOSSchema,
  relatorioPagamentosSchema,
  relatorioTopItensSchema,
  relatorioTransporteSchema,
  type FiltrosConsumo,
  type FiltrosEstoque,
  type FiltrosMovimentacoes,
  type FiltrosOrganizacao,
  type FiltrosPagamentos,
  type FiltrosRelatorioOS,
  type FiltrosTopItens,
  type FiltrosTransporte,
} from './schema'

/**
 * Domínio Relatórios — porta de relatorios.js. Exportações continuam no
 * Flask: as funções `url*` só montam a URL com os mesmos filtros da
 * consulta JSON, para a planilha nunca divergir do que a tela mostra (o
 * backend já garante isso reaproveitando a mesma query — ver
 * _query_ordens_servico, relatorios_routes.py:76).
 */

function paramsSemVazios(campos: Record<string, string>): URLSearchParams {
  const params = new URLSearchParams()
  for (const [chave, valor] of Object.entries(campos)) {
    if (valor) params.set(chave, valor)
  }
  return params
}

export const relatoriosAPI = {
  async ordensServico(filtros: FiltrosRelatorioOS, modulo: Modulo) {
    const params = paramsSemVazios({
      data_inicio: filtros.dataInicio,
      data_fim: filtros.dataFim,
      regiao: filtros.regiao,
      contratada: filtros.contratada,
      servico: filtros.servico,
    })
    const data = await apiFetch<unknown>(`/api/relatorios/ordens-servico?${params}`, { modulo })
    return relatorioOSSchema.parse(data)
  },
  urlExcelOrdensServico(filtros: FiltrosRelatorioOS, modulo: Modulo): string {
    const params = paramsSemVazios({
      data_inicio: filtros.dataInicio,
      data_fim: filtros.dataFim,
      regiao: filtros.regiao,
      contratada: filtros.contratada,
      servico: filtros.servico,
      modulo,
    })
    return `/api/relatorios/ordens-servico/excel?${params}`
  },

  async estoquePosicao(filtros: FiltrosEstoque, modulo: Modulo) {
    const params = paramsSemVazios({ categoria_id: filtros.categoriaId, regiao: filtros.regiao })
    const data = await apiFetch<unknown>(`/api/relatorios/estoque-posicao?${params}`, { modulo })
    return relatorioEstoqueSchema.parse(data)
  },
  urlPdfEstoque(filtros: FiltrosEstoque, modulo: Modulo): string {
    const params = paramsSemVazios({ categoria_id: filtros.categoriaId, regiao: filtros.regiao, modulo })
    return `/api/relatorios/pdf/estoque?${params}`
  },

  async movimentacoes(filtros: FiltrosMovimentacoes, modulo: Modulo) {
    const params = paramsSemVazios({
      data_inicio: filtros.dataInicio,
      data_fim: filtros.dataFim,
      regiao: filtros.regiao,
      tipo: filtros.tipo,
    })
    const data = await apiFetch<unknown>(`/api/relatorios/movimentacoes?${params}`, { modulo })
    return relatorioMovimentacoesSchema.parse(data)
  },

  async consumoPorCategoria(filtros: FiltrosConsumo, modulo: Modulo) {
    const params = paramsSemVazios({ data_inicio: filtros.dataInicio, data_fim: filtros.dataFim })
    const data = await apiFetch<unknown>(`/api/relatorios/consumo-por-categoria?${params}`, { modulo })
    return relatorioConsumoSchema.parse(data)
  },

  async itensMaisUtilizados(filtros: FiltrosTopItens, modulo: Modulo) {
    const params = paramsSemVazios({
      data_inicio: filtros.dataInicio,
      data_fim: filtros.dataFim,
      grupo: filtros.grupo,
      ordenar_por: filtros.ordenarPor,
      limite: filtros.limite,
    })
    const data = await apiFetch<unknown>(`/api/relatorios/itens-mais-utilizados?${params}`, { modulo })
    return relatorioTopItensSchema.parse(data)
  },
  urlExcelTopItens(filtros: FiltrosTopItens, modulo: Modulo): string {
    const params = paramsSemVazios({
      data_inicio: filtros.dataInicio,
      data_fim: filtros.dataFim,
      grupo: filtros.grupo,
      ordenar_por: filtros.ordenarPor,
      limite: filtros.limite,
      modulo,
    })
    return `/api/relatorios/itens-mais-utilizados/excel?${params}`
  },

  /** Só existe no módulo organizacao — backend filtra modulo='organizacao' fixo, sem parâmetro. */
  async organizacaoEventos(filtros: FiltrosOrganizacao) {
    const params = paramsSemVazios({
      grupo: filtros.grupo,
      status: filtros.status,
      data_inicio: filtros.dataInicio,
      data_fim: filtros.dataFim,
      empresa: filtros.empresa,
    })
    const data = await apiFetch<unknown>(`/api/relatorios/organizacao/eventos?${params}`)
    return relatorioOrganizacaoSchema.parse(data)
  },
  urlExcelOrganizacao(filtros: FiltrosOrganizacao): string {
    const params = paramsSemVazios({
      grupo: filtros.grupo,
      status: filtros.status,
      data_inicio: filtros.dataInicio,
      data_fim: filtros.dataFim,
      empresa: filtros.empresa,
    })
    return `/api/relatorios/organizacao/excel?${params}`
  },

  /** Só existe no módulo transporte — backend filtra modulo='transporte' fixo, sem parâmetro. */
  async transporteSetores(filtros: FiltrosTransporte) {
    const params = paramsSemVazios({
      setor: filtros.setor,
      status: filtros.status,
      data_inicio: filtros.dataInicio,
      data_fim: filtros.dataFim,
      empresa: filtros.empresa,
    })
    const data = await apiFetch<unknown>(`/api/relatorios/transporte/setores?${params}`)
    return relatorioTransporteSchema.parse(data)
  },
  urlExcelTransporte(filtros: FiltrosTransporte): string {
    const params = paramsSemVazios({
      setor: filtros.setor,
      status: filtros.status,
      data_inicio: filtros.dataInicio,
      data_fim: filtros.dataFim,
      empresa: filtros.empresa,
    })
    return `/api/relatorios/transporte/excel?${params}`
  },

  /** Sem módulo por padrão (todos) — só filtra se o usuário escolher um. */
  async pagamentos(filtros: FiltrosPagamentos) {
    const params = paramsSemVazios({
      status: filtros.status,
      data_inicio_vencimento: filtros.dataInicioVencimento,
      data_fim_vencimento: filtros.dataFimVencimento,
      modulo: filtros.modulo,
      empresa: filtros.empresa,
    })
    const data = await apiFetch<unknown>(`/api/relatorios/pagamentos?${params}`)
    return relatorioPagamentosSchema.parse(data)
  },
  urlExcelPagamentos(filtros: FiltrosPagamentos): string {
    const params = paramsSemVazios({
      status: filtros.status,
      data_inicio_vencimento: filtros.dataInicioVencimento,
      data_fim_vencimento: filtros.dataFimVencimento,
      modulo: filtros.modulo,
      empresa: filtros.empresa,
    })
    return `/api/relatorios/pagamentos/excel?${params}`
  },
}
