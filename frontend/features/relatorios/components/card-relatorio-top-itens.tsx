'use client'

import { useState } from 'react'
import { Download, FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Select } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { useModulo } from '@/features/modulos/modulo-context'
import { relatoriosAPI } from '../api'
import { useRelatorioTopItens } from '../hooks/use-relatorio-top-itens'
import { periodoMesVigente } from '../periodo-mes-vigente'
import { EMPTY_FILTROS_TOP_ITENS, type FiltrosTopItens } from '../schema'
import { FiltroPeriodo } from './filtro-periodo'
import { GraficoPizzaItens } from './grafico-pizza-itens'
import { TabelaTopItens } from './tabela-top-itens'

const GRUPOS = [
  { valor: '1', label: 'Capital / RMSP' },
  { valor: '2', label: 'Interior' },
  { valor: '3', label: 'Litoral' },
]

/** Itens Mais Utilizados — porta do card #5 (gerarRelatorioTopItens/exportarTopItensExcel), com gráfico de pizza. */
export function CardRelatorioTopItens() {
  const { modulo } = useModulo()
  const [filtros, setFiltros] = useState<FiltrosTopItens>(() => {
    const { inicio, fim } = periodoMesVigente()
    return { ...EMPTY_FILTROS_TOP_ITENS, dataInicio: inicio, dataFim: fim }
  })
  const [gerado, setGerado] = useState(false)

  const { data, isFetching } = useRelatorioTopItens(filtros, gerado)

  return (
    <section className="rounded-lg border border-border-subtle bg-surface p-4 sm:p-6">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-text">Itens Mais Utilizados</h2>
        <p className="text-sm text-text-muted">Ranking dos itens com maior consumo.</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FiltroPeriodo
          dataInicio={filtros.dataInicio}
          dataFim={filtros.dataFim}
          onChangeInicio={(v) => setFiltros((f) => ({ ...f, dataInicio: v }))}
          onChangeFim={(v) => setFiltros((f) => ({ ...f, dataFim: v }))}
        />
        <Field label="Grupo / Região">
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
        <Field label="Ordenar por">
          {(id) => (
            <Select
              id={id}
              value={filtros.ordenarPor}
              onChange={(e) => setFiltros((f) => ({ ...f, ordenarPor: e.target.value as FiltrosTopItens['ordenarPor'] }))}
            >
              <option value="total_consumido">Qtd. Consumida</option>
              <option value="vezes_utilizado">Vezes Utilizado</option>
            </Select>
          )}
        </Field>
        <Field label="Limite">
          {(id) => (
            <Select id={id} value={filtros.limite} onChange={(e) => setFiltros((f) => ({ ...f, limite: e.target.value }))}>
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="50">Top 50</option>
            </Select>
          )}
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => setGerado(true)} loading={isFetching}>
          <FileSearch aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Gerar Relatório
        </Button>
        {gerado && data && data.ranking.length > 0 && (
          <Button
            variant="success"
            onClick={() => window.open(relatoriosAPI.urlExcelTopItens(filtros, modulo), '_blank')}
          >
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
              <GraficoPizzaItens itens={data.ranking} />
              <TabelaTopItens ranking={data.ranking} />
            </>
          ) : null}
        </div>
      )}
    </section>
  )
}
