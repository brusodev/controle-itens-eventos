import { useState } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ResponsiveList } from '@/components/ui/responsive-list'
import type { ModuloConfig } from '@/features/modulos/config'
import type { ItemOS } from '../../schema'
import { LinhaItemOS } from './linha-item-os'
import { ItemCardMobile } from './item-card-mobile'
import { atualizarItemEmLista, duplicarItemTransporte, removerItemDaLista } from './use-itens-os'

export interface TabelaItensOSProps {
  itens: ItemOS[]
  config: ModuloConfig
  onChange: (itens: ItemOS[]) => void
}

/**
 * Cabeçalho e corpo variam por módulo (com diárias / com trajeto / simples)
 * — porta de renderizarTabelaItensOS em emitir-os.js:562-682. Desktop usa
 * <table>, mobile vira card por item (o caso mais citado no plano § UX).
 */
export function TabelaItensOS({ itens, config, onChange }: TabelaItensOSProps) {
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false)

  if (itens.length === 0) {
    return (
      <EmptyState
        title="Nenhum item adicionado"
        description='Clique em "Selecionar Itens" para começar.'
      />
    )
  }

  function atualizar(index: number, campo: keyof ItemOS, valor: unknown) {
    onChange(atualizarItemEmLista(itens, index, campo, valor))
  }

  function remover(index: number) {
    onChange(removerItemDaLista(itens, index))
  }

  function duplicar(index: number) {
    onChange(duplicarItemTransporte(itens, index))
  }

  const descLabel = config.descLabel === 'ESPECIFICAÇÃO' ? 'Especificação' : 'Descrição'

  return (
    <div className="flex flex-col gap-3">
      <ResponsiveList
        table={
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted">
                <th className="px-2 py-1.5">#</th>
                <th className="px-2 py-1.5">{descLabel}</th>
                <th className="px-2 py-1.5">Categoria</th>
                {config.usaDiarias && <th className="px-2 py-1.5">Diárias</th>}
                <th className="px-2 py-1.5">{config.colunaQtdCompacta}</th>
                {config.usaTrajeto ? (
                  <>
                    <th className="px-2 py-1.5">Origem</th>
                    <th className="px-2 py-1.5">Destino</th>
                    <th className="px-2 py-1.5">Ida/Volta</th>
                    <th className="px-2 py-1.5" title="Duplicar / remover" />
                  </>
                ) : (
                  <>
                    <th className="px-2 py-1.5">Total</th>
                    <th className="px-2 py-1.5" />
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {itens.map((item, index) => (
                <LinhaItemOS
                  key={index}
                  item={item}
                  index={index}
                  config={config}
                  onAtualizar={(campo, valor) => atualizar(index, campo, valor)}
                  onRemover={() => remover(index)}
                  onDuplicar={config.usaTrajeto ? () => duplicar(index) : undefined}
                />
              ))}
            </tbody>
          </table>
        }
        cards={itens.map((item, index) => (
          <ItemCardMobile
            key={index}
            item={item}
            index={index}
            config={config}
            onAtualizar={(campo, valor) => atualizar(index, campo, valor)}
            onRemover={() => remover(index)}
            onDuplicar={config.usaTrajeto ? () => duplicar(index) : undefined}
          />
        ))}
      />

      <Button
        variant="danger"
        size="sm"
        className="self-start"
        onClick={() => setConfirmandoLimpeza(true)}
      >
        Limpar todos
      </Button>

      <ConfirmDialog
        open={confirmandoLimpeza}
        title="Remover todos os itens?"
        description={`${itens.length} item(ns) serão removidos da O.S.`}
        confirmLabel="Remover todos"
        danger
        onConfirm={() => {
          onChange([])
          setConfirmandoLimpeza(false)
        }}
        onCancel={() => setConfirmandoLimpeza(false)}
      />
    </div>
  )
}
