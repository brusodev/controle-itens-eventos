'use client'

import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useUsuarioAtual } from '@/features/auth/hooks/use-usuario-atual'
import { CardAlterarSenha } from '@/features/conta/components/card-alterar-senha'
import { FormularioPerfil } from '@/features/conta/components/formulario-perfil'

/** Porta de gerenciar-conta.html — ver § Domínio 4 do plano para o que não foi portado. */
export default function ContaPage() {
  const { data: usuario, isLoading } = useUsuarioAtual()

  if (isLoading || !usuario) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-xl font-bold text-text sm:text-2xl">Minha Conta</h1>
        <p className="text-sm text-text-muted">Gerencie suas informações pessoais e a segurança da conta.</p>
      </header>

      <Card as="section" padding="lg">
        <h2 className="mb-4 text-base font-semibold text-text">Dados pessoais</h2>
        <FormularioPerfil usuario={usuario} />
      </Card>

      <CardAlterarSenha />
    </div>
  )
}
