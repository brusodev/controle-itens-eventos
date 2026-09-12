import { describe, expect, it } from 'vitest'
import { classificarUrgencia } from './urgencia'
import type { StatusPedido } from './schema'

const HOJE = new Date(2026, 8, 15) // 15/09/2026

function pedido(overrides: { status?: StatusPedido; entregue?: boolean; prazoEntrega?: string | null }) {
  return {
    status: 'pendente' as StatusPedido,
    entregue: false,
    prazoEntrega: null,
    ...overrides,
  }
}

describe('classificarUrgencia', () => {
  it('cancelado vence qualquer prazo, mesmo já vencido', () => {
    expect(classificarUrgencia(pedido({ status: 'cancelado', prazoEntrega: '2026-01-01' }), HOJE)).toBe('cancelado')
  })

  it('entregue vence qualquer prazo, mesmo já vencido', () => {
    expect(classificarUrgencia(pedido({ entregue: true, prazoEntrega: '2026-01-01' }), HOJE)).toBe('concluido')
  })

  it('sem prazo definido, e nem cancelado nem entregue', () => {
    expect(classificarUrgencia(pedido({}), HOJE)).toBe('sem_prazo')
  })

  it('prazo no passado é atrasado', () => {
    expect(classificarUrgencia(pedido({ prazoEntrega: '2026-09-10' }), HOJE)).toBe('atrasado')
  })

  it('prazo dentro de 3 dias é vencendo', () => {
    expect(classificarUrgencia(pedido({ prazoEntrega: '2026-09-18' }), HOJE)).toBe('vencendo')
  })

  it('prazo hoje é vencendo (0 dias)', () => {
    expect(classificarUrgencia(pedido({ prazoEntrega: '2026-09-15' }), HOJE)).toBe('vencendo')
  })

  it('prazo além de 3 dias está ok', () => {
    expect(classificarUrgencia(pedido({ prazoEntrega: '2026-09-19' }), HOJE)).toBe('ok')
  })
})
