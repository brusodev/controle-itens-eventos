'use client'

import { useState } from 'react'
import { Download, FileSearch } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { STATUS_OS } from '@/features/ordens-servico/components/status-badge'
import { formatarMoeda } from '@/lib/formatters'
import { relatoriosAPI } from '../api'
import { useRelatorioTransporte } from '../hooks/use-relatorio-transporte'
import { periodoMesVigente } from '../periodo-mes-vigente'
import { EMPTY_FILTROS_TRANSPORTE, type FiltrosTransporte } from '../schema'
import { FiltroPeriodo } from './filtro-periodo'
import { StatCards } from './stat-cards'
import { TabelaTransporte } from './tabela-transporte'

/**
 * Transportes — por Setor Solicitante — porta do card #7
 * (gerarRelatorioTransporteSetores), visível só quando o módulo ativo é
 * 'transporte' (ver painel-relatorios.tsx).
 */
export function CardRelatorioTransporte() {
  const [filtros, setFiltros] = useState<FiltrosTransporte>(() => {
    const { inicio, fim } = periodoMesVigente()
    return { ...EMPTY_FILTROS_TRANSPORTE, dataInicio: inicio, dataFim: fim }
  })
  const [gerado, setGerado] = useState(false)

  const { data, isFetching } = useRelatorioTransporte(filtros, gerado)

  return (
    <Card as="section" padding="lg">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-text">Transportes — por Setor Solicitante</h2>
        <p className="text-sm text-text-muted">Valores das O.S. de transporte agrupados pelo setor que solicitou o serviço.</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Setor">
          {(id) => (
            <Input id={id} value={filtros.setor} onChange={(e) => setFiltros((f) => ({ ...f, setor: e.target.value }))} placeholder="Nome do setor" />
          )}
        </Field>
        <Field label="Status">
          {(id) => (
            <Select id={id} value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
              <option value="">Todos</option>
              {STATUS_OS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Empresa">
          {(id) => (
            <Input id={id} value={filtros.empresa} onChange={(e) => setFiltros((f) => ({ ...f, empresa: e.target.value }))} placeholder="Nome da empresa" />
          )}
        </Field>
        <FiltroPeriodo
          labelInicio="Data emissão de"
          labelFim="Data emissão até"
          dataInicio={filtros.dataInicio}
          dataFim={filtros.dataFim}
          onChangeInicio={(v) => setFiltros((f) => ({ ...f, dataInicio: v }))}
          onChangeFim={(v) => setFiltros((f) => ({ ...f, dataFim: v }))}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => setGerado(true)} loading={isFetching}>
          <FileSearch aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Gerar Relatório
        </Button>
        {gerado && data && data.ordens.length > 0 && (
          <Button variant="success" onClick={() => window.open(relatoriosAPI.urlExcelTransporte(filtros), '_blank')}>
            <Download aria-hidden="true" className="size-4" strokeWidth={1.75} />
            Exportar Excel
          </Button>
        )}
      </div>

      {gerado && (
        <div className="mt-4 flex flex-col gap-4">
          {isFetching && !data ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : data ? (
            <>
              <StatCards
                itens={[
                  { label: 'Total O.S.', valor: String(data.estatisticas.total_os) },
                  { label: 'Setores', valor: String(data.estatisticas.total_setores) },
                  { label: 'Valor Total', valor: formatarMoeda(data.estatisticas.valor_total_geral) },
                  { label: 'Valor Médio/O.S.', valor: formatarMoeda(data.estatisticas.valor_medio_os) },
                ]}
              />

              {data.setores.length > 0 && (
                <div className="rounded-md border border-border-subtle p-3">
                  <h3 className="mb-2 text-sm font-semibold text-text">Resumo por setor</h3>
                  <ul className="flex flex-col gap-1">
                    {data.setores.map((s) => (
                      <li key={s.setor} className="flex justify-between text-sm">
                        <span className="text-text">{s.setor}</span>
                        <span className="text-text-muted">
                          {s.qtdOS} O.S. · {formatarMoeda(s.valorTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <TabelaTransporte ordens={data.ordens} />
            </>
          ) : null}
        </div>
      )}
    </Card>
  )
}
