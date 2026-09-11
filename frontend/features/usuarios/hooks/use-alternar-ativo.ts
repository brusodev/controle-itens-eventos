import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clearCsrfToken } from '@/lib/csrf'
import { usuariosAPI } from '../api'

/**
 * Ativar/desativar direto na listagem — porta de toggleAtivo()
 * (gerenciar-usuarios.html:826), que manda só `{ ativo }`, sem reabrir o
 * modal com o formulário inteiro.
 *
 * Hook separado de useSalvarUsuario porque aqui o alvo muda a cada clique
 * (qualquer linha da lista) — teria que ser parametrizado por chamada, não
 * fixado na montagem do hook como o modal de edição faz.
 */
export function useAlternarAtivo(usuarioLogadoId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) => usuariosAPI.atualizar(id, { ativo }),
    onSuccess: ({ usuario, sessaoAtualizada }) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      if (usuario.id === usuarioLogadoId) {
        queryClient.setQueryData(['auth', 'me'], usuario)
        if (sessaoAtualizada) clearCsrfToken()
      }
    },
  })
}
