'use client'

import { useState } from 'react'
import { Download, FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { STATUS_OS } from '@/features/ordens-servico/components/status-badge'
import { formatarMoeda } from '@/lib/formatters'
import { relatoriosAPI } from '../api'
import { useRelatorioOrganizacao } from '../hooks/use-relatorio-organizacao'
import { periodoMesVigente } from '../periodo-mes-vigente'
import { EMPTY_FILTROS_ORGANIZACAO, type FiltrosOrganizacao } from '../schema'
import { FiltroPeriodo } from './filtro-periodo'
import { StatCards } from './stat-cards'
import { TabelaOrganizacao } from './tabela-organizacao'

const GRUPOS = [
  { valor: '1', label: 'Capital / RMSP' },
  { valor: '2', label: 'Interior' },
  { valor: '3', label: 'Litoral' },
]

/**
 * Eventos — Organização — porta do card #6 (gerarRelatorioOrgEventos),
 * visível só quando o módulo ativo é 'organizacao' (a página só monta este
 * card nesse caso — ver painel-relatorios.tsx).
 */
export function CardRelatorioOrganizacao() {
  const [filtros, setFiltros] = useState<FiltrosOrganizacao>(() => {
    const { inicio, fim } = periodoMesVigente()
    return { ...EMPTY_FILTROS_ORGANIZACAO, dataInicio: inicio, dataFim: fim }
  })
  const [gerado, setGerado] = useState(false)

  const { data, isFetching } = useRelatorioOrganizacao(filtros, gerado)

  return (
    <section className="rounded-lg border border-border-subtle bg-surface p-4 sm:p-6">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-text">Eventos — Módulo Organização</h2>
        <p className="text-sm text-text-muted">Custo por categoria, pessoas atendidas e detalhamento de itens por evento.</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Grupo">
          {(id) => (
            <Select id={id} value={filtros.grupo} onChange={(e) => setFiltros((f) => ({ ...f, grupo: e.target.value }))}>
              <option value="">Todos</option>
              {GRUPOS.map((g) => (
                <option key={g.valor} value={g.valor}>
                  {g.label}
                </option>
              ))}
            </Select>
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
        {gerado && data && data.eventos.length > 0 && (
          <Button variant="success" onClick={() => window.open(relatoriosAPI.urlExcelOrganizacao(filtros), '_blank')}>
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
                  { label: 'Eventos', valor: String(data.estatisticas.total_eventos) },
                  { label: 'Pessoas Atendidas', valor: String(data.estatisticas.total_pessoas) },
                  { label: 'Custo Total', valor: formatarMoeda(data.estatisticas.custo_total_geral) },
                  { label: 'Custo Médio/Evento', valor: formatarMoeda(data.estatisticas.custo_medio_evento) },
                ]}
              />
              <TabelaOrganizacao eventos={data.eventos} />
            </>
          ) : null}
        </div>
      )}
    </section>
  )
}
