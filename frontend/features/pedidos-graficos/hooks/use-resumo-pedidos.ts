import { useQuery } from '@tanstack/react-query'
import { pedidosGraficosAPI } from '../api'

/** Os 4 cards de alerta do painel — porta de resumoPedidosGraficos() (pedidos-graficos.js:37). */
export function useResumoPedidos() {
  return useQuery({
    queryKey: ['pedidos-graficos', 'resumo'],
    queryFn: pedidosGraficosAPI.resumo,
  })
}
