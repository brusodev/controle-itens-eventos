import { describe, expect, it } from 'vitest'
import { mesclarPedidosParaOS } from './mesclar-para-os'
import type { PedidoGrafico } from './schema'

function pedido(overrides: Partial<PedidoGrafico> = {}): PedidoGrafico {
  return {
    id: 1,
    dataPedido: '2026-09-01',
    solicitante: 'Fulano',
    descricao: 'Banners para o evento',
    setorSolicitante: 'Coordenadoria X',
    prazoEntrega: '2026-09-20',
    status: 'pendente',
    statusLabel: 'Pendente',
    entregue: false,
    dataEntregaEfetiva: null,
    ordemServicoId: null,
    numeroOS: null,
    observacoes: null,
    usuarioCriadorId: 1,
    criadoEm: null,
    atualizadoEm: null,
    motivoCancelamento: null,
    valorTotal: 100,
    itens: [],
    ...overrides,
  }
}

describe('mesclarPedidosParaOS', () => {
  it('soma quantidades do mesmo item (mesma categoria+itemId) numa linha só', () => {
    const resultado = mesclarPedidosParaOS([
      pedido({ id: 1, itens: [{ itemId: 10, categoria: 'banners', descricao: 'Banner A3', unidade: 'un', quantidade: 5, valorUnit: '10,00' }] }),
      pedido({ id: 2, itens: [{ itemId: 10, categoria: 'banners', descricao: 'Banner A3', unidade: 'un', quantidade: 3, valorUnit: '10,00' }] }),
    ])

    expect(resultado.itens).toHaveLength(1)
    expect(resultado.itens[0].qtdTotal).toBe(8)
    expect(resultado.itens[0].qtdSolicitada).toBe(8)
  })

  it('mantém itens diferentes em linhas separadas', () => {
    const resultado = mesclarPedidosParaOS([
      pedido({
        id: 1,
        itens: [
          { itemId: 10, categoria: 'banners', descricao: 'Banner A3', unidade: 'un', quantidade: 5, valorUnit: '10,00' },
          { itemId: 20, categoria: 'adesivos', descricao: 'Adesivo redondo', unidade: 'un', quantidade: 2, valorUnit: '5,00' },
        ],
      }),
    ])

    expect(resultado.itens).toHaveLength(2)
  })

  it('junta setores únicos com " / ", sem repetir', () => {
    const resultado = mesclarPedidosParaOS([
      pedido({ id: 1, setorSolicitante: 'Setor A' }),
      pedido({ id: 2, setorSolicitante: 'Setor A' }),
      pedido({ id: 3, setorSolicitante: 'Setor B' }),
    ])
    expect(resultado.setorSolicitante).toBe('Setor A / Setor B')
  })

  it('justificativa concatena solicitante + descrição de cada pedido', () => {
    const resultado = mesclarPedidosParaOS([
      pedido({ id: 1, solicitante: 'Ana', descricao: '500 blocos' }),
      pedido({ id: 2, solicitante: 'Beto', descricao: '10 banners' }),
    ])
    expect(resultado.justificativa).toBe('Ana: 500 blocos\nBeto: 10 banners')
  })

  it('observações só inclui pedidos que de fato têm observação', () => {
    const resultado = mesclarPedidosParaOS([
      pedido({ id: 1, solicitante: 'Ana', observacoes: 'Urgente' }),
      pedido({ id: 2, solicitante: 'Beto', observacoes: null }),
    ])
    expect(resultado.observacoes).toBe('Ana: Urgente')
  })

  /** Prazo da O.S. = o mais curto, para que todos os pedidos sejam atendidos. */
  it('prazoEntrega é a menor data entre os pedidos', () => {
    const resultado = mesclarPedidosParaOS([
      pedido({ id: 1, prazoEntrega: '2026-09-25' }),
      pedido({ id: 2, prazoEntrega: '2026-09-18' }),
    ])
    expect(resultado.prazoEntrega).toBe('2026-09-18')
  })

  it('dataPedido é a menor data entre os pedidos', () => {
    const resultado = mesclarPedidosParaOS([
      pedido({ id: 1, dataPedido: '2026-09-10' }),
      pedido({ id: 2, dataPedido: '2026-09-01' }),
    ])
    expect(resultado.dataPedido).toBe('2026-09-01')
  })

  it('pedido sem itens não quebra a mesclagem', () => {
    const resultado = mesclarPedidosParaOS([pedido({ id: 1, itens: [] })])
    expect(resultado.itens).toEqual([])
  })
})
