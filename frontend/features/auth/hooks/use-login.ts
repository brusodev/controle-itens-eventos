import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authAPI } from '../api'

/** Porta do fluxo de submit em login.html:71-122. */
export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, senha }: { email: string; senha: string }) => authAPI.login(email, senha),
    onSuccess: (resposta) => {
      // Popula o cache de useUsuarioAtual imediatamente — evita um round-trip
      // extra a /auth/api/me assim que a página de destino monta.
      queryClient.setQueryData(['auth', 'me'], resposta.usuario)
    },
  })
}
