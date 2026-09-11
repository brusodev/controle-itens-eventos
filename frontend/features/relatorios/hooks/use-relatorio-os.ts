import { useQuery } from '@tanstack/react-query'
import { useModulo } from '@/features/modulos/modulo-context'
import { relatoriosAPI } from '../api'
import type { FiltrosRelatorioOS } from '../schema'

export function useRelatorioOS(filtros: FiltrosRelatorioOS, habilitado: boolean) {
  const { modulo } = useModulo()
  return useQuery({
    queryKey: ['relatorios', 'os', modulo, filtros],
    queryFn: () => relatoriosAPI.ordensServico(filtros, modulo),
    enabled: habilitado,
  })
}
