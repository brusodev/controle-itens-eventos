'use client'

import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useUsuarioAtual } from '@/features/auth/hooks/use-usuario-atual'
import { temAcessoModulo } from '@/features/auth/tem-acesso-modulo'
import { PainelPedidos } from '@/features/pedidos-graficos/components/painel-pedidos'

/**
 * Porta da aba Pedidos/Orçamentos (index.html + pedidos-graficos.js).
 * Backend já exige @modulo_permitido_requerido('servicos_graficos'); o
 * guard aqui evita a tela montar e disparar requests que voltariam 403
 * para quem não tem acesso ao módulo.
 */
export default function PedidosGraficosPage() {
  const { data: usuario, isLoading } = useUsuarioAtual()

  if (isLoading || !usuario) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  if (!temAcessoModulo(usuario, 'servicos_graficos')) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState title="Acesso restrito" description="Você não tem acesso ao módulo Serviços Gráficos." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-text sm:text-2xl">Pedidos/Orçamentos</h1>
      </header>

      <PainelPedidos />
    </div>
  )
}
