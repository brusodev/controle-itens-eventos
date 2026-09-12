import { useQuery } from '@tanstack/react-query'
import { pedidosGraficosAPI } from '../api'
import type { FiltrosPedidos } from '../schema'

export function usePedidosGraficos(filtros: FiltrosPedidos) {
  return useQuery({
    queryKey: ['pedidos-graficos', filtros],
    queryFn: () => pedidosGraficosAPI.listar(filtros),
  })
}
