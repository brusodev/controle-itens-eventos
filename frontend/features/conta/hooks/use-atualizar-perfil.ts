import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contaAPI } from '../api'
import type { PerfilForm } from '../schema'

/**
 * Atualiza o perfil do usuário logado. O backend também atualiza a sessão
 * Flask (auth_routes.py:514-516), então o cache de ['auth','me'] — que a
 * sidebar e a topbar consomem — precisa receber o usuário novo, senão o
 * nome só muda depois de um reload (o legado fazia location.reload()).
 */
export function useAtualizarPerfil() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dados: PerfilForm) => contaAPI.atualizarPerfil(dados),
    onSuccess: (usuario) => {
      queryClient.setQueryData(['auth', 'me'], usuario)
    },
  })
}
