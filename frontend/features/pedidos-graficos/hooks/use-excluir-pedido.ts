import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pedidosGraficosAPI } from '../api'

/** DELETE — o backend só permite enquanto o pedido está pendente (409 caso contrário). */
export function useExcluirPedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => pedidosGraficosAPI.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-graficos'] })
    },
  })
}
