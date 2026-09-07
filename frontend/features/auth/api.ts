import { apiFetch } from '@/lib/api'
import { ApiError } from '@/lib/api-error'
import { loginResponseSchema, usuarioSchema, type LoginResponse, type Usuario } from './schema'

export const authAPI = {
  async usuarioAtual(): Promise<Usuario> {
    const data = await apiFetch<unknown>('/auth/api/me')
    return usuarioSchema.parse(data)
  },

  /**
   * POST /auth/login cria a sessão (cookie) — não passa por apiFetch de
   * propósito: apiFetch injeta X-CSRF-Token em toda mutação buscando o
   * token em GET /auth/csrf-token, que exige sessão já autenticada
   * (@login_requerido). Antes do login não há sessão nem CSRF a buscar —
   * usar apiFetch aqui faria a busca do token falhar com 401 e disparar o
   * redirect de "sessão expirada" no meio da própria tentativa de logar.
   * A rota de login também não tem @csrf_protegido no backend, então não
   * exige o header.
   */
  async login(email: string, senha: string): Promise<LoginResponse> {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, senha }),
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      const message = (payload && typeof payload === 'object' && 'erro' in payload && String(payload.erro)) || 'Erro ao fazer login.'
      throw new ApiError(message, response.status, payload)
    }
    return loginResponseSchema.parse(payload)
  },

  /**
   * GET /auth/logout limpa a sessão e responde com um redirect de página
   * inteira (302), não JSON — navegação de browser, não apiFetch.
   */
  logout() {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/auth/logout')
  },
}
