import { useQuery } from '@tanstack/react-query'
import { authAPI } from '../api'

/** Usuário da sessão — necessário para as regras de visibilidade por perfil (§ Paridade: 9 ações). */
export function useUsuarioAtual() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authAPI.usuarioAtual,
    staleTime: Infinity, // só muda com novo login, que já invalida tudo
  })
}
