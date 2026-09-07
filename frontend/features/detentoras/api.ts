import { apiFetch } from '@/lib/api'
import { ApiError } from '@/lib/api-error'
import type { Modulo } from '@/features/modulos/config'
import { detentoraSchema, type Detentora, type DetentoraForm } from './schema'

const detentoraPersistidaSchema = detentoraSchema.extend({
  id: detentoraSchema.shape.id.unwrap(),
})

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
      return detentoraPersistidaSchema.parse(data)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null
      throw error
    }
  },

  /** Tela de gestão inclui inativas — diferente do uso em O.S., que só vê ativas. */
  async listar(modulo: Modulo, incluirInativas = true): Promise<Detentora[]> {
    const data = await apiFetch<unknown[]>(
      `/api/detentoras/?incluir_inativas=${incluirInativas}`,
      { modulo },
    )
    return data.map((item) => detentoraPersistidaSchema.parse(item))
  },

  async criar(dados: DetentoraForm): Promise<Detentora> {
    const data = await apiFetch<unknown>('/api/detentoras/', { method: 'POST', body: dados })
    return detentoraPersistidaSchema.parse(data)
  },

  async atualizar(id: number, dados: DetentoraForm): Promise<Detentora> {
    const data = await apiFetch<unknown>(`/api/detentoras/${id}`, { method: 'PUT', body: dados })
    return detentoraPersistidaSchema.parse(data)
  },

  /** Soft delete no backend (ativo=False) — nunca remove o registro. */
  inativar(id: number) {
    return apiFetch<{ sucesso: boolean; mensagem: string }>(`/api/detentoras/${id}`, {
      method: 'DELETE',
    })
  },
}
