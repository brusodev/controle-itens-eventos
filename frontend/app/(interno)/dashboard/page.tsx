'use client'

import { useRouter } from 'next/navigation'
import { useUsuarioAtual } from '@/features/auth/hooks/use-usuario-atual'
import { temAcessoModulo } from '@/features/auth/tem-acesso-modulo'
import { CardModulo } from '@/features/layout/components/card-modulo'
import { ORDEM_MODULOS_DASHBOARD } from '@/features/layout/dashboard-cards'
import { useModulo } from '@/features/modulos/modulo-context'
import type { Modulo } from '@/features/modulos/config'

/**
 * Seleção de módulo — porta de dashboard.html. selectModule() no legado
 * sempre navegava para /estoque; aqui vai para /os (decisão do plano —
 * mais fiel ao fluxo de trabalho real que a herança da aba padrão da SPA
 * antiga).
 */
export default function DashboardPage() {
  const router = useRouter()
  const { data: usuario } = useUsuarioAtual()
  const { setModulo } = useModulo()

  if (!usuario) return null

  const modulosVisiveis = ORDEM_MODULOS_DASHBOARD.filter(
    (m) => m !== 'servicos_graficos' || temAcessoModulo(usuario, 'servicos_graficos'),
  )

  function acessar(modulo: Modulo) {
    setModulo(modulo)
    router.push('/os')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-text">
          Olá, {usuario.nome.split(' ')[0]}! 👋
        </h1>
        <p className="text-text-muted">Selecione o módulo que deseja acessar</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modulosVisiveis.map((modulo) => (
          <CardModulo key={modulo} modulo={modulo} onAcessar={() => acessar(modulo)} />
        ))}
      </div>
    </div>
  )
}
