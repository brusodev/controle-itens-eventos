import { FormularioOS } from '@/features/ordens-servico/components/formulario/formulario-os'

export default async function EditarOSPage({ params }: PageProps<'/os/[id]/editar'>) {
  const { id } = await params
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-xl font-semibold text-text">Editar Ordem de Serviço</h1>
      <FormularioOS osId={Number(id)} />
    </div>
  )
}
