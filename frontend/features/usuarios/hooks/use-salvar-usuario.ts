import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clearCsrfToken } from '@/lib/csrf'
import { usuariosAPI } from '../api'
import type { UsuarioPayload } from '../schema'

/**
 * Um único caminho para criar e editar — mesmo padrão de useSalvarCategoria.
 *
 * O cuidado extra desse domínio: quando o admin edita o PRÓPRIO usuário e
 * muda perfil ou detentora, o backend regenera `session['csrf_token']`
 * (auth_routes.py:387) e avisa via `sessao_atualizada: true`. Sem descartar
 * o token em cache aqui, a próxima mutação (mesmo uma sem relação, como
 * criar uma categoria) reenviaria o X-CSRF-Token antigo e tomaria 403 —
 * `apiFetch` já limpa o cache em qualquer 403, mas só DEPOIS de a chamada
 * falhar uma vez; aqui dá para acertar de primeira porque o backend já
 * avisou que o token mudou.
 *
 * Também atualiza ['auth','me'] quando é o próprio usuário — sidebar/topbar
 * (nome, perfil) refletem na hora, sem esperar refetch.
 */
export function useSalvarUsuario(usuarioLogadoId: number, id?: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UsuarioPayload) =>
      id ? usuariosAPI.atualizar(id, payload) : usuariosAPI.criar(payload),
    onSuccess: ({ usuario, sessaoAtualizada }) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })

      if (usuario.id === usuarioLogadoId) {
        queryClient.setQueryData(['auth', 'me'], usuario)
        if (sessaoAtualizada) clearCsrfToken()
      }
    },
  })
}
