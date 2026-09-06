import { useQuery } from '@tanstack/react-query'
import type { Modulo } from '@/features/modulos/config'
import { osAPI } from '../api'
import type { FiltroOSState } from '../components/lista/filtros-os'

export function useOrdensServico(modulo: Modulo, filtro: FiltroOSState) {
  return useQuery({
    queryKey: ['ordens-servico', modulo, filtro],
    queryFn: () =>
      osAPI.listar(modulo, {
        busca: filtro.busca || undefined,
        grupo: filtro.grupo || undefined,
        filtro: filtro.filtroPagamento || undefined,
      }),
  })
}
