import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api-error'
import { estoqueAPI } from '../api'
import type { AtualizarEstoquePayload } from '../schema'

export function useAtualizarEstoque(itemId: number) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (payload: AtualizarEstoquePayload) => estoqueAPI.atualizarEstoque(itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alimentacao'] })
      showToast('Estoque atualizado com sucesso.', 'success')
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Erro ao salvar dados.'
      showToast(message, 'error')
    },
  })
}
