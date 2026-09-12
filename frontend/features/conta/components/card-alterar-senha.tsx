import Link from 'next/link'
import { KeyRound } from 'lucide-react'
import { classesBotao } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * Card que leva à troca de senha — o único dos 6 cards de gerenciar-conta.html
 * que sobrevive além do perfil (os outros 4 eram alert('em desenvolvimento')).
 *
 * Usa <Link> com classesBotao() em vez de <Button>: precisa ser âncora de
 * verdade (prefetch do Next, abrir em nova aba), mas sem recopiar as classes.
 */
export function CardAlterarSenha() {
  return (
    <Card as="section" padding="lg" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-text">Senha</h2>
        <p className="text-sm text-text-muted">Mantenha sua conta segura trocando a senha periodicamente.</p>
      </div>
      <Link href="/conta/senha" className={classesBotao({ variant: 'secondary', className: 'shrink-0' })}>
        <KeyRound aria-hidden="true" className="size-4" strokeWidth={1.75} />
        Alterar senha
      </Link>
    </Card>
  )
}
