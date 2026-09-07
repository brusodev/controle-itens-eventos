import { useQuery } from '@tanstack/react-query'
import type { Modulo } from '@/features/modulos/config'
import { detentorasAPI } from '../api'

/** Tela de gestão — inclui inativas, diferente do uso em O.S. (só ativas). */
export function useListarDetentoras(modulo: Modulo) {
  return useQuery({
    queryKey: ['detentoras', modulo, 'todas'],
    queryFn: () => detentorasAPI.listar(modulo, true),
  })
}
