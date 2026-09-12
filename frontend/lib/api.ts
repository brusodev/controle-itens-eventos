import { ApiError } from './api-error'
import { clearCsrfToken, getCsrfToken } from './csrf'

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Corpo já serializável — o wrapper cuida do JSON.stringify e do Content-Type. */
  body?: unknown
  /** Módulo ativo a anexar como `?modulo=`. Omitir em rotas que não são por módulo. */
  modulo?: string
  /**
   * Trata 401 como erro comum, sem redirecionar para /login.
   *
   * Só para rotas em que 401 NÃO significa "sessão expirada". Hoje há uma:
   * POST /auth/api/alterar-senha responde 401 em "Senha atual incorreta"
   * (auth_routes.py:466) — com o tratamento padrão, errar a senha atual
   * desloga o usuário em vez de mostrar a mensagem.
   */
  permitir401?: boolean
}

function montarUrl(endpoint: string, modulo?: string): string {
  const url = new URL(endpoint, window.location.origin)
  if (modulo && !url.searchParams.has('modulo')) {
    url.searchParams.set('modulo', modulo)
  }
  return url.pathname + url.search
}

/**
 * Wrapper de fetch — porta tipada de backend/static/js/api-client.js.
 *
 * Diferenças deliberadas em relação ao original (ver plano § Fase 0):
 *  - `credentials: 'include'` sempre, para o cookie de sessão atravessar
 *    same-origin (dev, via proxy) e cross-site (prod, Vercel + VPS).
 *  - CSRF injetado em TODA mutação, sem exceção — o api-client.js antigo só
 *    buscava o token para O.S. e pedidos gráficos; itens/categorias/detentoras
 *    mutavam sem X-CSRF-Token.
 *  - Módulo ativo entra como parâmetro explícito (`options.modulo`), nunca
 *    lido de dentro daqui — quem chama vem de `useModulo()`.
 *  - 401 redireciona para login, como antes — salvo com `permitir401`, para
 *    a rota que usa 401 com outro significado (ver a opção).
 */
export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, modulo, headers, method = 'GET', permitir401 = false, ...rest } = options
  const url = montarUrl(endpoint, modulo)

  const finalHeaders = new Headers(headers)
  if (body !== undefined) {
    finalHeaders.set('Content-Type', 'application/json')
  }

  if (MUTATING_METHODS.has(method.toUpperCase())) {
    finalHeaders.set('X-CSRF-Token', await getCsrfToken())
  }

  const response = await fetch(url, {
    ...rest,
    method,
    headers: finalHeaders,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401 && !permitir401) {
    clearCsrfToken()
    // /login é a página de login migrada para o Next (app/login/page.tsx) —
    // troca a rota Flask /auth/login como destino do redirect de sessão
    // expirada. Navegação de página inteira, não router.push(), porque isto
    // roda fora de componente React (não há acesso ao router aqui).
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/login')
    // A navegação acima é assíncrona; nunca há um "sucesso" depois de um 401.
    throw new ApiError('Sessão inválida ou expirada.', 401, null)
  }

  if (response.status === 403) {
    // Token CSRF pode ter ficado obsoleto (ex.: sessão renovada) — descarta
    // o cache para a próxima mutação buscar um novo.
    clearCsrfToken()
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message =
      (payload && typeof payload === 'object' && 'erro' in payload && String(payload.erro)) ||
      'Erro na requisição.'
    throw new ApiError(message, response.status, payload)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
