import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api-error'
import { itensAPI } from '../api'
import type { NovoItemPayload } from '../schema'

export function useCriarItem() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (payload: NovoItemPayload) => itensAPI.criar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alimentacao'] })
      showToast('Item adicionado com sucesso.', 'success')
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Erro ao salvar item.'
      showToast(message, 'error')
    },
  })
}
