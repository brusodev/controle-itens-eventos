'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatarMoeda } from '@/lib/formatters'
import { parseNumeroBr } from '@/lib/numero-br'
import type { ItemCatalogoFlat } from '../achatar-catalogo'
import type { PedidoForm } from '../schema'
import { SeletorItemCatalogo } from './seletor-item-catalogo'

type ItemForm = PedidoForm['itens'][number]

/**
 * Lista de itens dentro do modal de pedido, com o total estimado — porta de
 * renderizarItensPedidoModal() (pedidos-graficos.js:335-367). O pedido pode
 * ser salvo sem itens (mesma regra do legado — "detalhado depois").
 */
export function ItensPedidoForm({ itens, onChange }: { itens: ItemForm[]; onChange: (itens: ItemForm[]) => void }) {
  const [seletorAberto, setSeletorAberto] = useState(false)

  const total = itens.reduce((soma, item) => soma + parseNumeroBr(item.valorUnit) * item.quantidade, 0)

  function adicionar(item: ItemCatalogoFlat, quantidade: number) {
    onChange([
      ...itens,
      {
        itemId: item.itemId,
        categoria: item.categoria,
        descricao: item.descricao,
        unidade: item.unidade,
        quantidade,
        valorUnit: item.preco,
      },
    ])
  }

  function atualizarQuantidade(indice: number, quantidade: number) {
    onChange(itens.map((item, i) => (i === indice ? { ...item, quantidade } : item)))
  }

  function remover(indice: number) {
    onChange(itens.filter((_, i) => i !== indice))
  }

  return (
    <div className="border-t border-border-subtle pt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-text">Itens do catálogo (estimativa de custo)</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => setSeletorAberto(true)}>
          <Plus aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Adicionar item
        </Button>
      </div>

      {itens.length === 0 ? (
        <p className="text-sm text-text-muted">Nenhum item adicionado ainda. O pedido pode ser salvo sem itens e detalhado depois.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-text-muted">
              <th className="pb-1 font-normal">Descrição</th>
              <th className="w-20 pb-1 font-normal">Qtd.</th>
              <th className="w-24 pb-1 font-normal">Valor unit.</th>
              <th className="w-8 pb-1" />
            </tr>
          </thead>
          <tbody>
            {itens.map((item, indice) => (
              <tr key={indice} className="border-t border-border-subtle">
                <td className="py-1.5 text-text">{item.descricao}</td>
                <td className="py-1.5">
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={item.quantidade}
                    onChange={(e) => atualizarQuantidade(indice, parseFloat(e.target.value) || 0)}
                    className="h-8 w-16 rounded-md border border-border bg-surface px-2 text-sm text-text"
                  />
                </td>
                <td className="py-1.5 text-text-muted">{formatarMoeda(parseNumeroBr(item.valorUnit))}</td>
                <td className="py-1.5">
                  <button type="button" onClick={() => remover(indice)} aria-label="Remover item" className="text-danger-strong">
                    <X className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="mt-2 text-right font-semibold text-indigo">Total estimado: {formatarMoeda(total)}</p>

      <SeletorItemCatalogo open={seletorAberto} onClose={() => setSeletorAberto(false)} onAdicionar={adicionar} />
    </div>
  )
}
