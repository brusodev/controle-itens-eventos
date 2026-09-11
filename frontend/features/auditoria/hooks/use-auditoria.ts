import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { auditoriaAPI } from '../api'
import type { FiltrosAuditoria } from '../schema'

/**
 * Página de registros. `keepPreviousData` mantém a tabela anterior visível
 * enquanto a próxima carrega — sem isso a lista pisca em branco a cada
 * clique de paginação.
 */
export function useAuditoria(filtros: FiltrosAuditoria, pagina: number) {
  return useQuery({
    queryKey: ['auditoria', 'lista', filtros, pagina],
    queryFn: () => auditoriaAPI.listar(filtros, pagina),
    placeholderData: keepPreviousData,
  })
}
