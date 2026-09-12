import { Eye, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Perfil } from '@/features/auth/schema'
import { acoesVisiveis } from '../../acoes'
import type { OSPersistida } from '../../schema'
import { StatusBadge } from '../status-badge'

export interface TabelaOSProps {
  ordens: OSPersistida[]
  perfil: Perfil
  onAbrir: (id: number) => void
  onEditar: (id: number) => void
}

/**
 * Visão desktop da listagem — antes, um placeholder sem coluna de ações e
 * sem linha clicável: no desktop não havia NENHUMA forma de abrir uma O.S.
 * (só o card do mobile tinha o botão "Visualizar", que por sua vez apontava
 * para uma rota que não existia — ver detalhe-os.tsx). Linha inteira clicável
 * + botões próprios, com `stopPropagation` para não disparar os dois.
 */
export function TabelaOS({ ordens, perfil, onAbrir, onEditar }: TabelaOSProps) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border-subtle text-text-muted">
          <th className="py-2 pr-4">O.S.</th>
          <th className="py-2 pr-4">Evento</th>
          <th className="py-2 pr-4">Detentora</th>
          <th className="py-2 pr-4">Data do evento</th>
          <th className="py-2 pr-4">Itens</th>
          <th className="py-2 pr-4">Status</th>
          <th className="py-2 pr-4">
            <span className="sr-only">Ações</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {ordens.map((os) => {
          const acoes = acoesVisiveis({ perfil, status: os.status })
          return (
            <tr
              key={os.id}
              onClick={() => onAbrir(os.id)}
              className="cursor-pointer border-b border-border-subtle hover:bg-surface-muted"
            >
              <td className="py-2 pr-4">{os.numeroOS}</td>
              <td className="py-2 pr-4">{os.evento || 'Sem título'}</td>
              <td className="py-2 pr-4">{os.detentora || 'N/A'}</td>
              <td className="py-2 pr-4">{os.data || 'N/A'}</td>
              <td className="py-2 pr-4">{os.itens?.length ?? 0}</td>
              <td className="py-2 pr-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={os.status} />
                  {os.pagamentoPago && <Badge tone="success">Paga</Badge>}
                </div>
              </td>
              <td className="py-2 pr-4">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={(evento) => {
                      evento.stopPropagation()
                      onAbrir(os.id)
                    }}
                    aria-label={`Visualizar O.S. ${os.numeroOS}`}
                    title="Visualizar"
                    className="rounded-sm p-1.5 text-text-muted hover:bg-surface hover:text-text"
                  >
                    <Eye aria-hidden="true" className="size-4" strokeWidth={1.75} />
                  </button>
                  {acoes.has('editar') && (
                    <button
                      type="button"
                      onClick={(evento) => {
                        evento.stopPropagation()
                        onEditar(os.id)
                      }}
                      aria-label={`Editar O.S. ${os.numeroOS}`}
                      title="Editar"
                      className="rounded-sm p-1.5 text-text-muted hover:bg-surface hover:text-text"
                    >
                      <Pencil aria-hidden="true" className="size-4" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
