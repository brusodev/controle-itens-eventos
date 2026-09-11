import { useQuery } from '@tanstack/react-query'
import { auditoriaAPI } from '../api'

/** Usuários que têm registros — popula o select de filtro. Muda pouco. */
export function useUsuariosAuditoria() {
  return useQuery({
    queryKey: ['auditoria', 'usuarios'],
    queryFn: auditoriaAPI.usuarios,
    staleTime: 5 * 60 * 1000,
  })
}
