import { useQuery } from '@tanstack/react-query'
import { relatoriosAPI } from '../api'
import type { FiltrosOrganizacao } from '../schema'

/** Sem parâmetro de módulo: o backend já filtra modulo='organizacao' fixo. */
export function useRelatorioOrganizacao(filtros: FiltrosOrganizacao, habilitado: boolean) {
  return useQuery({
    queryKey: ['relatorios', 'organizacao', filtros],
    queryFn: () => relatoriosAPI.organizacaoEventos(filtros),
    enabled: habilitado,
  })
}
