'use client'

import { useState } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuditoria } from '../hooks/use-auditoria'
import { EMPTY_FILTROS_AUDITORIA, type Auditoria, type FiltrosAuditoria } from '../schema'
import { CardsEstatisticas } from './cards-estatisticas'
import { FiltrosAuditoriaForm } from './filtros-auditoria'
import { ListaAuditoria } from './lista-auditoria'
import { ModalDetalheAuditoria } from './modal-detalhe-auditoria'
import { PaginacaoAuditoria } from './paginacao-auditoria'

/** Orquestra filtros + lista + paginação + modal. A página só monta este componente. */
export function PainelAuditoria() {
  const [filtros, setFiltros] = useState<FiltrosAuditoria>(EMPTY_FILTROS_AUDITORIA)
  const [pagina, setPagina] = useState(1)
  const [detalhe, setDetalhe] = useState<Auditoria | null>(null)

  const { data, isLoading, isError } = useAuditoria(filtros, pagina)

  // Trocar filtro precisa voltar à página 1: filtrar na página 7 e cair num
  // resultado de 2 páginas mostraria uma lista vazia sem explicação.
  function aplicarFiltros(novos: FiltrosAuditoria) {
    setFiltros(novos)
    setPagina(1)
  }

  return (
    <div className="flex flex-col gap-4">
      <CardsEstatisticas />
      <FiltrosAuditoriaForm filtros={filtros} onChange={aplicarFiltros} />

      {isError ? (
        <EmptyState title="Erro ao carregar registros" description="Tente novamente em alguns instantes." />
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          <ListaAuditoria registros={data?.auditorias ?? []} onVerDetalhes={setDetalhe} />
          <PaginacaoAuditoria pagina={pagina} total={data?.total ?? 0} onMudarPagina={setPagina} />
        </>
      )}

      <ModalDetalheAuditoria registro={detalhe} onClose={() => setDetalhe(null)} />
    </div>
  )
}
