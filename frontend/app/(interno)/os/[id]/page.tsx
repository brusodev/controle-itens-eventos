import { DetalheOS } from '@/features/ordens-servico/components/detalhe/detalhe-os'

export default async function DetalheOSPage({ params }: PageProps<'/os/[id]'>) {
  const { id } = await params
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <DetalheOS osId={Number(id)} />
    </div>
  )
}
