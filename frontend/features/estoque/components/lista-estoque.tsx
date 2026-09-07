'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatarCategoriaAlimentacao } from '@/lib/formatters'
import { useUsuarioAtual } from '@/features/auth/hooks/use-usuario-atual'
import { getModuloConfig } from '@/features/modulos/config'
import { useModulo } from '@/features/modulos/modulo-context'
import { useDadosAlimentacao } from '../hooks/use-dados-alimentacao'
import { useExcluirItem } from '../hooks/use-excluir-item'
import type { ItemEstoque } from '../schema'
import { CardItemEstoque } from './card-item-estoque'
import { ModalEditarItem, type EditarItemState } from './modal-editar-item'
import { ModalNovoItem } from './modal-novo-item'

/**
 * Orquestrador da tela /estoque — porta de renderizarItensAlimentacao/
 * filtrarAlimentacao (estoque.js:92-215). A aba "Estoque" legada (código
 * morto, array local sem API) não é portada — só a aba Alimentação, que é
 * a tela real.
 */
export function ListaEstoque() {
  const { modulo } = useModulo()
  const { data: usuario } = useUsuarioAtual()
  const { data: dadosAlimentacao, isLoading, isError } = useDadosAlimentacao(modulo)
  const excluir = useExcluirItem()
  const config = getModuloConfig(modulo)

  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [editando, setEditando] = useState<EditarItemState | null>(null)
  const [novoItemAberto, setNovoItemAberto] = useState(false)
  const [excluindo, setExcluindo] = useState<{ item: ItemEstoque } | null>(null)

  const categorias = useMemo(() => (dadosAlimentacao ? Object.keys(dadosAlimentacao).sort() : []), [dadosAlimentacao])

  const itensFiltrados = useMemo(() => {
    if (!dadosAlimentacao) return []
    const buscaNormalizada = busca.toLowerCase()
    const lista: { item: ItemEstoque; categoriaNome: string }[] = []
    for (const cat of categorias) {
      if (categoriaFiltro && categoriaFiltro !== cat) continue
      for (const item of dadosAlimentacao[cat].itens) {
        if (buscaNormalizada && !item.descricao.toLowerCase().includes(buscaNormalizada)) continue
        lista.push({ item, categoriaNome: cat })
      }
    }
    return lista
  }, [dadosAlimentacao, categorias, busca, categoriaFiltro])

  if (!usuario) return null
  const ehAdmin = usuario.perfil === 'admin'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">{config.itemLabel}</h1>
        <Button size="sm" onClick={() => setNovoItemAberto(true)}>
          Adicionar Item
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Buscar item..." value={busca} onChange={(e) => setBusca(e.target.value)} className="max-w-xs" />
        <Select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} className="min-w-52">
          <option value="">Todas as categorias</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat}>
              {formatarCategoriaAlimentacao(cat)}
            </option>
          ))}
        </Select>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {isError && <EmptyState title="Erro ao carregar itens" />}

      {dadosAlimentacao && itensFiltrados.length === 0 && <EmptyState title="Nenhum item encontrado" />}

      {dadosAlimentacao && itensFiltrados.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {itensFiltrados.map(({ item, categoriaNome }) => (
            <CardItemEstoque
              key={item.id}
              item={item}
              categoriaNome={categoriaNome}
              categoria={dadosAlimentacao[categoriaNome]}
              regioesConfig={config.regioes}
              ehAdmin={ehAdmin}
              onEditar={() => setEditando({ item, categoriaNome })}
              onExcluir={() => setExcluindo({ item })}
            />
          ))}
        </div>
      )}

      <ModalEditarItem state={editando} regioesConfig={config.regioes} ehAdmin={ehAdmin} onClose={() => setEditando(null)} />

      {dadosAlimentacao && (
        <ModalNovoItem
          open={novoItemAberto}
          onClose={() => setNovoItemAberto(false)}
          modulo={modulo}
          dadosAlimentacao={dadosAlimentacao}
        />
      )}

      <ConfirmDialog
        open={excluindo !== null}
        title="Excluir item?"
        description={
          excluindo
            ? `Excluir "${excluindo.item.descricao}"? Se este item estiver em alguma O.S., a exclusão será bloqueada pelo sistema.`
            : ''
        }
        confirmLabel="Excluir"
        danger
        onConfirm={() => {
          if (excluindo) excluir.mutate(excluindo.item.id)
          setExcluindo(null)
        }}
        onCancel={() => setExcluindo(null)}
      />
    </div>
  )
}
