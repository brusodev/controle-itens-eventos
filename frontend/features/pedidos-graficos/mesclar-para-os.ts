import type { ItemOS } from '@/features/ordens-servico/schema'
import type { PedidoGrafico } from './schema'

/** Menor data ISO (YYYY-MM-DD ordena lexicograficamente) entre valores não nulos. */
function menorData(valores: (string | null | undefined)[]): string {
  const validas = valores.filter((v): v is string => Boolean(v)).sort()
  return validas.length > 0 ? validas[0] : ''
}

export interface DadosMesclados {
  setorSolicitante: string
  dataPedido: string
  prazoEntrega: string
  justificativa: string
  observacoes: string
  itens: ItemOS[]
}

/**
 * Consolida N pedidos nos campos de uma única O.S. — porta fiel de
 * _mesclarPedidosParaOS() (emitir-os.js:1518-1567).
 *
 * Itens do mesmo catálogo são SOMADOS numa linha só: além de gerar uma O.S.
 * mais limpa, evita que a baixa de estoque no backend valide duas linhas do
 * mesmo item isoladamente contra o mesmo saldo (comentário original do
 * legado, motivo não é só estético).
 */
export function mesclarPedidosParaOS(pedidos: PedidoGrafico[]): DadosMesclados {
  const setores = [...new Set(pedidos.map((p) => (p.setorSolicitante ?? '').trim()).filter(Boolean))]

  const justificativa = pedidos.map((p) => `${p.solicitante}: ${p.descricao}`).join('\n')

  const observacoes = pedidos
    .filter((p) => (p.observacoes ?? '').trim())
    .map((p) => `${p.solicitante}: ${(p.observacoes ?? '').trim()}`)
    .join('\n')

  const porItem = new Map<string, ItemOS>()
  for (const pedido of pedidos) {
    for (const item of pedido.itens ?? []) {
      const chave = `${item.categoria}:${item.itemId}`
      const existente = porItem.get(chave)
      const qtd = Number(item.quantidade) || 0
      if (existente) {
        const nova = (existente.qtdSolicitada ?? 0) + qtd
        existente.qtdSolicitada = nova
        existente.qtdTotal = nova
      } else {
        porItem.set(chave, {
          categoria: item.categoria ?? '',
          itemId: item.itemId,
          itemCodigo: null,
          itemBec: null,
          descricao: item.descricao ?? '',
          unidade: item.unidade,
          diarias: 1,
          qtdSolicitada: qtd,
          qtdTotal: qtd,
          valorUnit: null,
          trajetoOrigem: null,
          trajetoDestino: null,
          trajetoTipo: null,
        })
      }
    }
  }

  return {
    setorSolicitante: setores.join(' / '),
    dataPedido: menorData(pedidos.map((p) => p.dataPedido)),
    // Prazo da O.S. = o mais curto, para que todos os pedidos sejam atendidos.
    prazoEntrega: menorData(pedidos.map((p) => p.prazoEntrega)),
    justificativa,
    observacoes,
    itens: [...porItem.values()],
  }
}
