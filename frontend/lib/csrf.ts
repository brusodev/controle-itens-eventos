/**
 * Token CSRF por sessão, obtido de GET /auth/csrf-token e reenviado no
 * header X-CSRF-Token em toda mutação (POST/PUT/DELETE) — ver
 * backend/routes/auth_routes.py:69 (csrf_protegido).
 *
 * Diferença deliberada em relação ao api-client.js antigo: lá só O.S. e
 * pedidos gráficos buscavam o token: itens, categorias e detentoras mutavam
 * sem CSRF. Aqui o wrapper de API injeta o header em TODA mutação, sem
 * exceção (ver plano § Fase 0 — "CSRF uniforme no client novo").
 */

let csrfTokenCache: string | null = null
let csrfTokenPromise: Promise<string> | null = null

async function fetchCsrfToken(): Promise<string> {
  const response = await fetch('/auth/csrf-token', { credentials: 'include' })
  if (!response.ok) {
    throw new Error('Não foi possível obter o token CSRF — sessão pode ter expirado.')
  }
  const data = (await response.json()) as { csrf_token: string }
  return data.csrf_token
}

/** Retorna o token em cache, ou busca (e cacheia) se ainda não houver um. */
export async function getCsrfToken(): Promise<string> {
  if (csrfTokenCache) return csrfTokenCache

  // Evita disparar múltiplas requisições concorrentes na primeira mutação.
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetchCsrfToken().then((token) => {
      csrfTokenCache = token
      return token
    })
  }
  return csrfTokenPromise
}

/** Limpa o cache — chamar no logout, ou se o backend rejeitar o token (403). */
export function clearCsrfToken() {
  csrfTokenCache = null
  csrfTokenPromise = null
}
