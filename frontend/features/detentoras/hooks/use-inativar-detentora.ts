import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api-error'
import { detentorasAPI } from '../api'

export function useInativarDetentora() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (id: number) => detentorasAPI.inativar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detentoras'] })
      showToast('Detentora inativada com sucesso.', 'success')
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Erro ao inativar detentora.'
      showToast(message, 'error')
    },
  })
}
