import { describe, expect, it } from 'vitest'
import { calcularDisponivel, calcularTotaisEstoque, excedeEstoque } from './disponibilidade'
import type { ItemEstoque } from './schema'

function item(regioes: ItemEstoque['regioes']): ItemEstoque {
  return { id: 1, categoria_id: 1, item: '1', descricao: 'Item', unidade: 'un', natureza: null, regioes }
}

describe('calcularDisponivel', () => {
  it('subtrai gasto do inicial, em formato BR (vírgula decimal, ponto de milhar)', () => {
    const disponivel = calcularDisponivel(item({ '1': { inicial: '1.000,00', gasto: '250,50', preco: '0' } }), '1')
    expect(disponivel).toBeCloseTo(749.5)
  })

  it('retorna null quando o grupo não tem registro de estoque para o item', () => {
    expect(calcularDisponivel(item({ '2': { inicial: '10', gasto: '0', preco: '0' } }), '1')).toBeNull()
  })
})

describe('excedeEstoque', () => {
  it('excede quando quantidade × diárias ultrapassa o disponível', () => {
    expect(excedeEstoque({ disponivel: 100, quantidade: 51, diarias: 2 })).toBe(true)
  })

  it('não excede na borda exata', () => {
    expect(excedeEstoque({ disponivel: 100, quantidade: 50, diarias: 2 })).toBe(false)
  })

  it('nunca excede quando disponível é null (sem controle de estoque)', () => {
    expect(excedeEstoque({ disponivel: null, quantidade: 999999, diarias: 1 })).toBe(false)
  })
})

describe('calcularTotaisEstoque', () => {
  it('soma inicial e gasto de todas as regiões', () => {
    const totais = calcularTotaisEstoque(
      item({
        '1': { inicial: '1.000', gasto: '100', preco: '0' },
        '2': { inicial: '500', gasto: '50', preco: '0' },
      }),
    )
    expect(totais).toEqual({ inicial: 1500, gasto: 150, disponivel: 1350 })
  })

  it('retorna zeros quando o item não tem nenhuma região', () => {
    expect(calcularTotaisEstoque(item(undefined))).toEqual({ inicial: 0, gasto: 0, disponivel: 0 })
  })
})
