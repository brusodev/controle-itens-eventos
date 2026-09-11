import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TabelaPagamentos } from './tabela-pagamentos'
import type { RelatorioPagamentos } from '../schema'

function pagamento(overrides: Partial<RelatorioPagamentos['pagamentos'][number]> = {}) {
  return {
    id: 1,
    numeroOS: 'OS-001',
    empresa: 'Empresa Teste',
    modulo: 'coffee',
    regiao: 1,
    dataEmissao: '01/01/2026',
    vencimento: '15/01/2026',
    valorTotal: 1000,
    status: 'pendente' as const,
    ...overrides,
  }
}

describe('TabelaPagamentos', () => {
  /**
   * Regressão de XSS: o relatorios.js legado montava a linha da tabela com
   * innerHTML interpolando `empresa` sem escape (só a tabela de O.S. em
   * relatorios.js tinha escaparHtml() — as demais, incluindo pagamentos,
   * não). Um nome de empresa com script executaria ao abrir o relatório.
   */
  it('renderiza o nome da empresa como texto literal, nunca como HTML', () => {
    const payload = '<script>alert(1)</script>'
    render(<TabelaPagamentos pagamentos={[pagamento({ empresa: payload })]} />)

    expect(document.querySelector('script')).toBeNull()
    expect(screen.getAllByText(payload).length).toBeGreaterThan(0)
  })

  it('formata o valor em moeda BR', () => {
    render(<TabelaPagamentos pagamentos={[pagamento({ valorTotal: 1234.5 })]} />)
    expect(screen.getAllByText('R$ 1.234,50').length).toBeGreaterThan(0)
  })
})
