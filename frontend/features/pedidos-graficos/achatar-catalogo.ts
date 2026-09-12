import type { DadosAlimentacao } from '@/features/estoque/schema'

export interface ItemCatalogoFlat {
  itemId: number
  categoria: string
  categoriaNome: string
  descricao: string
  unidade: string
  preco: string
  busca: string
}

const DIACRITICOS = /[\u0300-\u036f]/g

/** Remove acentos para a busca — "impressao" precisa achar "Impressão...". */
function normalizarBusca(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(DIACRITICOS, '')
}

/**
 * Achata o catálogo por categoria num array indexado — porta de
 * abrirSeletorItensPedido() (pedidos-graficos.js:401-419). O preço vem da
 * região única do módulo (regiao_numero=1, mesma leitura do backend em
 * _resolver_valor_unitario).
 */
export function achatarCatalogo(dados: DadosAlimentacao): ItemCatalogoFlat[] {
  const flat: ItemCatalogoFlat[] = []
  for (const [categoria, dadosCategoria] of Object.entries(dados)) {
    for (const item of dadosCategoria.itens) {
      const preco = item.regioes?.['1']?.preco ?? '0'
      flat.push({
        itemId: item.id,
        categoria,
        categoriaNome: categoria,
        descricao: item.descricao,
        unidade: item.unidade,
        preco,
        busca: normalizarBusca(`${item.descricao} ${categoria}`),
      })
    }
  }
  return flat
}

/** Cada palavra digitada precisa aparecer — permite buscar "adesivo a4" fora de ordem. */
export function filtrarCatalogo(itens: ItemCatalogoFlat[], termo: string): ItemCatalogoFlat[] {
  const termos = normalizarBusca(termo).trim().split(/\s+/).filter(Boolean)
  if (termos.length === 0) return itens
  return itens.filter((item) => termos.every((t) => item.busca.includes(t)))
}
