import { Button } from '@/components/ui/button'
import type { OSForm } from '../../schema'

/** Porta do banner criado em _verificarRascunhoOS (emitir-os.js:1467-1483). */
export function BannerRascunho({
  timestamp,
  dados,
  onRestaurar,
  onDescartar,
}: {
  timestamp: number
  dados: OSForm
  onRestaurar: () => void
  onDescartar: () => void
}) {
  const data = new Date(timestamp).toLocaleString('pt-BR')
  const nItens = dados.itens.length

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-warning bg-warning-subtle px-4 py-3">
      <span className="text-sm text-text">
        Rascunho salvo em {data} — {nItens} {nItens === 1 ? 'item' : 'itens'}
      </span>
      <div className="flex gap-2">
        <Button size="sm" onClick={onRestaurar}>
          Restaurar
        </Button>
        <Button size="sm" variant="secondary" onClick={onDescartar}>
          Descartar
        </Button>
      </div>
    </div>
  )
}
