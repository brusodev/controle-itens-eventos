import Link from 'next/link'
import { cn } from '@/lib/cn'
import type { ItemMenu } from '../menu-items'

/**
 * Um item de menu — decide <Link> (rota Next) vs <a> comum (rota Flask,
 * navegação de página inteira) conforme `item.migrado`. Porta do estilo
 * `.menu-item.active` de layout.css (fundo sidebar-active, borda esquerda).
 *
 * `colapsada` só vale no desktop: no mobile a sidebar é drawer e sempre
 * mostra o label, senão o drawer viraria uma tira de 70px de ícones.
 */
export function ItemMenuLink({
  item,
  ativo,
  colapsada,
  onNavegar,
}: {
  item: ItemMenu
  ativo: boolean
  colapsada: boolean
  onNavegar?: () => void
}) {
  const { Icone } = item

  const classe = cn(
    'relative flex items-center gap-3 rounded-md py-2.5 text-sm font-medium transition-colors',
    // Colapsada centraliza o ícone; expandida mantém o padding lateral do legado.
    colapsada ? 'px-0 md:justify-center' : 'px-3',
    ativo
      ? // Borda esquerda do legado (.menu-item.active), via pseudo-elemento
        // para não empurrar o padding — ausente até aqui (comentário do
        // arquivo já apontava a lacuna).
        'bg-white/10 text-white before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-primary-300'
      : 'text-white/70 hover:bg-white/5 hover:text-white',
  )

  const conteudo = (
    <>
      <Icone aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
      <span className={cn('truncate', colapsada && 'md:hidden')}>{item.label}</span>
    </>
  )

  const props = {
    className: classe,
    // No desktop colapsado o label some visualmente — o title devolve a
    // informação no hover, e aria-label a devolve ao leitor de tela.
    title: colapsada ? item.label : undefined,
    'aria-current': ativo ? ('page' as const) : undefined,
  }

  if (item.migrado) {
    return (
      <Link href={item.href} {...props} onClick={onNavegar}>
        {conteudo}
      </Link>
    )
  }

  // Rota ainda Flask — navegação de página inteira, fora do roteador do Next.
  return (
    <a href={item.href} {...props}>
      {conteudo}
    </a>
  )
}
