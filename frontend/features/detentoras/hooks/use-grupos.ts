import { useQuery } from '@tanstack/react-query'
import type { Modulo } from '@/features/modulos/config'
import { detentorasAPI } from '../api'

export function useGrupos(modulo: Modulo) {
  return useQuery({
    queryKey: ['detentoras', 'grupos', modulo],
    queryFn: () => detentorasAPI.listarGrupos(modulo),
  })
}
