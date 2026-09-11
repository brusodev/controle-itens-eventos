import { useQuery } from '@tanstack/react-query'
import { usuariosAPI } from '../api'

/** Lista completa — porta de carregarUsuarios() (gerenciar-usuarios.html:588). */
export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: usuariosAPI.listar,
  })
}
