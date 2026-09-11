'use client'

import { Button } from '@/components/ui/button'
import { Field, Select, Input } from '@/components/ui/field'
import { useUsuariosAuditoria } from '../hooks/use-usuarios-auditoria'
import {
  ACOES_AUDITORIA,
  EMPTY_FILTROS_AUDITORIA,
  LABEL_ACAO,
  LABEL_MODULO,
  MODULOS_AUDITORIA,
  type FiltrosAuditoria,
} from '../schema'

/**
 * Os 4 filtros da tela — porta do .filter-grid (auditoria.html:447-491).
 *
 * Diferença de comportamento: o legado só filtrava ao clicar em "Aplicar".
 * Aqui cada mudança já reconsulta (a query key inclui os filtros), então
 * "Aplicar" deixa de existir; sobra "Limpar", que faz falta de verdade.
 */
export function FiltrosAuditoriaForm({
  filtros,
  onChange,
}: {
  filtros: FiltrosAuditoria
  onChange: (filtros: FiltrosAuditoria) => void
}) {
  const { data: usuarios = [] } = useUsuariosAuditoria()

  function definir<K extends keyof FiltrosAuditoria>(campo: K, valor: FiltrosAuditoria[K]) {
    onChange({ ...filtros, [campo]: valor })
  }

  const temFiltro = Object.values(filtros).some(Boolean)

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Usuário">
          {(id) => (
            <Select id={id} value={filtros.usuarioId} onChange={(e) => definir('usuarioId', e.target.value)}>
              <option value="">Todos</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nome} ({usuario.email})
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Módulo">
          {(id) => (
            <Select id={id} value={filtros.modulo} onChange={(e) => definir('modulo', e.target.value)}>
              <option value="">Todos</option>
              {MODULOS_AUDITORIA.map((modulo) => (
                <option key={modulo} value={modulo}>
                  {LABEL_MODULO[modulo]}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Ação">
          {(id) => (
            <Select id={id} value={filtros.acao} onChange={(e) => definir('acao', e.target.value)}>
              <option value="">Todas</option>
              {ACOES_AUDITORIA.map((acao) => (
                <option key={acao} value={acao}>
                  {LABEL_ACAO[acao]}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Data início">
          {(id) => (
            <Input id={id} type="date" value={filtros.dataInicio} onChange={(e) => definir('dataInicio', e.target.value)} />
          )}
        </Field>

        <Field label="Data fim">
          {(id) => (
            <Input id={id} type="date" value={filtros.dataFim} onChange={(e) => definir('dataFim', e.target.value)} />
          )}
        </Field>
      </div>

      {temFiltro && (
        <div className="mt-3 flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => onChange(EMPTY_FILTROS_AUDITORIA)}>
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
