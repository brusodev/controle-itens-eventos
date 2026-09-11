'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api-error'
import type { Usuario } from '@/features/auth/schema'
import { useUsuarios } from '../hooks/use-usuarios'
import { useAlternarAtivo } from '../hooks/use-alternar-ativo'
import { useExcluirUsuario } from '../hooks/use-excluir-usuario'
import type { UsuarioAdmin } from '../schema'
import { ListaUsuarios } from './lista-usuarios'
import { ModalUsuario, type ModalUsuarioState } from './modal-usuario'

/** Orquestra busca + lista + modal + confirmação de exclusão. A página só monta este componente. */
export function PainelUsuarios({ usuarioLogado }: { usuarioLogado: Usuario }) {
  const { data: usuarios, isLoading, isError } = useUsuarios()
  const [filtro, setFiltro] = useState('')
  const [modal, setModal] = useState<ModalUsuarioState>(null)
  const [excluindo, setExcluindo] = useState<UsuarioAdmin | null>(null)

  const alternarAtivo = useAlternarAtivo(usuarioLogado.id)
  const excluir = useExcluirUsuario()
  const { showToast } = useToast()

  function handleAlternarAtivo(usuario: UsuarioAdmin) {
    alternarAtivo.mutate(
      { id: usuario.id, ativo: !usuario.ativo },
      {
        onSuccess: () => {
          showToast(`Usuário ${usuario.ativo ? 'desativado' : 'ativado'} com sucesso!`)
        },
        onError: (error) => {
          showToast(error instanceof ApiError ? error.message : 'Erro ao atualizar status.', 'error')
        },
      },
    )
  }

  function confirmarExclusao() {
    if (!excluindo) return
    excluir.mutate(excluindo.id, {
      onSuccess: () => {
        showToast('Usuário deletado com sucesso!')
        setExcluindo(null)
      },
      onError: (error) => {
        showToast(error instanceof ApiError ? error.message : 'Erro ao deletar usuário.', 'error')
        setExcluindo(null)
      },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar usuário por nome ou email..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-text-muted"
          />
        </div>
        <Button onClick={() => setModal({ mode: 'new' })} className="shrink-0">
          <Plus aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Novo Usuário
        </Button>
      </div>

      {isError ? (
        <EmptyState title="Erro ao carregar usuários" description="Tente novamente em alguns instantes." />
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <ListaUsuarios
          usuarios={usuarios ?? []}
          filtro={filtro}
          usuarioLogado={usuarioLogado}
          onEditar={(usuario) => setModal({ mode: 'edit', data: usuario })}
          onAlternarAtivo={handleAlternarAtivo}
          onExcluir={setExcluindo}
        />
      )}

      <ModalUsuario state={modal} usuarioLogado={usuarioLogado} onClose={() => setModal(null)} />

      <ConfirmDialog
        open={excluindo !== null}
        title="Deletar usuário?"
        description={
          excluindo
            ? `${excluindo.nome} (${excluindo.email}) será removido permanentemente. Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Deletar"
        danger
        onConfirm={confirmarExclusao}
        onCancel={() => setExcluindo(null)}
      />
    </div>
  )
}
