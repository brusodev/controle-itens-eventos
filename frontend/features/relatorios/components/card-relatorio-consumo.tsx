'use client'

import { useState } from 'react'
import { FileSearch } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { useRelatorioConsumo } from '../hooks/use-relatorio-consumo'
import { periodoMesVigente } from '../periodo-mes-vigente'
import { EMPTY_FILTROS_CONSUMO, type FiltrosConsumo } from '../schema'
import { FiltroPeriodo } from './filtro-periodo'

/** Consumo por Categoria — porta do card #4 (gerarRelatorioCategoria). Sem exportação no legado. */
export function CardRelatorioConsumo() {
  const [filtros, setFiltros] = useState<FiltrosConsumo>(() => {
    const { inicio, fim } = periodoMesVigente()
    return { ...EMPTY_FILTROS_CONSUMO, dataInicio: inicio, dataFim: fim }
  })
  const [gerado, setGerado] = useState(false)

  const { data, isFetching } = useRelatorioConsumo(filtros, gerado)

  return (
    <Card as="section" padding="lg">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-text">Consumo por Categoria</h2>
        <p className="text-sm text-text-muted">Análise consolidada do consumo agrupado por categoria.</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FiltroPeriodo
          dataInicio={filtros.dataInicio}
          dataFim={filtros.dataFim}
          onChangeInicio={(v) => setFiltros((f) => ({ ...f, dataInicio: v }))}
          onChangeFim={(v) => setFiltros((f) => ({ ...f, dataFim: v }))}
        />
      </div>

      <div className="mt-4">
        <Button onClick={() => setGerado(true)} loading={isFetching}>
          <FileSearch aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Gerar Relatório
        </Button>
      </div>

      {gerado && (
        <div className="mt-4 flex flex-col gap-3">
          {isFetching && !data ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : data && data.categorias.length > 0 ? (
            data.categorias.map((cat) => (
              <details key={cat.categoria} className="rounded-md border border-border-subtle p-3" open>
                <summary className="cursor-pointer text-sm font-semibold text-text">
                  {cat.categoria} — {cat.total_itens_diferentes} itens, {cat.total_consumo.toLocaleString('pt-BR')} consumidos
                </summary>
                <ul className="mt-2 flex flex-col gap-1 pl-2">
                  {cat.itens.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm text-text-muted">
                      <span>{item.descricao}</span>
                      <span>
                        {item.total_consumido.toLocaleString('pt-BR')} {item.unidade} ({item.vezes_utilizado}x)
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ))
          ) : data ? (
            <EmptyState title="Nenhum consumo encontrado" description="Ajuste o período e tente novamente." />
          ) : null}
        </div>
      )}
    </Card>
  )
}
