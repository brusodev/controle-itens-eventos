import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pedidosGraficosAPI } from '../api'

/** Alterna o flag de entregue — porta de toggleEntreguePedido() (pedidos-graficos.js:216). */
export function useMarcarEntrega() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, entregue }: { id: number; entregue: boolean }) => pedidosGraficosAPI.marcarEntrega(id, entregue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-graficos'] })
    },
  })
}
