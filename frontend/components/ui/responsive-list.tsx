import { cn } from '@/lib/cn'
import { Card } from './card'

/**
 * Alterna table (desktop) / card por item (mobile) via CSS puro (`hidden`/
 * `md:hidden`), sem duplicar a busca de dados. Resolve o caso mais citado no
 * plano (§ UX item 3): a tabela de itens da O.S. que hoje estoura a tela.
 *
 * `modo` (opcional) deixa o USUÁRIO escolher, sobrepondo o breakpoint: 'lista'
 * é o comportamento padrão explícito (tabela a partir de md:, cards abaixo —
 * produz o mesmo markup que omitir a prop) e 'grid' força os cards em
 * qualquer largura. Abaixo de md: a tabela nunca é usada, mesmo em 'lista' —
 * é o caso que o componente existe para resolver (tabela estourando a tela
 * no celular). Omitir `modo` mantém o comportamento original byte-a-byte,
 * para os 13 consumidores que não oferecem a escolha ao usuário.
 *
 * Uso: <ResponsiveList table={<table>...</table>} cards={items.map(...)} />
 */
export function ResponsiveList({
  table,
  cards,
  modo,
  className,
}: {
  table: React.ReactNode
  cards: React.ReactNode
  modo?: 'lista' | 'grid'
  className?: string
}) {
  // Cards forçados: a tabela nem é montada — evita renderizar duas árvores.
  // Sem classe de layout própria aqui: quem quer grade em colunas (em vez de
  // pilha única) manda via `className` (ex. `lista-os.tsx` passa `lg:grid-cols-2`).
  if (modo === 'grid') {
    return <div className={cn('grid grid-cols-1 gap-3', className)}>{cards}</div>
  }

  return (
    <div className={className}>
      <div className="hidden overflow-x-auto md:block">{table}</div>
      <div className="flex flex-col gap-3 md:hidden">{cards}</div>
    </div>
  )
}

/** Preset de <Card> para item de lista — mantido como nome próprio porque é o vocabulário já usado em várias telas. */
export function CardListItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card elevacao="raised" padding="md" className={className}>
      {children}
    </Card>
  )
}
