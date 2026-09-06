'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ResponsiveList } from '@/components/ui/responsive-list'
import { Button } from '@/components/ui/button'
import { useUsuarioAtual } from '@/features/auth/hooks/use-usuario-atual'
import { useModulo } from '@/features/modulos/modulo-context'
import { useOrdensServico } from '../../hooks/use-ordens-servico'
import { useModalOS } from '../../hooks/use-modal-os'
import { EMPTY_FILTRO_OS, FiltrosOS, type FiltroOSState } from './filtros-os'
import { CardOS } from './card-os'
import { TabelaOS } from './tabela-os'
import { ModalPagamento } from './modal-pagamento'
import { ModalExcluirOS } from './modal-excluir-os'
import { ModalCancelarOS } from './modal-cancelar-os'
import { ModalAtividadePortal } from './modal-atividade-portal'
import { ModalReordenarOS } from './modal-reordenar-os'

/**
 * Orquestrador da tela /os — porta de renderizarOrdensServico() em
 * ordens-servico.js, decomposto conforme o plano (§ Arquitetura):
 * FiltrosOS, CardOS, AcoesOS e um modal por responsabilidade.
 */
export function ListaOS() {
  const router = useRouter()
  const { modulo } = useModulo()
  const [filtro, setFiltro] = useState<FiltroOSState>(EMPTY_FILTRO_OS)
  const [reordenarAberto, setReordenarAberto] = useState(false)
  const { modal, fechar, abrirExcluir, abrirCancelar, abrirAtividade, abrirPagamento } =
    useModalOS()

  const { data: usuario } = useUsuarioAtual()
  const { data: ordens, isLoading, isError } = useOrdensServico(modulo, filtro)

  if (!usuario) return null // aguarda sessão resolver antes de decidir ações visíveis

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-text">Ordens de Serviço Emitidas</h1>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FiltrosOS value={filtro} onChange={setFiltro} />
        {usuario.perfil === 'admin' && filtro.grupo && (
          <Button variant="secondary" size="sm" onClick={() => setReordenarAberto(true)}>
            Reordenar OS
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {isError && (
        <EmptyState
          title="Erro ao carregar ordens de serviço"
          description="Verifique se o backend está rodando e tente novamente."
        />
      )}

      {ordens?.length === 0 && (
        <EmptyState
          title="Nenhuma O.S. encontrada"
          description="Ajuste os filtros ou crie uma nova."
        />
      )}

      {ordens && ordens.length > 0 && (
        <ResponsiveList
          table={<TabelaOS ordens={ordens} />}
          cards={ordens.map((os) => (
            <CardOS
              key={os.id}
              os={os}
              perfil={usuario.perfil}
              onVisualizar={(id) => router.push(`/os/${id}`)}
              onEditar={(id) => router.push(`/os/${id}/editar`)}
              onExcluir={() => abrirExcluir(os)}
              onCancelar={() => abrirCancelar(os)}
              onAtividadePortal={abrirAtividade}
              onPagamento={() => abrirPagamento(os)}
            />
          ))}
        />
      )}

      <ModalPagamento state={modal?.tipo === 'pagamento' ? modal.data : null} onClose={fechar} />
      <ModalExcluirOS state={modal?.tipo === 'excluir' ? modal.data : null} onClose={fechar} />
      <ModalCancelarOS state={modal?.tipo === 'cancelar' ? modal.data : null} onClose={fechar} />
      <ModalAtividadePortal
        osId={modal?.tipo === 'atividade' ? modal.osId : null}
        onClose={fechar}
      />
      <ModalReordenarOS
        open={reordenarAberto}
        onClose={() => setReordenarAberto(false)}
        modulo={modulo}
        grupo={filtro.grupo}
      />
    </div>
  )
}
