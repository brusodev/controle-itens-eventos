import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/features/ordens-servico/components/status-badge'
import { STATUS_OS } from '@/features/ordens-servico/schema'
import { Section } from './shared'

export function SecaoButton() {
  return (
    <Section title="Button — variantes, tamanhos e estados">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="success">Success</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm">Small</Button>
        <Button size="md">Medium (44px — alvo de toque)</Button>
        <Button size="lg">Large</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button loading>Carregando</Button>
        <Button disabled>Desabilitado</Button>
      </div>
    </Section>
  )
}

export function SecaoStatusBadge() {
  return (
    <Section title="StatusBadge — os 8 estados da O.S.">
      <div className="flex flex-wrap gap-2">
        {STATUS_OS.map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </div>
    </Section>
  )
}

export function SecaoBadge() {
  return (
    <Section title="Badge — tons, dot e ícone">
      <div className="flex flex-wrap gap-2">
        <Badge tone="success">Success</Badge>
        <Badge tone="warning">Warning</Badge>
        <Badge tone="danger">Danger</Badge>
        <Badge tone="info">Info</Badge>
        <Badge tone="indigo">Indigo</Badge>
        <Badge tone="purple">Purple</Badge>
        <Badge tone="neutral-strong">Neutral</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge tone="success" dot>
          Ao vivo
        </Badge>
        <Badge tone="danger" dot>
          Offline
        </Badge>
      </div>
    </Section>
  )
}
