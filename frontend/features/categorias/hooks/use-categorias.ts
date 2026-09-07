import { useQuery } from '@tanstack/react-query'
import type { Modulo } from '@/features/modulos/config'
import { categoriasAPI } from '../api'

export function useCategorias(modulo: Modulo) {
  return useQuery({
    queryKey: ['categorias', modulo],
    queryFn: () => categoriasAPI.listar(modulo),
  })
}
