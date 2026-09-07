import { describe, expect, it } from 'vitest'
import { normalizarSlug } from './schema'

// Porta de atualizarSlugCategoria (categorias.js:121-134).
describe('normalizarSlug', () => {
  it('normaliza para minúsculas e troca espaço por underscore', () => {
    expect(normalizarSlug('Veículos Leves')).toBe('veiculos_leves')
  })

  it('remove acentos', () => {
    expect(normalizarSlug('Água Mineral')).toBe('agua_mineral')
  })

  it('troca caracteres não alfanuméricos por underscore e colapsa repetições', () => {
    expect(normalizarSlug('Café & Água!!')).toBe('cafe_agua')
  })

  it('remove underscores das bordas', () => {
    expect(normalizarSlug('  Estrutura e Espaço  ')).toBe('estrutura_e_espaco')
  })

  it('mantém números', () => {
    expect(normalizarSlug('Categoria 2026')).toBe('categoria_2026')
  })
})
