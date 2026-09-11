import { describe, expect, it } from 'vitest'
import { formatarChave } from './formatar-chave'

describe('formatarChave', () => {
  it('traduz chaves conhecidas do dicionário', () => {
    expect(formatarChave('numero_os')).toBe('Nº O.S.')
    expect(formatarChave('regioes')).toBe('Estoques por Região')
    expect(formatarChave('gasto')).toBe('Quantidade Gasta')
  })

  /** O dicionário legado tinha 'preco' duas vezes, com o mesmo valor. */
  it('traduz preco uma única vez, sem ambiguidade', () => {
    expect(formatarChave('preco')).toBe('Preço')
  })

  it('humaniza snake_case desconhecido', () => {
    expect(formatarChave('campo_novo_qualquer')).toBe('Campo Novo Qualquer')
  })

  it('devolve a chave capitalizada quando não há underscore nem tradução', () => {
    expect(formatarChave('foobar')).toBe('Foobar')
  })
})
