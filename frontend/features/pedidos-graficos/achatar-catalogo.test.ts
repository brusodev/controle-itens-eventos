import { describe, expect, it } from 'vitest'
import { achatarCatalogo, filtrarCatalogo } from './achatar-catalogo'
import type { DadosAlimentacao } from '@/features/estoque/schema'

const CATALOGO: DadosAlimentacao = {
  banners: {
    natureza: null,
    categoria_db_id: 1,
    itens: [
      { id: 1, categoria_id: 1, item: 'BAN01', descricao: 'Impressão de Banner A3', unidade: 'un', natureza: null, regioes: { '1': { inicial: '0', gasto: '0', preco: '25,00' } } },
    ],
  },
  adesivos: {
    natureza: null,
    categoria_db_id: 2,
    itens: [
      { id: 2, categoria_id: 2, item: 'ADE01', descricao: 'Adesivo redondo', unidade: 'un', natureza: null, regioes: { '1': { inicial: '0', gasto: '0', preco: '3,50' } } },
    ],
  },
}

describe('achatarCatalogo', () => {
  it('achata todas as categorias num array só, com preço da região 1', () => {
    const flat = achatarCatalogo(CATALOGO)
    expect(flat).toHaveLength(2)
    expect(flat.find((i) => i.itemId === 1)?.preco).toBe('25,00')
  })

  it('usa "0" quando o item não tem preço na região 1', () => {
    const semPreco: DadosAlimentacao = {
      x: { natureza: null, categoria_db_id: 1, itens: [{ id: 9, categoria_id: 1, item: 'X', descricao: 'Item sem região', unidade: 'un', natureza: null }] },
    }
    expect(achatarCatalogo(semPreco)[0].preco).toBe('0')
  })
})

describe('filtrarCatalogo', () => {
  const flat = achatarCatalogo(CATALOGO)

  it('sem termo, devolve tudo', () => {
    expect(filtrarCatalogo(flat, '')).toHaveLength(2)
  })

  /** Regressão: a busca precisa ignorar acentos ("impressao" acha "Impressão"). */
  it('ignora acentos na busca', () => {
    const resultado = filtrarCatalogo(flat, 'impressao')
    expect(resultado).toHaveLength(1)
    expect(resultado[0].descricao).toBe('Impressão de Banner A3')
  })

  it('cada palavra digitada precisa aparecer, fora de ordem', () => {
    expect(filtrarCatalogo(flat, 'a3 banner')).toHaveLength(1)
    expect(filtrarCatalogo(flat, 'redondo adesivo')).toHaveLength(1)
  })

  it('termo sem correspondência devolve vazio', () => {
    expect(filtrarCatalogo(flat, 'inexistente')).toHaveLength(0)
  })
})
