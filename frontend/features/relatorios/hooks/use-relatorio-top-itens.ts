import { useQuery } from '@tanstack/react-query'
import { useModulo } from '@/features/modulos/modulo-context'
import { relatoriosAPI } from '../api'
import type { FiltrosTopItens } from '../schema'

export function useRelatorioTopItens(filtros: FiltrosTopItens, habilitado: boolean) {
  const { modulo } = useModulo()
  return useQuery({
    queryKey: ['relatorios', 'top-itens', modulo, filtros],
    queryFn: () => relatoriosAPI.itensMaisUtilizados(filtros, modulo),
    enabled: habilitado,
  })
}
