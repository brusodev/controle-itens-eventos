import { useQuery } from '@tanstack/react-query'
import { detentorasAPI } from '../api'

/** Todas as detentoras, qualquer módulo — usado pelo select de vínculo do usuário empresa. */
export function useListarTodasDetentoras() {
  return useQuery({
    queryKey: ['detentoras', 'todas-modulos'],
    queryFn: () => detentorasAPI.listarTodas(true),
  })
}
