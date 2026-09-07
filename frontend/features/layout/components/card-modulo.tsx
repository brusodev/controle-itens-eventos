import { Button } from '@/components/ui/button'
import { CardListItem } from '@/components/ui/responsive-list'
import { getModuloConfig, type Modulo } from '@/features/modulos/config'
import { DESCRICAO_DASHBOARD } from '../dashboard-cards'

/** Um card de módulo — porta de .module-card em dashboard.html:209-249. */
export function CardModulo({ modulo, onAcessar }: { modulo: Modulo; onAcessar: () => void }) {
  const config = getModuloConfig(modulo)

  return (
    <CardListItem className="flex flex-col items-center gap-3 p-6 text-center">
      <span aria-hidden="true" className="text-4xl">
        {config.emoji}
      </span>
      <h3 className="text-lg font-semibold text-text">{config.titulo}</h3>
      <p className="text-sm text-text-muted">{DESCRICAO_DASHBOARD[modulo]}</p>
      <Button onClick={onAcessar} className="mt-2">
        Acessar
      </Button>
    </CardListItem>
  )
}
