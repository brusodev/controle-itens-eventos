import { useQuery } from '@tanstack/react-query'
import { relatoriosAPI } from '../api'
import type { FiltrosTransporte } from '../schema'

/** Sem parâmetro de módulo: o backend já filtra modulo='transporte' fixo. */
export function useRelatorioTransporte(filtros: FiltrosTransporte, habilitado: boolean) {
  return useQuery({
    queryKey: ['relatorios', 'transporte', filtros],
    queryFn: () => relatoriosAPI.transporteSetores(filtros),
    enabled: habilitado,
  })
}
