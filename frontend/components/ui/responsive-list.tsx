import { cn } from '@/lib/cn'

/**
 * Alterna table (desktop) / card por item (mobile) via CSS puro (`hidden`/
 * `md:hidden`), sem duplicar a busca de dados. Resolve o caso mais citado no
 * plano (§ UX item 3): a tabela de itens da O.S. que hoje estoura a tela.
 *
 * Uso: <ResponsiveList table={<table>...</table>} cards={items.map(...)} />
 */
export function ResponsiveList({
  table,
  cards,
  className,
}: {
  table: React.ReactNode
  cards: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <div className="hidden overflow-x-auto md:block">{table}</div>
      <div className="flex flex-col gap-3 md:hidden">{cards}</div>
    </div>
  )
}

export function CardListItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-md border border-border-subtle bg-surface p-4 shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}
