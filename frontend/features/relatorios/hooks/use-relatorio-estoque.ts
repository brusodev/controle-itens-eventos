import { useQuery } from '@tanstack/react-query'
import { useModulo } from '@/features/modulos/modulo-context'
import { relatoriosAPI } from '../api'
import type { FiltrosEstoque } from '../schema'

export function useRelatorioEstoque(filtros: FiltrosEstoque, habilitado: boolean) {
  const { modulo } = useModulo()
  return useQuery({
    queryKey: ['relatorios', 'estoque', modulo, filtros],
    queryFn: () => relatoriosAPI.estoquePosicao(filtros, modulo),
    enabled: habilitado,
  })
}
