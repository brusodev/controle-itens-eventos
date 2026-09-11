import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LIMITE_POR_PAGINA } from '../schema'

/**
 * Paginação — porta de atualizarPaginacao() (auditoria.html:632-637), com
 * uma correção: o legado desabilitava "Próxima" quando a página vinha com
 * menos de `limite` itens e nunca usava o `total` que o backend já devolve,
 * então não sabia quantas páginas existiam. Aqui o total vira "Página X de
 * Y" e o contador de registros.
 */
export function PaginacaoAuditoria({
  pagina,
  total,
  onMudarPagina,
}: {
  pagina: number
  total: number
  onMudarPagina: (pagina: number) => void
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE_POR_PAGINA))

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-text-muted">
        {total.toLocaleString('pt-BR')} {total === 1 ? 'registro' : 'registros'} · página {pagina} de {totalPaginas}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={pagina <= 1}
          onClick={() => onMudarPagina(pagina - 1)}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={pagina >= totalPaginas}
          onClick={() => onMudarPagina(pagina + 1)}
        >
          Próxima
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  )
}
