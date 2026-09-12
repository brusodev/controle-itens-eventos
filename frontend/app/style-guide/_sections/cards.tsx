import { Card } from '@/components/ui/card'
import { CardListItem } from '@/components/ui/responsive-list'
import { Section } from './shared'

export function SecaoCard() {
  return (
    <Section title="Card — elevações">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card elevacao="flat">
          <p className="text-sm font-medium text-text">flat</p>
          <p className="text-xs text-text-muted">Só contorno, sem sombra.</p>
        </Card>
        <Card elevacao="raised">
          <p className="text-sm font-medium text-text">raised (padrão)</p>
          <p className="text-xs text-text-muted">Contorno + shadow-sm.</p>
        </Card>
        <Card elevacao="floating">
          <p className="text-sm font-medium text-text">floating</p>
          <p className="text-xs text-text-muted">Contorno + shadow-md.</p>
        </Card>
      </div>
      <Card interativo>
        <p className="text-sm font-medium text-text">interativo</p>
        <p className="text-xs text-text-muted">Hover eleva, active recolhe — para card que é alvo de clique.</p>
      </Card>
      <CardListItem>
        <p className="text-sm text-text-muted">
          <strong className="font-medium text-text">CardListItem</strong> — preset de Card usado pelas listas em
          mobile (ResponsiveList).
        </p>
      </CardListItem>
    </Section>
  )
}
