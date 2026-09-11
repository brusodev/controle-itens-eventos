import { useQuery } from '@tanstack/react-query'
import { relatoriosAPI } from '../api'
import type { FiltrosPagamentos } from '../schema'

export function useRelatorioPagamentos(filtros: FiltrosPagamentos, habilitado: boolean) {
  return useQuery({
    queryKey: ['relatorios', 'pagamentos', filtros],
    queryFn: () => relatoriosAPI.pagamentos(filtros),
    enabled: habilitado,
  })
}
