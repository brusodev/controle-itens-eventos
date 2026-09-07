import { describe, expect, it } from 'vitest'
import { itensMenuVisiveis } from './menu-items'
import { getModuloConfig } from '@/features/modulos/config'
import type { Usuario } from '@/features/auth/schema'

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

describe('itensMenuVisiveis', () => {
  it('usuário comum não vê Usuários nem Auditoria', () => {
    const ids = itensMenuVisiveis(usuario(), 'coffee', getModuloConfig('coffee')).map((i) => i.id)
    expect(ids).not.toContain('usuarios')
    expect(ids).not.toContain('auditoria')
  })

  it('usuário admin vê Usuários e Auditoria', () => {
    const ids = itensMenuVisiveis(usuario({ perfil: 'admin' }), 'coffee', getModuloConfig('coffee')).map(
      (i) => i.id,
    )
    expect(ids).toContain('usuarios')
    expect(ids).toContain('auditoria')
  })

  it('Pedidos/Orçamentos só aparece no módulo servicos_graficos, mesmo para quem tem permissão', () => {
    const comPermissao = usuario({ modulosPermitidos: ['servicos_graficos'] })
    expect(itensMenuVisiveis(comPermissao, 'coffee', getModuloConfig('coffee')).map((i) => i.id)).not.toContain(
      'pedidos-graficos',
    )
    expect(
      itensMenuVisiveis(comPermissao, 'servicos_graficos', getModuloConfig('servicos_graficos')).map((i) => i.id),
    ).toContain('pedidos-graficos')
  })

  it('Pedidos/Orçamentos não aparece se o usuário comum não tem o módulo na lista de permitidos', () => {
    const semPermissao = usuario({ modulosPermitidos: ['coffee'] })
    const ids = itensMenuVisiveis(semPermissao, 'servicos_graficos', getModuloConfig('servicos_graficos')).map(
      (i) => i.id,
    )
    expect(ids).not.toContain('pedidos-graficos')
  })

  it('lista de módulos permitidos vazia = acesso a todos (inclusive servicos_graficos)', () => {
    const semRestricao = usuario({ modulosPermitidos: [] })
    const ids = itensMenuVisiveis(semRestricao, 'servicos_graficos', getModuloConfig('servicos_graficos')).map(
      (i) => i.id,
    )
    expect(ids).toContain('pedidos-graficos')
  })

  it('admin sempre vê Pedidos/Orçamentos no módulo certo, independente de modulosPermitidos', () => {
    const admin = usuario({ perfil: 'admin', modulosPermitidos: ['coffee'] })
    const ids = itensMenuVisiveis(admin, 'servicos_graficos', getModuloConfig('servicos_graficos')).map(
      (i) => i.id,
    )
    expect(ids).toContain('pedidos-graficos')
  })

  it('label do item Estoque muda conforme o módulo', () => {
    const itensCoffee = itensMenuVisiveis(usuario(), 'coffee', getModuloConfig('coffee'))
    const itensHospedagem = itensMenuVisiveis(usuario(), 'hospedagem', getModuloConfig('hospedagem'))
    const labelCoffee = itensCoffee.find((i) => i.id === 'estoque')?.label
    const labelHospedagem = itensHospedagem.find((i) => i.id === 'estoque')?.label
    expect(labelCoffee).not.toBe(labelHospedagem)
  })

  it('perfil empresa nunca vê Pedidos/Orçamentos mesmo no módulo certo', () => {
    const empresa = usuario({ perfil: 'empresa' })
    const ids = itensMenuVisiveis(empresa, 'servicos_graficos', getModuloConfig('servicos_graficos')).map(
      (i) => i.id,
    )
    expect(ids).not.toContain('pedidos-graficos')
  })
})
