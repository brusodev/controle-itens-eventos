import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pedidosGraficosAPI } from '../api'
import type { PedidoPayload } from '../schema'

/** Um único caminho para criar e editar — mesmo padrão de useSalvarOS/useSalvarCategoria. */
export function useSalvarPedido(id?: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PedidoPayload) => (id ? pedidosGraficosAPI.atualizar(id, payload) : pedidosGraficosAPI.criar(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-graficos'] })
    },
  })
}
