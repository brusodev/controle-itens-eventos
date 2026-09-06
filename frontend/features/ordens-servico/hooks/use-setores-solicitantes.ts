import { useQuery } from '@tanstack/react-query'
import type { Modulo } from '@/features/modulos/config'
import { osAPI } from '../api'

export function useSetoresSolicitantes(modulo: Modulo) {
  return useQuery({
    queryKey: ['ordens-servico', modulo, 'setores-solicitantes'],
    queryFn: () => osAPI.setoresSolicitantes(modulo),
  })
}
