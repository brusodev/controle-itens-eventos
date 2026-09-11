import { useQuery } from '@tanstack/react-query'
import { auditoriaAPI } from '../api'

/** Os 3 cards do topo — porta de carregarEstatisticas() (auditoria.html:541). */
export function useEstatisticasAuditoria() {
  return useQuery({
    queryKey: ['auditoria', 'estatisticas'],
    queryFn: auditoriaAPI.estatisticas,
    staleTime: 60 * 1000,
  })
}
