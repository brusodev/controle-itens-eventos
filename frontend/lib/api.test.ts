import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from './api'
import { ApiError } from './api-error'
import { clearCsrfToken } from './csrf'

const assign = vi.fn()

/**
 * Mock de fetch que atende o GET /auth/csrf-token (toda mutação passa por
 * ele) e responde o status pedido para qualquer outra rota.
 */
function responderCom(status: number, body: unknown) {
  return vi.fn(async (url: string) => {
    if (String(url).includes('/auth/csrf-token')) {
      return { status: 200, ok: true, json: async () => ({ csrf_token: 'token-de-teste' }) } as Response
    }
    return { status, ok: status >= 200 && status < 300, json: async () => body } as Response
  })
}

beforeEach(() => {
  clearCsrfToken()
  assign.mockClear()
  vi.stubGlobal('location', { origin: 'http://localhost', assign })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiFetch — tratamento de 401', () => {
  it('redireciona para /login quando a sessão expira', async () => {
    vi.stubGlobal('fetch', responderCom(401, { erro: 'Não autenticado' }))

    await expect(apiFetch('/api/qualquer')).rejects.toBeInstanceOf(ApiError)
    expect(assign).toHaveBeenCalledWith('/login')
  })

  /**
   * Regressão: POST /auth/api/alterar-senha responde 401 em "Senha atual
   * incorreta" (auth_routes.py:466) — não em sessão expirada. Sem
   * `permitir401`, digitar a senha atual errada deslogava o usuário em vez
   * de mostrar a mensagem de erro no formulário.
   */
  it('com permitir401, propaga o erro sem deslogar o usuário', async () => {
    vi.stubGlobal('fetch', responderCom(401, { erro: 'Senha atual incorreta' }))

    const erro = await apiFetch('/auth/api/alterar-senha', {
      method: 'POST',
      body: { senha_atual: 'errada', senha_nova: 'NovaSenha123!' },
      permitir401: true,
    }).catch((e: unknown) => e)

    expect(assign).not.toHaveBeenCalled()
    expect(erro).toBeInstanceOf(ApiError)
    expect((erro as ApiError).message).toBe('Senha atual incorreta')
    expect((erro as ApiError).status).toBe(401)
  })
})
