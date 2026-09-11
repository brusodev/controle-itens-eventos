import { describe, expect, it } from 'vitest'
import { normalizarDadosAuditoria } from './normalizar-dados'

describe('normalizarDadosAuditoria', () => {
  /**
   * dados_antes/dados_depois chegam ora como string JSON, ora como objeto
   * já parseado, dependendo de quem gravou o registro (auditoria.html:738).
   */
  it('aceita objeto já parseado', () => {
    expect(normalizarDadosAuditoria({ nome: 'Item' })).toEqual({ nome: 'Item' })
  })

  it('aceita string JSON', () => {
    expect(normalizarDadosAuditoria('{"nome":"Item"}')).toEqual({ nome: 'Item' })
  })

  it('devolve null para JSON inválido em vez de lançar', () => {
    expect(normalizarDadosAuditoria('{isso não é json')).toBeNull()
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['string vazia', ''],
    ['objeto vazio', {}],
    ['array', [1, 2]],
    ['número', 42],
  ])('devolve null para %s', (_rotulo, valor) => {
    expect(normalizarDadosAuditoria(valor)).toBeNull()
  })
})
