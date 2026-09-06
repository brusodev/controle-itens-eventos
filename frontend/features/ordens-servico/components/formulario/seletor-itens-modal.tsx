'use client'

import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useDadosAlimentacao } from '@/features/estoque/hooks/use-dados-alimentacao'
import type { Modulo } from '@/features/modulos/config'
import type { ItemOS } from '../../schema'
import { CategoriaAccordion } from './categoria-accordion'
import { useSeletorItens } from './use-seletor-itens'

export interface SeletorItensModalProps {
  open: boolean
  onClose: () => void
  modulo: Modulo
  grupo: string
  itensAtuais: ItemOS[]
  onConfirmar: (itens: ItemOS[]) => void
}

/**
 * Seletor de itens da O.S. — porta de abrirSeletorItens/confirmarSelecaoItens
 * em emitir-os.js:321-551. Estado local (via useSeletorItens), sem
 * manipulação de DOM; a lista final some/aparece na tabela de itens só ao
 * confirmar.
 */
export function SeletorItensModal({
  open,
  onClose,
  modulo,
  grupo,
  itensAtuais,
  onConfirmar,
}: SeletorItensModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Selecionar Itens" className="sm:max-w-2xl">
      {open && (
        <ConteudoSeletor
          modulo={modulo}
          grupo={grupo}
          itensAtuais={itensAtuais}
          onConfirmar={onConfirmar}
          onClose={onClose}
        />
      )}
    </Modal>
  )
}

function ConteudoSeletor({
  modulo,
  grupo,
  itensAtuais,
  onConfirmar,
  onClose,
}: Omit<SeletorItensModalProps, 'open'>) {
  const { data: dadosAlimentacao, isLoading, isError } = useDadosAlimentacao(modulo)
  const seletor = useSeletorItens(modulo, itensAtuais)

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    )
  }

  if (isError || !dadosAlimentacao) {
    return <EmptyState title="Erro ao carregar itens disponíveis" />
  }

  function confirmar() {
    onConfirmar(seletor.montarItensSelecionados(dadosAlimentacao!))
    onClose()
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Buscar item..."
        value={seletor.busca}
        onChange={(e) => seletor.setBusca(e.target.value)}
        aria-label="Buscar item"
      />

      <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
        {seletor.categoriasFiltradas(dadosAlimentacao).map(({ nome, categoria, itensVisiveis }) => (
          <CategoriaAccordion
            key={nome}
            nomeCategoria={nome}
            itensVisiveis={itensVisiveis}
            totalItens={categoria.itens.length}
            grupo={grupo}
            config={seletor.config}
            selecoes={seletor.selecaoDaCategoria(nome)}
            onChangeItem={(itemId, selecao) => seletor.atualizarItem(nome, itemId, selecao)}
            forcarAberta={seletor.buscaNormalizada !== '' && itensVisiveis.length > 0}
          />
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border-subtle pt-3">
        <span className="text-sm text-text-muted">{seletor.totalMarcados} item(ns) selecionado(s)</span>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={seletor.totalMarcados === 0}>
            Confirmar seleção
          </Button>
        </div>
      </div>
    </div>
  )
}
