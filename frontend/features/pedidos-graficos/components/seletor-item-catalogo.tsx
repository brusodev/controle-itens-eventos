'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { useModulo } from '@/features/modulos/modulo-context'
import { useDadosAlimentacao } from '@/features/estoque/hooks/use-dados-alimentacao'
import { formatarMoeda } from '@/lib/formatters'
import { parseNumeroBr } from '@/lib/numero-br'
import { achatarCatalogo, filtrarCatalogo, type ItemCatalogoFlat } from '../achatar-catalogo'

/**
 * Adicionar 1 item do catálogo ao pedido — porta de abrirSeletorItensPedido()
 * (pedidos-graficos.js:395-465). Deliberadamente separado do seletor de
 * emitir-os.js/formulário de O.S.: ali a seleção é múltipla e acoplada ao
 * estado de diárias/estoque; aqui é um item por vez, com quantidade livre.
 */
export function SeletorItemCatalogo({
  open,
  onClose,
  onAdicionar,
}: {
  open: boolean
  onClose: () => void
  onAdicionar: (item: ItemCatalogoFlat, quantidade: number) => void
}) {
  const { modulo } = useModulo()
  const { data: catalogo, isLoading } = useDadosAlimentacao(modulo)
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState<ItemCatalogoFlat | null>(null)
  const [quantidade, setQuantidade] = useState('1')

  const catalogoFlat = useMemo(() => (catalogo ? achatarCatalogo(catalogo) : []), [catalogo])
  const visiveis = useMemo(() => filtrarCatalogo(catalogoFlat, busca), [catalogoFlat, busca])

  function fechar() {
    setBusca('')
    setSelecionado(null)
    setQuantidade('1')
    onClose()
  }

  function confirmar() {
    const qtd = parseFloat(quantidade)
    if (!selecionado || !(qtd > 0)) return
    onAdicionar(selecionado, qtd)
    fechar()
  }

  return (
    <Modal open={open} onClose={fechar} title="Adicionar item">
      <div className="flex max-h-[70vh] flex-col gap-3">
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            autoFocus
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite para buscar (ex: adesivo, banner, A4)..."
            className="h-11 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-text-muted"
          />
        </div>
        <p className="text-xs text-text-muted">
          {busca ? `${visiveis.length} ${visiveis.length === 1 ? 'item encontrado' : 'itens encontrados'}` : `${catalogoFlat.length} itens no catálogo`}
        </p>

        <div className="min-h-[120px] flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : visiveis.length === 0 ? (
            <EmptyState title="Nenhum item encontrado" />
          ) : (
            <div className="flex flex-col gap-1">
              {visiveis.map((item) => {
                const marcado = selecionado?.itemId === item.itemId
                return (
                  <button
                    key={item.itemId}
                    type="button"
                    onClick={() => setSelecionado(item)}
                    className={
                      'rounded-md border px-3 py-2 text-left transition-colors ' +
                      (marcado ? 'border-info bg-info-subtle' : 'border-transparent hover:bg-surface-muted')
                    }
                  >
                    <p className="text-sm text-text">{item.descricao}</p>
                    <p className="text-xs text-text-muted">
                      {item.categoriaNome} · {formatarMoeda(parseNumeroBr(item.preco))}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Quantidade</label>
          <Input
            type="number"
            min="0.01"
            step="any"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                confirmar()
              }
            }}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={fechar}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={!selecionado || !(parseFloat(quantidade) > 0)}>
            Adicionar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
