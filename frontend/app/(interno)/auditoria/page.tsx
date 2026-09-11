'use client'

import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useUsuarioAtual } from '@/features/auth/hooks/use-usuario-atual'
import { PainelAuditoria } from '@/features/auditoria/components/painel-auditoria'

/**
 * Porta de auditoria.html. Todas as rotas do backend já são
 * @admin_requerido; o guard aqui evita a tela montar e disparar 3 requests
 * que voltariam 403 para um usuário comum que digitou a URL.
 */
export default function AuditoriaPage() {
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
        <EmptyState
          title="Acesso restrito"
          description="Somente administradores podem consultar os registros de auditoria."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-text sm:text-2xl">Auditoria</h1>
        <p className="text-sm text-text-muted">Histórico de ações realizadas no sistema.</p>
      </header>

      <PainelAuditoria />
    </div>
  )
}
