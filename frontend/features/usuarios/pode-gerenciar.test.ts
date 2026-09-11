import { describe, expect, it } from 'vitest'
import { podeAlterarStatus, podeEditar, podeExcluir } from './pode-gerenciar'
import type { Usuario } from '@/features/auth/schema'
import type { UsuarioAdmin } from './schema'

function usuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: 1,
    nome: 'Fulano',
    email: 'fulano@teste.com',
    cargo: null,
    perfil: 'comum',
    detentora_id: null,
    ativo: true,
    modulosPermitidos: [],
    ...overrides,
  }
}

function alvo(overrides: Partial<UsuarioAdmin> = {}): UsuarioAdmin {
  return {
    id: 2,
    nome: 'Ciclano',
    email: 'ciclano@teste.com',
    cargo: null,
    perfil: 'comum',
    detentora_id: null,
    ativo: true,
    modulosPermitidos: [],
    criado_em: null,
    atualizado_em: null,
    ...overrides,
  }
}

describe('pode-gerenciar', () => {
  describe('podeAlterarStatus / podeExcluir', () => {
    it('admin pode agir sobre outro usuário', () => {
      const admin = usuario({ id: 1, perfil: 'admin' })
      expect(podeAlterarStatus(admin, alvo({ id: 2 }))).toBe(true)
      expect(podeExcluir(admin, alvo({ id: 2 }))).toBe(true)
    })

    /**
     * Regressão do achado do legado: o botão Ativar/Desativar/Deletar
     * aparecia mesmo sobre a própria linha do admin logado — só o backend
     * barrava (400) o DELETE, depois de o clique já ter ocorrido.
     */
    it('admin NÃO pode agir sobre a própria conta', () => {
      const admin = usuario({ id: 1, perfil: 'admin' })
      expect(podeAlterarStatus(admin, alvo({ id: 1 }))).toBe(false)
      expect(podeExcluir(admin, alvo({ id: 1 }))).toBe(false)
    })

    it('usuário comum não pode agir sobre ninguém', () => {
      const comum = usuario({ id: 1, perfil: 'comum' })
      expect(podeAlterarStatus(comum, alvo({ id: 2 }))).toBe(false)
      expect(podeExcluir(comum, alvo({ id: 2 }))).toBe(false)
    })
  })

  describe('podeEditar', () => {
    it('admin edita qualquer um', () => {
      const admin = usuario({ id: 1, perfil: 'admin' })
      expect(podeEditar(admin, alvo({ id: 2 }))).toBe(true)
    })

    it('usuário comum edita só a si mesmo', () => {
      const comum = usuario({ id: 1, perfil: 'comum' })
      expect(podeEditar(comum, alvo({ id: 1 }))).toBe(true)
      expect(podeEditar(comum, alvo({ id: 2 }))).toBe(false)
    })
  })
})
