import { describe, expect, it } from 'vitest'
import { camposPorModulo } from './campos-por-modulo'

describe('camposPorModulo', () => {
  it('qtd. pessoas atendidas só aparece em organização', () => {
    expect(camposPorModulo('organizacao').mostrarQtdPessoas).toBe(true)
    for (const modulo of ['coffee', 'transporte', 'hospedagem', 'trofeus', 'servicos_graficos'] as const) {
      expect(camposPorModulo(modulo).mostrarQtdPessoas).toBe(false)
    }
  })

  it('setor solicitante é obrigatório em transporte e serviços gráficos', () => {
    expect(camposPorModulo('transporte').setorSolicitanteObrigatorio).toBe(true)
    expect(camposPorModulo('servicos_graficos').setorSolicitanteObrigatorio).toBe(true)
    expect(camposPorModulo('coffee').setorSolicitanteObrigatorio).toBe(false)
  })

  it('campos de evento deixam de ser obrigatórios só em serviços gráficos', () => {
    expect(camposPorModulo('servicos_graficos').camposEventoObrigatorios).toBe(false)
    for (const modulo of ['coffee', 'organizacao', 'hospedagem', 'transporte', 'trofeus'] as const) {
      expect(camposPorModulo(modulo).camposEventoObrigatorios).toBe(true)
    }
  })

  it('data de pedido/entrega só aparece em serviços gráficos', () => {
    expect(camposPorModulo('servicos_graficos').mostrarDataPedidoEntrega).toBe(true)
    expect(camposPorModulo('coffee').mostrarDataPedidoEntrega).toBe(false)
  })
})
