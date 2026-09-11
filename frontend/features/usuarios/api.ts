import { apiFetch } from '@/lib/api'
import { usuarioAdminSchema, type UsuarioAdmin, type UsuarioPayload } from './schema'

/**
 * Formato único devolvido por criar/atualizar. `criar` nunca regenera CSRF
 * (não existe sessão prévia para o novo usuário mudar) — `sessaoAtualizada`
 * vem sempre `false` nesse caso, só `atualizar` pode marcar `true`
 * (auth_routes.py:389-393, quando o alvo é o próprio usuário logado).
 */
export interface ResultadoSalvarUsuario {
  usuario: UsuarioAdmin
  sessaoAtualizada: boolean
}

/**
 * Domínio Usuários — porta de gerenciar-usuarios.html.
 *
 * `criar` usa POST /auth/registro (não uma rota /api/usuarios própria — o
 * backend reaproveita a rota de registro, mesmo padrão do legado).
 */
export const usuariosAPI = {
  async listar(): Promise<UsuarioAdmin[]> {
    const data = await apiFetch<unknown[]>('/auth/api/usuarios')
    return data.map((item) => usuarioAdminSchema.parse(item))
  },

  async criar(payload: UsuarioPayload): Promise<ResultadoSalvarUsuario> {
    const data = await apiFetch<{ usuario: unknown }>('/auth/registro', { method: 'POST', body: payload })
    return { usuario: usuarioAdminSchema.parse(data.usuario), sessaoAtualizada: false }
  },

  async atualizar(id: number, payload: Partial<UsuarioPayload>): Promise<ResultadoSalvarUsuario> {
    const data = await apiFetch<{ sucesso: boolean; usuario: unknown; sessao_atualizada: boolean }>(
      `/auth/api/usuarios/${id}`,
      { method: 'PUT', body: payload },
    )
    return { usuario: usuarioAdminSchema.parse(data.usuario), sessaoAtualizada: data.sessao_atualizada }
  },

  excluir(id: number) {
    return apiFetch<{ sucesso: boolean; mensagem: string }>(`/auth/api/usuarios/${id}`, { method: 'DELETE' })
  },
}
