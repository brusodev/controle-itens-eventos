import { apiFetch } from '@/lib/api'
import { ApiError } from '@/lib/api-error'
import type { Modulo } from '@/features/modulos/config'
import { detentoraSchema, type Detentora } from './schema'

export const detentorasAPI = {
  listarGrupos(modulo: Modulo) {
    return apiFetch<string[]>('/api/detentoras/grupos', { modulo })
  },

  /** null quando não há detentora cadastrada para o grupo (404 do backend) — nunca lançado como erro genérico. */
  async obterPorGrupo(grupo: string, modulo: Modulo): Promise<Detentora | null> {
    try {
      const data = await apiFetch<unknown>(`/api/detentoras/grupo/${encodeURIComponent(grupo)}`, {
        modulo,
      })
      return detentoraSchema.parse(data)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null
      throw error
    }
  },
}
