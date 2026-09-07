import { describe, expect, it } from 'vitest'
import { gerarProximoCodigoItem, montarRegioesIniciais } from './gerar-codigo-item'
import type { ItemEstoque } from './schema'

function item(codigo: string): ItemEstoque {
  return { id: 1, categoria_id: 1, item: codigo, descricao: 'x', unidade: 'un', natureza: null }
}

describe('gerarProximoCodigoItem', () => {
  it('retorna 1 para categoria vazia', () => {
    expect(gerarProximoCodigoItem([])).toBe('1')
  })

  it('retorna o maior código + 1', () => {
    expect(gerarProximoCodigoItem([item('1'), item('2'), item('5')])).toBe('6')
  })

  it('ignora códigos não numéricos ao calcular o máximo', () => {
    expect(gerarProximoCodigoItem([item('1'), item('abc'), item('3')])).toBe('4')
  })
})

describe('montarRegioesIniciais', () => {
  it('replica a quantidade em todas as regiões, gasto zerado', () => {
    expect(montarRegioesIniciais('100', 3)).toEqual({
      '1': { inicial: '100', gasto: '0' },
      '2': { inicial: '100', gasto: '0' },
      '3': { inicial: '100', gasto: '0' },
    })
  })
})
