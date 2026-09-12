import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pedidosGraficosAPI } from '../api'

/**
 * Vincula 1 ou N pedidos à O.S. recém-criada — chamado por FormularioOS logo
 * após o POST de criação ter sucesso (mesmo ponto onde emitir-os.js chamava
 * APIClient.vincularOSAosPedidos, restaurarPedidosParaOS()).
 */
export function useVincularOS() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ pedidoIds, ordemServicoId }: { pedidoIds: number[]; ordemServicoId: number }) => {
      if (pedidoIds.length === 1) {
        return pedidosGraficosAPI.vincularOS(pedidoIds[0], ordemServicoId)
      }
      return pedidosGraficosAPI.vincularOSLote(pedidoIds, ordemServicoId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-graficos'] })
    },
  })
}
