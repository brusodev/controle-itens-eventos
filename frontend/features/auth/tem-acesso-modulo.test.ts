import { describe, expect, it } from 'vitest'
import { temAcessoModulo } from './tem-acesso-modulo'
import type { Usuario } from './schema'

function usuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: 1,
    nome: 'Fulano',
    email: 'fulano@teste.com',
    cargo: null,
    perfil: 'comum',
    detentora_id: null,
    ativo: true,
    modulosPermitidos: [],
    ...overrides,
  }
}

describe('temAcessoModulo', () => {
  it('admin sempre tem acesso', () => {
    expect(temAcessoModulo(usuario({ perfil: 'admin', modulosPermitidos: ['coffee'] }), 'transporte')).toBe(true)
  })

  it('empresa nunca tem acesso a módulos internos', () => {
    expect(temAcessoModulo(usuario({ perfil: 'empresa', modulosPermitidos: [] }), 'coffee')).toBe(false)
  })

  it('comum com lista vazia tem acesso a todos os módulos', () => {
    expect(temAcessoModulo(usuario({ modulosPermitidos: [] }), 'servicos_graficos')).toBe(true)
  })

  it('comum com lista restrita só acessa o que está na lista', () => {
    const restrito = usuario({ modulosPermitidos: ['coffee', 'transporte'] })
    expect(temAcessoModulo(restrito, 'coffee')).toBe(true)
    expect(temAcessoModulo(restrito, 'servicos_graficos')).toBe(false)
  })
})
