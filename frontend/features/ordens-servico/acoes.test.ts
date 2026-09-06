import { describe, expect, it } from 'vitest'
import { acoesVisiveis } from './acoes'
import { STATUS_OS, type StatusOS } from './schema'

// Tabela de paridade do plano (§ Paridade — "Lista de O.S.: 9 ações com
// regras de visibilidade"), extraída de ordens-servico.js:110-118.
describe('acoesVisiveis', () => {
  it('visualizar, imprimir, pdf e png estão sempre presentes', () => {
    for (const status of STATUS_OS) {
      for (const perfil of ['admin', 'comum', 'empresa'] as const) {
        const acoes = acoesVisiveis({ perfil, status })
        expect(acoes.has('visualizar')).toBe(true)
        expect(acoes.has('imprimir')).toBe(true)
        expect(acoes.has('pdf')).toBe(true)
        expect(acoes.has('png')).toBe(true)
      }
    }
  })

  it('editar só aparece com status emitida', () => {
    expect(acoesVisiveis({ perfil: 'admin', status: 'emitida' }).has('editar')).toBe(true)
    for (const status of STATUS_OS.filter((s) => s !== 'emitida')) {
      expect(acoesVisiveis({ perfil: 'admin', status }).has('editar')).toBe(false)
    }
  })

  it('excluir exige admin E status emitida', () => {
    expect(acoesVisiveis({ perfil: 'admin', status: 'emitida' }).has('excluir')).toBe(true)
    expect(acoesVisiveis({ perfil: 'comum', status: 'emitida' }).has('excluir')).toBe(false)
    expect(acoesVisiveis({ perfil: 'admin', status: 'aceita' }).has('excluir')).toBe(false)
  })

  it('atividade do portal exige admin E status diferente de emitida', () => {
    expect(acoesVisiveis({ perfil: 'admin', status: 'aceita' }).has('atividadePortal')).toBe(true)
    expect(acoesVisiveis({ perfil: 'admin', status: 'emitida' }).has('atividadePortal')).toBe(
      false,
    )
    expect(acoesVisiveis({ perfil: 'comum', status: 'aceita' }).has('atividadePortal')).toBe(
      false,
    )
  })

  it('pagamento aparece para admin/comum, exceto cancelada e recusada', () => {
    const statusComPagamento: StatusOS[] = STATUS_OS.filter(
      (s) => s !== 'cancelada' && s !== 'recusada',
    )
    for (const status of statusComPagamento) {
      expect(acoesVisiveis({ perfil: 'admin', status }).has('pagamento')).toBe(true)
      expect(acoesVisiveis({ perfil: 'comum', status }).has('pagamento')).toBe(true)
    }
    expect(acoesVisiveis({ perfil: 'admin', status: 'cancelada' }).has('pagamento')).toBe(false)
    expect(acoesVisiveis({ perfil: 'admin', status: 'recusada' }).has('pagamento')).toBe(false)
    expect(acoesVisiveis({ perfil: 'empresa', status: 'aceita' }).has('pagamento')).toBe(false)
  })

  it('cancelar exige admin E status em {aceita, em_execucao}', () => {
    expect(acoesVisiveis({ perfil: 'admin', status: 'aceita' }).has('cancelar')).toBe(true)
    expect(acoesVisiveis({ perfil: 'admin', status: 'em_execucao' }).has('cancelar')).toBe(true)
    expect(acoesVisiveis({ perfil: 'admin', status: 'emitida' }).has('cancelar')).toBe(false)
    expect(acoesVisiveis({ perfil: 'comum', status: 'aceita' }).has('cancelar')).toBe(false)
  })

  it('perfil empresa nunca vê editar, excluir, atividadePortal ou cancelar', () => {
    for (const status of STATUS_OS) {
      const acoes = acoesVisiveis({ perfil: 'empresa', status })
      expect(acoes.has('excluir')).toBe(false)
      expect(acoes.has('atividadePortal')).toBe(false)
      expect(acoes.has('cancelar')).toBe(false)
    }
  })
})
