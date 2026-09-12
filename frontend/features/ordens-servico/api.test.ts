import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { osAPI } from './api'

/**
 * Mock de fetch: atende /auth/csrf-token (toda mutação passa por ele, mesmo
 * que `listar` não mute nada — apiFetch busca o token uma vez por sessão) e
 * responde o corpo pedido para GET /api/ordens-servico/.
 */
function responderComLista(body: unknown) {
  return vi.fn(async (url: string) => {
    if (String(url).includes('/auth/csrf-token')) {
      return { status: 200, ok: true, json: async () => ({ csrf_token: 'token-de-teste' }) } as Response
    }
    return { status: 200, ok: true, json: async () => body } as Response
  })
}

/** O.S. válida mínima — só os campos que `osPersistidaSchema` exige. */
function osValida(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    numeroOS: 'OS-001',
    status: 'emitida',
    modulo: 'servicos_graficos',
    signatarios: [],
    itens: [{ categoria: 'x', itemId: 1, descricao: 'item', diarias: 1, qtdTotal: 1 }],
    ...overrides,
  }
}

beforeEach(() => {
  vi.stubGlobal('location', { origin: 'http://localhost' })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('osAPI.listar — resiliência a registros inválidos', () => {
  /**
   * Regressão do bug que zerava a listagem do módulo Serviços Gráficos: uma
   * O.S. sem `evento` não pode derrubar a lista inteira. Antes, `.map(parse)`
   * lançava na primeira linha inválida e a tela mostrava "erro ao carregar"
   * mesmo com o backend respondendo 200 e as demais O.S. sendo válidas.
   */
  it('descarta só a O.S. inválida e retorna as demais', async () => {
    vi.stubGlobal(
      'fetch',
      responderComLista([
        osValida({ id: 1, evento: '' }), // gráficos: evento vazio é esperado
        osValida({ id: 2, evento: 'Formatura 2026' }),
      ]),
    )

    const resultado = await osAPI.listar('servicos_graficos')

    expect(resultado).toHaveLength(2)
    expect(resultado.map((os) => os.id)).toEqual([1, 2])
  })

  it('descarta registros que violam o schema por outro motivo (ex. sem itens)', async () => {
    vi.stubGlobal(
      'fetch',
      responderComLista([{ ...osValida({ id: 1 }), itens: [] }, osValida({ id: 2 })]),
    )

    const resultado = await osAPI.listar('coffee')

    expect(resultado).toHaveLength(1)
    expect(resultado[0].id).toBe(2)
  })

  it('lista vazia quando todos os registros são inválidos, sem lançar', async () => {
    vi.stubGlobal('fetch', responderComLista([{ modulo: 'coffee' }]))

    await expect(osAPI.listar('coffee')).resolves.toEqual([])
  })
})
