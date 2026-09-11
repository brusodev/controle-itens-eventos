import { describe, expect, it } from 'vitest'
import { validarSenhaUsuario } from './validar-senha-usuario'

describe('validarSenhaUsuario', () => {
  it('exige senha ao criar', () => {
    expect(validarSenhaUsuario('', false)).toMatch(/obrigatória/i)
  })

  it('aceita vazio ao editar (mantém a senha atual)', () => {
    expect(validarSenhaUsuario('', true)).toBeNull()
  })

  /** Mesma unificação em 12 caracteres do Domínio 4 — o legado validava 6 aqui. */
  it('rejeita senha preenchida abaixo de 12 caracteres, criando ou editando', () => {
    expect(validarSenhaUsuario('Abc123!x', false)).toMatch(/12/)
    expect(validarSenhaUsuario('Abc123!x', true)).toMatch(/12/)
  })

  it('aceita senha válida em ambos os modos', () => {
    expect(validarSenhaUsuario('SenhaSegura123!', false)).toBeNull()
    expect(validarSenhaUsuario('SenhaSegura123!', true)).toBeNull()
  })
})
