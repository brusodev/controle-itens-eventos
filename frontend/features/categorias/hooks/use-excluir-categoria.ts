import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api-error'
import { categoriasAPI } from '../api'

export function useExcluirCategoria() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (id: number) => categoriasAPI.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      showToast('Categoria removida com sucesso.', 'success')
    },
    onError: (error) => {
      // Mensagem do backend inclui a contagem de itens vinculados quando
      // bloqueia a exclusão — repassar tal como o servidor formulou.
      const message = error instanceof ApiError ? error.message : 'Erro ao remover categoria.'
      showToast(message, 'error')
    },
  })
}
