'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { DataList } from '@/components/ui/data-list'
import { useToast } from '@/components/ui/toast'
import { StatusBadge } from '@/features/ordens-servico/components/status-badge'
import { STATUS_OS } from '@/features/ordens-servico/schema'

/**
 * Style guide — entregável de design do plano (§ "Entregável de design
 * antes das telas"). Todo componente de components/ui/ em todos os estados,
 * para aprovação da direção visual ANTES de qualquer tela da Fase 1.
 *
 * Não é uma tela do produto: não faz parte da navegação normal, existe só
 * como referência viva. Se um componente muda aqui, ele muda em todo lugar
 * que o consome — o objetivo é impedir a divergência que existia entre
 * portal-empresa.css e o statusLabels inline de ordens-servico.js.
 */
export default function StyleGuidePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { showToast } = useToast()

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-12">
      <header>
        <h1 className="text-2xl font-bold text-text">Style Guide</h1>
        <p className="text-text-muted">
          Tokens e componentes — referência viva, não uma tela do produto.
        </p>
      </header>

      <Section title="Cores">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Swatch name="primary" className="bg-primary" />
          <Swatch name="primary-hover" className="bg-primary-hover" />
          <Swatch name="primary-emphasis" className="bg-primary-emphasis" />
          <Swatch name="success" className="bg-success" />
          <Swatch name="warning" className="bg-warning" />
          <Swatch name="danger" className="bg-danger" />
          <Swatch name="danger-strong" className="bg-danger-strong" />
          <Swatch name="info" className="bg-info" />
          <Swatch name="indigo" className="bg-indigo" />
          <Swatch name="purple" className="bg-purple" />
          <Swatch name="neutral-strong" className="bg-neutral-strong" />
        </div>
      </Section>

      <Section title="Tipografia">
        <p className="text-2xl font-bold text-text">Título 2xl / bold</p>
        <p className="text-lg font-semibold text-text">Título lg / semibold</p>
        <p className="text-base text-text">Corpo base</p>
        <p className="text-sm text-text-muted">Texto muted sm</p>
        <p className="text-xs text-text-muted">Texto xs</p>
      </Section>

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

      <Section title="StatusBadge — os 8 estados da O.S.">
        <div className="flex flex-wrap gap-2">
          {STATUS_OS.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </Section>

      <Section title="Badge — tons genéricos">
        <div className="flex flex-wrap gap-2">
          <Badge tone="success">Success</Badge>
          <Badge tone="warning">Warning</Badge>
          <Badge tone="danger">Danger</Badge>
          <Badge tone="info">Info</Badge>
        </div>
      </Section>

      <Section title="Field / Input / Select / Textarea">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Evento" required>
            {(id, describedBy) => (
              <Input id={id} aria-describedby={describedBy} placeholder="Workshop de..." />
            )}
          </Field>
          <Field label="Com erro" error="Campo obrigatório.">
            {(id, describedBy) => <Input id={id} aria-describedby={describedBy} />}
          </Field>
          <Field label="Com hint" hint="Formato livre, ex: 26 à 30/05/2026">
            {(id, describedBy) => <Input id={id} aria-describedby={describedBy} />}
          </Field>
          <Field label="Grupo">
            {(id, describedBy) => (
              <Select id={id} aria-describedby={describedBy}>
                <option>Grupo 1</option>
                <option>Grupo 2</option>
              </Select>
            )}
          </Field>
          <Field label="Observações">
            {(id, describedBy) => <Textarea id={id} aria-describedby={describedBy} />}
          </Field>
          <Field label="Autocomplete (DataList)">
            {(id, describedBy) => (
              <DataList
                id={id}
                aria-describedby={describedBy}
                suggestions={['Workshop de Capacitação', 'Reunião Anual', 'Seminário Regional']}
              />
            )}
          </Field>
        </div>
      </Section>

      <Section title="Toast">
        <div className="flex flex-wrap gap-3">
          <Button variant="success" onClick={() => showToast('Salvo com sucesso.', 'success')}>
            Disparar toast de sucesso
          </Button>
          <Button variant="danger" onClick={() => showToast('Erro ao salvar.', 'error')}>
            Disparar toast de erro
          </Button>
        </div>
      </Section>

      <Section title="Modal / ConfirmDialog">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setModalOpen(true)}>Abrir modal</Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Abrir confirm dialog
          </Button>
        </div>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Exemplo de modal">
          <p className="text-sm text-text-muted">
            Bottom-sheet no mobile, centralizado a partir de sm:. Esc fecha, Tab prende o foco.
          </p>
        </Modal>
        <ConfirmDialog
          open={confirmOpen}
          title="Excluir O.S.?"
          description="Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          danger
          onConfirm={() => setConfirmOpen(false)}
          onCancel={() => setConfirmOpen(false)}
        />
      </Section>

      <Section title="Skeleton / Spinner / EmptyState">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-2/3" />
        </div>
        <Spinner />
        <EmptyState
          title="Nenhuma O.S. encontrada"
          description="Ajuste os filtros ou crie uma nova ordem de serviço."
          action={<Button size="sm">Nova O.S.</Button>}
        />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border-subtle pt-6">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      {children}
    </section>
  )
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-16 rounded-md border border-border-subtle ${className}`} />
      <span className="text-xs text-text-muted">{name}</span>
    </div>
  )
}
