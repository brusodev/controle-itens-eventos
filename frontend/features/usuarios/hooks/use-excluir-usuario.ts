import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usuariosAPI } from '../api'

/** DELETE — o backend já recusa a exclusão da própria conta (auth_routes.py:412-413). */
export function useExcluirUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => usuariosAPI.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    },
  })
}
