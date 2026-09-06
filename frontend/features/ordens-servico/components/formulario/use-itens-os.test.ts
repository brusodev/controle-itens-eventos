import { describe, expect, it } from 'vitest'
import { atualizarItemEmLista, duplicarItemTransporte, removerItemDaLista } from './use-itens-os'
import type { ItemOS } from '../../schema'

function item(overrides: Partial<ItemOS> = {}): ItemOS {
  return {
    categoria: 'coffee_break_bebidas_quentes',
    itemId: 1,
    descricao: 'Item teste',
    unidade: 'un',
    diarias: 1,
    qtdSolicitada: 10,
    qtdTotal: 10,
    ...overrides,
  }
}

describe('atualizarItemEmLista', () => {
  it('recalcula qtdTotal ao mudar diárias', () => {
    const itens = atualizarItemEmLista([item({ diarias: 1, qtdSolicitada: 10 })], 0, 'diarias', 3)
    expect(itens[0].qtdTotal).toBe(30)
  })

  it('recalcula qtdTotal ao mudar quantidade', () => {
    const itens = atualizarItemEmLista([item({ diarias: 2, qtdSolicitada: 5 })], 0, 'qtdSolicitada', 20)
    expect(itens[0].qtdTotal).toBe(40)
  })

  it('não muda outros itens da lista (imutável)', () => {
    const original = [item({ descricao: 'A' }), item({ descricao: 'B' })]
    const atualizado = atualizarItemEmLista(original, 0, 'qtdSolicitada', 99)
    expect(atualizado[1]).toBe(original[1]) // mesma referência — não recriado
    expect(atualizado).not.toBe(original) // array novo
  })
})

describe('removerItemDaLista', () => {
  it('remove só o índice pedido', () => {
    const itens = [item({ descricao: 'A' }), item({ descricao: 'B' }), item({ descricao: 'C' })]
    const resultado = removerItemDaLista(itens, 1)
    expect(resultado.map((i) => i.descricao)).toEqual(['A', 'C'])
  })
})

describe('duplicarItemTransporte', () => {
  it('insere logo após o original', () => {
    const itens = [item({ descricao: 'A' }), item({ descricao: 'B' })]
    const resultado = duplicarItemTransporte(itens, 0)
    expect(resultado).toHaveLength(3)
    expect(resultado[0].descricao).toBe('A')
    expect(resultado[2].descricao).toBe('B')
  })

  it('inverte origem/destino e ida/volta como sugestão', () => {
    const original = item({ trajetoOrigem: 'São Paulo', trajetoDestino: 'Campinas', trajetoTipo: 'ida' })
    const [, duplicado] = duplicarItemTransporte([original], 0)
    expect(duplicado.trajetoOrigem).toBe('Campinas')
    expect(duplicado.trajetoDestino).toBe('São Paulo')
    expect(duplicado.trajetoTipo).toBe('volta')
  })

  it('mantém tipo vazio quando o original não tinha ida/volta definido', () => {
    const original = item({ trajetoTipo: null })
    const [, duplicado] = duplicarItemTransporte([original], 0)
    expect(duplicado.trajetoTipo).toBeNull()
  })
})
