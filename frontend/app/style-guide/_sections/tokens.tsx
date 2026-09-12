import { Section, Swatch } from './shared'

export function SecaoCores() {
  return (
    <Section title="Cores">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Swatch name="primary" className="bg-primary" />
        <Swatch name="primary-hover" className="bg-primary-hover" />
        <Swatch name="primary-emphasis" className="bg-primary-emphasis" />
        <Swatch name="primary-subtle" className="bg-primary-subtle" />
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
  )
}

export function SecaoTipografia() {
  return (
    <Section title="Tipografia">
      <p className="text-2xl font-bold text-text">Título 2xl / bold</p>
      <p className="text-lg font-semibold text-text">Título lg / semibold</p>
      <p className="text-base text-text">Corpo base</p>
      <p className="text-sm text-text-muted">Texto muted sm</p>
      <p className="text-xs text-text-muted">Texto xs</p>
    </Section>
  )
}

export function SecaoElevacaoRaio() {
  return (
    <Section title="Elevação e raio">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col items-center gap-2">
          <div className="size-16 rounded-sm bg-surface shadow-xs" />
          <span className="text-xs text-text-muted">xs / sm</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="size-16 rounded-md bg-surface shadow-sm" />
          <span className="text-xs text-text-muted">sm / md</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="size-16 rounded-lg bg-surface shadow-md" />
          <span className="text-xs text-text-muted">md / lg</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="size-16 rounded-xl bg-surface shadow-lg" />
          <span className="text-xs text-text-muted">lg / xl</span>
        </div>
      </div>
    </Section>
  )
}

export function SecaoGradiente() {
  return (
    <Section title="Gradiente de marca">
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-16 w-32 rounded-lg bg-brand-gradient" />
        <p className="text-2xl font-bold text-brand-gradient">Texto em gradiente</p>
      </div>
    </Section>
  )
}
