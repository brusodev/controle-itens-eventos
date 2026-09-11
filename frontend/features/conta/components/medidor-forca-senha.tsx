import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { avaliarForcaSenha, type NivelForca } from '../forca-senha'

const CLASSE_BARRA: Record<NivelForca, string> = {
  fraca: 'w-1/3 bg-danger',
  media: 'w-2/3 bg-warning',
  forte: 'w-full bg-success',
}

const CLASSE_TEXTO: Record<NivelForca, string> = {
  fraca: 'text-danger',
  media: 'text-warning',
  forte: 'text-success',
}

/** Barra de força + checklist de requisitos — porta de .strength-meter e .password-requirements (alterar-senha.html). */
export function MedidorForcaSenha({ senha }: { senha: string }) {
  const { requisitos, nivel, label } = avaliarForcaSenha(senha)

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="h-1 overflow-hidden rounded-full bg-border-subtle">
          <div className={cn('h-full transition-all', senha ? CLASSE_BARRA[nivel] : 'w-0')} />
        </div>
        {senha && <p className={cn('mt-1 text-xs font-medium', CLASSE_TEXTO[nivel])}>{label}</p>}
      </div>

      <ul className="flex flex-col gap-1">
        {requisitos.map((requisito) => (
          <li
            key={requisito.id}
            className={cn('flex items-center gap-2 text-xs', requisito.atendido ? 'text-success' : 'text-text-muted')}
          >
            {requisito.atendido ? (
              <Check aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.5} />
            ) : (
              <Circle aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2} />
            )}
            {requisito.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
