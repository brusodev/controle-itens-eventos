import type { LucideIcon } from 'lucide-react'
import {
  Boxes,
  ClipboardList,
  Building2,
  FileText,
  LayoutGrid,
  Receipt,
  ScrollText,
  ShieldCheck,
  Tags,
  Users,
} from 'lucide-react'
import type { Usuario } from '@/features/auth/schema'
import { temAcessoModulo } from '@/features/auth/tem-acesso-modulo'
import type { Modulo, ModuloConfig } from '@/features/modulos/config'

/**
 * Os 10 itens de menu da sidebar — porta de layout_parts.html (macro
 * sidebar()), ramo admin/comum. Ordem e visibilidade idênticas ao legado.
 *
 * `href` aponta para a rota Next quando a tela já foi migrada, ou para a
 * rota Flask equivalente quando não. Itens 4/5/8 (Emitir O.S., Ordens,
 * Detentoras) usam o path NOVO mesmo a rota Flask antiga ainda existindo —
 * evita a pessoa cair numa versão dessincronizada da mesma tela.
 *
 * Ícone é componente (lucide), não emoji: emoji renderiza com a fonte do
 * sistema — muda de forma, cor e tamanho entre Windows/macOS/Android e não
 * herda currentColor, então não dá para alinhar com o estado ativo do item.
 * Emoji fica só no dashboard e no favicon, onde é decoração intencional.
 */
export interface ItemMenu {
  id: string
  label: string
  Icone: LucideIcon
  href: string
  /** true = rota do Next (usar <Link>); false = ainda Flask (usar <a> normal). */
  migrado: boolean
}

export const ITENS_MENU_BASE: readonly ItemMenu[] = [
  { id: 'dashboard', label: 'Trocar Módulo', Icone: LayoutGrid, href: '/dashboard', migrado: true },
  { id: 'estoque', label: 'Estoque', Icone: Boxes, href: '/estoque', migrado: true },
  { id: 'categorias', label: 'Categorias', Icone: Tags, href: '/categorias', migrado: true },
  { id: 'emitir-os', label: 'Emitir O.S.', Icone: FileText, href: '/os/nova', migrado: true },
  { id: 'ordens-servico', label: 'Ordens de Serviço', Icone: ClipboardList, href: '/os', migrado: true },
  { id: 'pedidos-graficos', label: 'Pedidos/Orçamentos', Icone: Receipt, href: '/pedidos-graficos', migrado: true },
  { id: 'relatorios', label: 'Relatórios', Icone: ScrollText, href: '/relatorios', migrado: true },
  { id: 'detentoras', label: 'Detentoras', Icone: Building2, href: '/detentoras', migrado: true },
] as const

/** Itens 9 e 10 — só admin, mesmo bloco {% if %} server-side no legado. */
export const ITENS_MENU_ADMIN: readonly ItemMenu[] = [
  { id: 'usuarios', label: 'Usuários', Icone: Users, href: '/usuarios', migrado: true },
  { id: 'auditoria', label: 'Auditoria', Icone: ShieldCheck, href: '/auditoria', migrado: true },
] as const

/**
 * Monta a lista final de itens visíveis para este usuário/módulo — porta da
 * lógica de visibilidade hoje espalhada entre Jinja ({% if usuario_perfil
 * == 'admin' %}) e JS (checagem de modulo_atual + /auth/api/me para
 * Pedidos/Orçamentos).
 */
export function itensMenuVisiveis(usuario: Usuario, modulo: Modulo, config: ModuloConfig): ItemMenu[] {
  const itens: ItemMenu[] = []

  for (const item of ITENS_MENU_BASE) {
    if (item.id === 'estoque') {
      itens.push({ ...item, label: config.itemLabel })
      continue
    }
    if (item.id === 'pedidos-graficos') {
      if (modulo === 'servicos_graficos' && temAcessoModulo(usuario, 'servicos_graficos')) {
        itens.push(item)
      }
      continue
    }
    itens.push(item)
  }

  if (usuario.perfil === 'admin') {
    itens.push(...ITENS_MENU_ADMIN)
  }

  return itens
}
