import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api-error'
import { itensAPI } from '../api'

export function useExcluirItem() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (itemId: number) => itensAPI.excluir(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alimentacao'] })
      showToast('Item removido com sucesso.', 'success')
    },
    onError: (error) => {
      // Backend bloqueia exclusão de item referenciado em O.S. — repassar a mensagem.
      const message = error instanceof ApiError ? error.message : 'Erro ao remover item.'
      showToast(message, 'error')
    },
  })
}
