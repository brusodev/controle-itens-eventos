import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardListItem } from '@/components/ui/responsive-list'
import { getModuloConfig } from '@/features/modulos/config'
import type { Categoria } from '../schema'

/** Um card de categoria — porta de renderizarCategorias (categorias.js:136-175). */
export function CardCategoria({
  categoria,
  onEditar,
  onExcluir,
}: {
  categoria: Categoria
  onEditar: () => void
  onExcluir: () => void
}) {
  const icone = categoria.icone || getModuloConfig(categoria.modulo).emoji

  return (
    <CardListItem className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-text">
          {icone} {categoria.nome}
        </span>
        <Badge tone="info">{categoria.natureza || 'Geral'}</Badge>
      </div>
      <p className="text-xs text-text-muted">
        <strong className="font-medium text-text">ID:</strong> {categoria.tipo}
      </p>
      <p className="text-sm text-text">
        {categoria.descricao || <em className="text-text-muted">Sem descrição cadastrada.</em>}
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={onEditar}>
          Editar
        </Button>
        <Button size="sm" variant="danger" onClick={onExcluir}>
          Remover
        </Button>
      </div>
    </CardListItem>
  )
}
