'use client'

import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useUsuarioAtual } from '@/features/auth/hooks/use-usuario-atual'
import { PainelUsuarios } from '@/features/usuarios/components/painel-usuarios'

/** Porta de gerenciar-usuarios.html — todas as mutações do backend já são @admin_requerido ou checam perfil. */
export default function UsuariosPage() {
  const { data: usuario, isLoading } = useUsuarioAtual()

  if (isLoading || !usuario) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  if (usuario.perfil !== 'admin') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState title="Acesso restrito" description="Somente administradores podem gerenciar usuários." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-text sm:text-2xl">Gerenciamento de Usuários</h1>
      </header>

      <PainelUsuarios usuarioLogado={usuario} />
    </div>
  )
}
