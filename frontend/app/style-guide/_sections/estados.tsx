import { ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { Section } from './shared'

export function SecaoEstados() {
  return (
    <Section title="Skeleton / Spinner / EmptyState">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-2/3" />
      </div>
      <Spinner />
      <EmptyState
        title="Nenhuma O.S. encontrada"
        description="Ajuste os filtros ou crie uma nova ordem de serviço."
        icon={<ClipboardList aria-hidden="true" className="size-6" strokeWidth={1.75} />}
        action={<Button size="sm">Nova O.S.</Button>}
      />
    </Section>
  )
}
