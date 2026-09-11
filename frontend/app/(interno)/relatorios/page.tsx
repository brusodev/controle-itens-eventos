import { PainelRelatorios } from '@/features/relatorios/components/painel-relatorios'

/** Porta da aba Relatórios de index.html — 8 sub-relatórios, cada um seu card. */
export default function RelatoriosPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-text sm:text-2xl">Relatórios do Sistema</h1>
      </header>

      <PainelRelatorios />
    </div>
  )
}
