'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useUsuarioAtual } from '@/features/auth/hooks/use-usuario-atual'
import { useModulo } from '@/features/modulos/modulo-context'
import { useListarDetentoras } from '../hooks/use-listar-detentoras'
import { useInativarDetentora } from '../hooks/use-inativar-detentora'
import type { Detentora } from '../schema'
import { CardDetentora } from './card-detentora'
import { ModalDetentora, type ModalDetentoraState } from './modal-detentora'

/**
 * Orquestrador da tela /detentoras — porta de renderizarDetentoras() em
 * gerenciar-detentoras.html. Ações de mutar (criar/editar/inativar) só
 * visíveis a admin — defesa em profundidade (backend hoje aceita de
 * qualquer autenticado; ver plano § Domínio 2).
 */
export function ListaDetentoras() {
  const { modulo } = useModulo()
  const { data: usuario } = useUsuarioAtual()
  const { data: detentoras, isLoading, isError } = useListarDetentoras(modulo)
  const inativar = useInativarDetentora()
  const [modal, setModal] = useState<ModalDetentoraState>(null)
  const [confirmandoInativacao, setConfirmandoInativacao] = useState<Detentora | null>(null)

  if (!usuario) return null

  const ehAdmin = usuario.perfil === 'admin'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">Empresas Detentoras</h1>
        {ehAdmin && (
          <Button size="sm" onClick={() => setModal({ mode: 'new' })}>
            Nova Detentora
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {isError && <EmptyState title="Erro ao carregar detentoras" />}

      {detentoras?.length === 0 && (
        <EmptyState
          title="Nenhuma detentora cadastrada"
          description='Clique em "Nova Detentora" para adicionar a primeira empresa.'
        />
      )}

      {detentoras && detentoras.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {detentoras.map((d) => (
            <CardDetentora
              key={d.id}
              detentora={d}
              ehAdmin={ehAdmin}
              onEditar={() => setModal({ mode: 'edit', data: d })}
              onInativar={() => setConfirmandoInativacao(d)}
            />
          ))}
        </div>
      )}

      <ModalDetentora state={modal} modulo={modulo} onClose={() => setModal(null)} />

      <ConfirmDialog
        open={confirmandoInativacao !== null}
        title="Inativar detentora?"
        description={
          confirmandoInativacao ? `"${confirmandoInativacao.nome}" será marcada como inativa.` : ''
        }
        confirmLabel="Inativar"
        danger
        onConfirm={() => {
          if (confirmandoInativacao) inativar.mutate(confirmandoInativacao.id)
          setConfirmandoInativacao(null)
        }}
        onCancel={() => setConfirmandoInativacao(null)}
      />
    </div>
  )
}
