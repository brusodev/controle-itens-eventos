import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pedidosGraficosAPI } from '../api'

export function useCancelarPedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => pedidosGraficosAPI.cancelar(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-graficos'] })
    },
  })
}
