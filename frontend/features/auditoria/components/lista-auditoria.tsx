'use client'

import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardListItem, ResponsiveList } from '@/components/ui/responsive-list'
import { EmptyState } from '@/components/ui/empty-state'
import { formatarDataHoraBr } from '../formatar-data'
import { LABEL_MODULO, type Auditoria, type ModuloAuditoria } from '../schema'
import { BadgeAcao } from './badge-acao'

function moduloLabel(modulo: string): string {
  return LABEL_MODULO[modulo as ModuloAuditoria] ?? modulo
}

/**
 * Tabela (desktop) / cards (mobile) de registros — porta de
 * renderizarTabela() (auditoria.html:605-630), que montava innerHTML sem
 * escape para nome, e-mail e descrição.
 *
 * "Ver detalhes" passa o objeto por closure React, nunca serializado dentro
 * de um atributo onclick como no legado.
 */
export function ListaAuditoria({
  registros,
  onVerDetalhes,
}: {
  registros: Auditoria[]
  onVerDetalhes: (registro: Auditoria) => void
}) {
  if (registros.length === 0) {
    return <EmptyState title="Nenhum registro encontrado" description="Ajuste os filtros para ampliar a busca." />
  }

  return (
    <ResponsiveList
      table={
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-muted">
              <th className="px-3 py-2 font-medium">Data/Hora</th>
              <th className="px-3 py-2 font-medium">Usuário</th>
              <th className="px-3 py-2 font-medium">Ação</th>
              <th className="px-3 py-2 font-medium">Módulo</th>
              <th className="px-3 py-2 font-medium">Descrição</th>
              <th className="px-3 py-2 font-medium">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((registro) => (
              <tr key={registro.id} className="border-b border-border-subtle last:border-b-0">
                <td className="whitespace-nowrap px-3 py-2 text-text-muted">{formatarDataHoraBr(registro.data_hora)}</td>
                <td className="px-3 py-2">
                  <div className="font-medium text-text">{registro.usuario_nome ?? '—'}</div>
                  <div className="text-xs text-text-muted">{registro.usuario_email}</div>
                </td>
                <td className="px-3 py-2">
                  <BadgeAcao acao={registro.acao} />
                </td>
                <td className="px-3 py-2 text-text">{moduloLabel(registro.modulo)}</td>
                <td className="px-3 py-2 text-text">{registro.descricao}</td>
                <td className="px-3 py-2">
                  <Button variant="ghost" size="sm" onClick={() => onVerDetalhes(registro)}>
                    <Eye aria-hidden="true" className="size-4" strokeWidth={1.75} />
                    Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      cards={registros.map((registro) => (
        <CardListItem key={registro.id}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-text">{registro.usuario_nome ?? '—'}</p>
              <p className="truncate text-xs text-text-muted">{formatarDataHoraBr(registro.data_hora)}</p>
            </div>
            <BadgeAcao acao={registro.acao} />
          </div>
          <p className="mt-2 text-sm text-text">{registro.descricao}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-text-muted">{moduloLabel(registro.modulo)}</span>
            <Button variant="ghost" size="sm" onClick={() => onVerDetalhes(registro)}>
              <Eye aria-hidden="true" className="size-4" strokeWidth={1.75} />
              Ver
            </Button>
          </div>
        </CardListItem>
      ))}
    />
  )
}
