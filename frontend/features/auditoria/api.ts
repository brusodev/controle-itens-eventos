import { apiFetch } from '@/lib/api'
import {
  estatisticasAuditoriaSchema,
  paginaAuditoriaSchema,
  usuarioAuditoriaSchema,
  LIMITE_POR_PAGINA,
  type EstatisticasAuditoria,
  type FiltrosAuditoria,
  type PaginaAuditoria,
  type UsuarioAuditoria,
} from './schema'

/**
 * Monta a query dos 4 filtros — porta de carregarAuditorias()
 * (auditoria.html:573-593). As datas vão com hora fixa nos extremos do dia,
 * como no legado: o backend compara com datetime, então `data_fim` sem
 * T23:59:59 excluiria o próprio dia escolhido.
 */
export function montarParams(filtros: FiltrosAuditoria, pagina: number): string {
  const params = new URLSearchParams({ pagina: String(pagina), limite: String(LIMITE_POR_PAGINA) })

  if (filtros.usuarioId) params.set('usuario_id', filtros.usuarioId)
  if (filtros.modulo) params.set('modulo', filtros.modulo)
  if (filtros.acao) params.set('acao', filtros.acao)
  if (filtros.dataInicio) params.set('data_inicio', `${filtros.dataInicio}T00:00:00`)
  if (filtros.dataFim) params.set('data_fim', `${filtros.dataFim}T23:59:59`)

  return params.toString()
}

/** Domínio Auditoria — só leitura, todas as rotas são @admin_requerido. */
export const auditoriaAPI = {
  async listar(filtros: FiltrosAuditoria, pagina: number): Promise<PaginaAuditoria> {
    const data = await apiFetch<unknown>(`/api/auditoria/?${montarParams(filtros, pagina)}`)
    return paginaAuditoriaSchema.parse(data)
  },

  async usuarios(): Promise<UsuarioAuditoria[]> {
    const data = await apiFetch<unknown[]>('/api/auditoria/usuarios')
    return data.map((item) => usuarioAuditoriaSchema.parse(item))
  },

  async estatisticas(): Promise<EstatisticasAuditoria> {
    const data = await apiFetch<unknown>('/api/auditoria/estatisticas')
    return estatisticasAuditoriaSchema.parse(data)
  },
}
