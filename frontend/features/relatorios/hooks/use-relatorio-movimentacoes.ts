import { useQuery } from '@tanstack/react-query'
import { useModulo } from '@/features/modulos/modulo-context'
import { relatoriosAPI } from '../api'
import type { FiltrosMovimentacoes } from '../schema'

export function useRelatorioMovimentacoes(filtros: FiltrosMovimentacoes, habilitado: boolean) {
  const { modulo } = useModulo()
  return useQuery({
    queryKey: ['relatorios', 'movimentacoes', modulo, filtros],
    queryFn: () => relatoriosAPI.movimentacoes(filtros, modulo),
    enabled: habilitado,
  })
}
