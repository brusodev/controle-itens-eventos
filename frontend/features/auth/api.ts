import { apiFetch } from '@/lib/api'
import { usuarioSchema, type Usuario } from './schema'

export const authAPI = {
  async usuarioAtual(): Promise<Usuario> {
    const data = await apiFetch<unknown>('/auth/api/me')
    return usuarioSchema.parse(data)
  },
}
