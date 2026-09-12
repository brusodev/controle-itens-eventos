import { cn } from '@/lib/cn'

/**
 * Shimmer (gradiente que varre da direita pra esquerda) em vez de só
 * `animate-pulse` (opacidade): lê melhor como "carregando" do que como
 * "piscando". `bg-skeleton` é o token que substitui o `bg-neutral-200`
 * nativo do Tailwind que estava aqui — mesmo valor, agora nomeado.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-md bg-size-[200%_100%]',
        'bg-linear-to-r from-skeleton via-surface to-skeleton',
        className,
      )}
    />
  )
}
