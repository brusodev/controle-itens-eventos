import { describe, expect, it } from 'vitest'
import { avaliarForcaSenha } from './forca-senha'
import { MIN_SENHA, senhaFormSchema } from './schema'

describe('avaliarForcaSenha', () => {
  it('senha vazia não atende requisito algum e é fraca', () => {
    const { atendidos, nivel } = avaliarForcaSenha('')
    expect(atendidos).toBe(0)
    expect(nivel).toBe('fraca')
  })

  it('marca o requisito de comprimento pelo mínimo real do backend, não por 8', () => {
    const oitoChars = 'Abc123!x'
    const requisito = avaliarForcaSenha(oitoChars).requisitos.find((r) => r.id === 'length')

    expect(oitoChars).toHaveLength(8)
    expect(requisito?.atendido).toBe(false)
    expect(avaliarForcaSenha('Abc123!xyzwv').requisitos.find((r) => r.id === 'length')?.atendido).toBe(true)
  })

  it('classifica como forte quando 4 ou mais requisitos são atendidos', () => {
    expect(avaliarForcaSenha('SenhaSegura1!').nivel).toBe('forte')
  })

  it('classifica como média entre 2 e 3 requisitos', () => {
    expect(avaliarForcaSenha('senhaminuscula').nivel).toBe('media')
  })
})

describe('senhaFormSchema', () => {
  const base = { senhaAtual: 'AtualSegura1!', senhaNova: 'NovaSegura123!', senhaConfirma: 'NovaSegura123!' }

  it('aceita um formulário válido', () => {
    expect(senhaFormSchema.safeParse(base).success).toBe(true)
  })

  /**
   * Regressão: a tela legada validava 8 caracteres no client e só descobria
   * o mínimo real (12) no 400 do backend, depois de enviar a senha.
   */
  it(`rejeita senha com menos de ${MIN_SENHA} caracteres antes de chegar ao backend`, () => {
    const resultado = senhaFormSchema.safeParse({
      senhaAtual: 'AtualSegura1!',
      senhaNova: 'Abc123!x',
      senhaConfirma: 'Abc123!x',
    })
    expect(resultado.success).toBe(false)
  })

  it('rejeita quando a confirmação não coincide', () => {
    const resultado = senhaFormSchema.safeParse({ ...base, senhaConfirma: 'OutraSenha123!' })
    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues[0].path).toEqual(['senhaConfirma'])
  })

  it('rejeita quando a nova senha é igual à atual', () => {
    const resultado = senhaFormSchema.safeParse({
      senhaAtual: 'MesmaSenha123!',
      senhaNova: 'MesmaSenha123!',
      senhaConfirma: 'MesmaSenha123!',
    })
    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues[0].path).toEqual(['senhaNova'])
  })
})
