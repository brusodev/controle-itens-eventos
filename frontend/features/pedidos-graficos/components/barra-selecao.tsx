import { FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatarMoeda } from '@/lib/formatters'

/**
 * Barra fixa no rodapé quando há pedidos selecionados para virar uma O.S.
 * única — porta de atualizarBarraSelecaoPedidos() (pedidos-graficos.js:186).
 */
export function BarraSelecao({
  quantidade,
  totalEstimado,
  onEmitirOS,
  onLimpar,
}: {
  quantidade: number
  totalEstimado: number
  onEmitirOS: () => void
  onLimpar: () => void
}) {
  if (quantidade === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center justify-center gap-4 bg-indigo px-4 py-3 text-text-on-primary shadow-lg">
      <span className="font-medium">
        {quantidade} {quantidade === 1 ? 'pedido selecionado' : 'pedidos selecionados'} · Total estimado: {formatarMoeda(totalEstimado)}
      </span>
      <Button variant="success" size="sm" onClick={onEmitirOS}>
        <FileText aria-hidden="true" className="size-4" strokeWidth={1.75} />
        Emitir O.S. única
      </Button>
      <Button variant="ghost" size="sm" onClick={onLimpar} className="text-text-on-primary hover:bg-white/10">
        <X aria-hidden="true" className="size-4" strokeWidth={1.75} />
        Limpar seleção
      </Button>
    </div>
  )
}
