'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ResponsiveList } from '@/components/ui/responsive-list'
import { useModulo } from '@/features/modulos/modulo-context'
import { useCategorias } from '../hooks/use-categorias'
import { useExcluirCategoria } from '../hooks/use-excluir-categoria'
import type { Categoria } from '../schema'
import { CardCategoria } from './card-categoria'
import { ModalCategoria, type ModalCategoriaState } from './modal-categoria'

/**
 * Orquestrador da tela /categorias — porta de renderizarCategorias() em
 * categorias.js. Não replica a tabela desktop tradicional do legado: usa
 * ResponsiveList (cards em grid no desktop também), já que a listagem
 * original já era em cards, não em tabela.
 */
export function ListaCategorias() {
  const { modulo } = useModulo()
  const { data: categorias, isLoading, isError } = useCategorias(modulo)
  const excluir = useExcluirCategoria()
  const [modal, setModal] = useState<ModalCategoriaState>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<Categoria | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">Categorias</h1>
        <Button size="sm" onClick={() => setModal({ mode: 'new' })}>
          Nova Categoria
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {isError && <EmptyState title="Erro ao carregar categorias" />}

      {categorias?.length === 0 && (
        <EmptyState title="Nenhuma categoria encontrada" description="Crie a primeira categoria deste módulo." />
      )}

      {categorias && categorias.length > 0 && (
        <ResponsiveList
          table={<GradeCategorias categorias={categorias} onEditar={(c) => setModal({ mode: 'edit', data: c })} onExcluir={setConfirmandoExclusao} />}
          cards={categorias.map((cat) => (
            <CardCategoria
              key={cat.id}
              categoria={cat}
              onEditar={() => setModal({ mode: 'edit', data: cat })}
              onExcluir={() => setConfirmandoExclusao(cat)}
            />
          ))}
        />
      )}

      <ModalCategoria state={modal} onClose={() => setModal(null)} />

      <ConfirmDialog
        open={confirmandoExclusao !== null}
        title="Remover categoria?"
        description={
          confirmandoExclusao
            ? `Remover "${confirmandoExclusao.nome}" do banco de dados. Categorias com itens vinculados não podem ser removidas.`
            : ''
        }
        confirmLabel="Remover"
        danger
        onConfirm={() => {
          if (confirmandoExclusao) excluir.mutate(confirmandoExclusao.id)
          setConfirmandoExclusao(null)
        }}
        onCancel={() => setConfirmandoExclusao(null)}
      />
    </div>
  )
}

// Mesma listagem em cards também no desktop — a tela original já usava
// cards (grid), não uma tabela tradicional; ResponsiveList aqui só formaliza
// isso em vez de forçar uma <table> que não existia no legado.
function GradeCategorias({
  categorias,
  onEditar,
  onExcluir,
}: {
  categorias: Categoria[]
  onEditar: (c: Categoria) => void
  onExcluir: (c: Categoria) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {categorias.map((cat) => (
        <CardCategoria key={cat.id} categoria={cat} onEditar={() => onEditar(cat)} onExcluir={() => onExcluir(cat)} />
      ))}
    </div>
  )
}
