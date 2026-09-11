import { useQuery } from '@tanstack/react-query'
import { useModulo } from '@/features/modulos/modulo-context'
import { relatoriosAPI } from '../api'
import type { FiltrosConsumo } from '../schema'

export function useRelatorioConsumo(filtros: FiltrosConsumo, habilitado: boolean) {
  const { modulo } = useModulo()
  return useQuery({
    queryKey: ['relatorios', 'consumo', modulo, filtros],
    queryFn: () => relatoriosAPI.consumoPorCategoria(filtros, modulo),
    enabled: habilitado,
  })
}
