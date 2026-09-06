import type { ItemOS } from '../../schema'

/**
 * Manipulação imutável do array de itens da O.S. — porta de
 * atualizarItemTabela/removerItemOS/duplicarItemTransporte
 * (emitir-os.js:682-740), sem mutação direta de array nem DOM.
 */
export function atualizarItemEmLista(
  itens: ItemOS[],
  index: number,
  campo: keyof ItemOS,
  valor: unknown,
): ItemOS[] {
  return itens.map((item, i) => {
    if (i !== index) return item
    const atualizado = { ...item, [campo]: valor }
    const diarias = atualizado.diarias || 1
    const qtd = atualizado.qtdSolicitada || 0
    return { ...atualizado, qtdTotal: diarias * qtd }
  })
}

export function removerItemDaLista(itens: ItemOS[], index: number): ItemOS[] {
  return itens.filter((_, i) => i !== index)
}

/** Insere logo abaixo do original, com origem/destino e ida/volta invertidos como sugestão. */
export function duplicarItemTransporte(itens: ItemOS[], index: number): ItemOS[] {
  const original = itens[index]
  if (!original) return itens

  const novoTipo = original.trajetoTipo === 'ida' ? 'volta' : original.trajetoTipo === 'volta' ? 'ida' : null

  const novaLinha: ItemOS = {
    ...original,
    trajetoOrigem: original.trajetoDestino || '',
    trajetoDestino: original.trajetoOrigem || '',
    trajetoTipo: novoTipo,
  }

  return [...itens.slice(0, index + 1), novaLinha, ...itens.slice(index + 1)]
}
