import { useMemo, useState } from 'react'
import type { DadosAlimentacao } from '@/features/estoque/schema'
import { getModuloConfig, type Modulo } from '@/features/modulos/config'
import type { ItemOS } from '../../schema'
import type { SelecaoItem } from './item-selecionavel'

const chave = (categoria: string, itemId: number) => `${categoria}:${itemId}`

function selecoesIniciais(itensAtuais: ItemOS[]): Map<string, SelecaoItem> {
  const inicial = new Map<string, SelecaoItem>()
  for (const item of itensAtuais) {
    inicial.set(chave(item.categoria, Number(item.itemId)), {
      marcado: true,
      diarias: item.diarias,
      qtd: item.qtdSolicitada ?? 0,
    })
  }
  return inicial
}

/**
 * Estado do seletor de itens (marcação, diárias, quantidade por item) e a
 * montagem do payload final — extraído de SeletorItensModal para manter o
 * componente só com JSX de composição (limite de linhas do plano).
 */
export function useSeletorItens(modulo: Modulo, itensAtuais: ItemOS[]) {
  const config = getModuloConfig(modulo)
  const [busca, setBusca] = useState('')
  const [selecoes, setSelecoes] = useState(() => selecoesIniciais(itensAtuais))

  const buscaNormalizada = busca.trim().toLowerCase()

  function categoriasFiltradas(dadosAlimentacao: DadosAlimentacao) {
    return Object.entries(dadosAlimentacao)
      .map(([nome, categoria]) => ({
        nome,
        categoria,
        itensVisiveis: buscaNormalizada
          ? categoria.itens.filter((item) => item.descricao.toLowerCase().includes(buscaNormalizada))
          : categoria.itens,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  }

  function selecaoDaCategoria(nomeCategoria: string) {
    const mapa = new Map<number, SelecaoItem>()
    selecoes.forEach((valor, key) => {
      const [cat, id] = key.split(':')
      if (cat === nomeCategoria) mapa.set(Number(id), valor)
    })
    return mapa
  }

  function atualizarItem(nomeCategoria: string, itemId: number, selecao: SelecaoItem) {
    setSelecoes((atual) => new Map(atual).set(chave(nomeCategoria, itemId), selecao))
  }

  const totalMarcados = useMemo(
    () => Array.from(selecoes.values()).filter((s) => s.marcado && s.qtd > 0).length,
    [selecoes],
  )

  function montarItensSelecionados(dadosAlimentacao: DadosAlimentacao): ItemOS[] {
    const itens: ItemOS[] = []
    selecoes.forEach((selecao, key) => {
      if (!selecao.marcado || selecao.qtd <= 0) return
      const [categoria, itemIdStr] = key.split(':')
      const itemId = Number(itemIdStr)
      const categoriaData = dadosAlimentacao[categoria]
      const item = categoriaData?.itens.find((i) => i.id === itemId)
      if (!item) return

      const diarias = config.usaDiarias ? selecao.diarias : 1
      itens.push({
        categoria,
        itemId,
        descricao: item.descricao,
        unidade: item.unidade,
        itemBec:
          modulo === 'servicos_graficos'
            ? item.natureza || ''
            : item.natureza || categoriaData.natureza || '',
        diarias,
        qtdSolicitada: selecao.qtd,
        qtdTotal: diarias * selecao.qtd,
      })
    })
    return itens
  }

  return {
    config,
    busca,
    setBusca,
    buscaNormalizada,
    categoriasFiltradas,
    selecaoDaCategoria,
    atualizarItem,
    totalMarcados,
    montarItensSelecionados,
  }
}
