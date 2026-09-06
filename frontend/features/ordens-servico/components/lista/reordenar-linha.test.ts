import { describe, expect, it } from 'vitest'
import { moverPosicao } from './reordenar-linha'

describe('moverPosicao', () => {
  it('move um item para cima', () => {
    expect(moverPosicao(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
  })

  it('move um item para baixo', () => {
    expect(moverPosicao(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
  })

  it('não faz nada se o destino está fora dos limites', () => {
    const lista = ['a', 'b', 'c']
    expect(moverPosicao(lista, 0, -1)).toBe(lista)
    expect(moverPosicao(lista, 2, 3)).toBe(lista)
  })

  it('não muta o array original', () => {
    const lista = ['a', 'b', 'c']
    moverPosicao(lista, 0, 1)
    expect(lista).toEqual(['a', 'b', 'c'])
  })
})
