import { FormularioOS } from '@/features/ordens-servico/components/formulario/formulario-os'

export default function NovaOSPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-xl font-semibold text-text">Emitir Ordem de Serviço</h1>
      <FormularioOS />
    </div>
  )
}
