import { useQuery } from '@tanstack/react-query'
import type { Modulo } from '@/features/modulos/config'
import { estoqueAPI } from '../api'

/** Itens disponíveis por categoria, com estoque por região — fonte do seletor de itens da O.S. */
export function useDadosAlimentacao(modulo: Modulo) {
  return useQuery({
    queryKey: ['alimentacao', modulo],
    queryFn: () => estoqueAPI.listarPorModulo(modulo),
  })
}
