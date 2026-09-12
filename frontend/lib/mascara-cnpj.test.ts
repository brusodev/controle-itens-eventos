import { describe, expect, it } from 'vitest'
import { mascararCnpj } from './mascara-cnpj'

describe('mascararCnpj', () => {
  it('formata 14 dígitos completos', () => {
    expect(mascararCnpj('08472572000185')).toBe('08.472.572/0001-85')
  })

  it('formata progressivamente enquanto o usuário digita', () => {
    expect(mascararCnpj('08')).toBe('08')
    expect(mascararCnpj('084')).toBe('08.4')
    expect(mascararCnpj('08472572')).toBe('08.472.572')
    expect(mascararCnpj('084725720001')).toBe('08.472.572/0001')
  })

  it('ignora caracteres não numéricos já digitados', () => {
    expect(mascararCnpj('08.472.572/0001-85')).toBe('08.472.572/0001-85')
  })

  it('trunca dígitos além de 14', () => {
    expect(mascararCnpj('08472572000185999')).toBe('08.472.572/0001-85')
  })
})
