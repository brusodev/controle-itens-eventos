import { useEffect, useRef, useState } from 'react'
import type { OSForm } from '@/features/ordens-servico/schema'
import { pedidosGraficosAPI } from '../api'
import { mesclarPedidosParaOS } from '../mesclar-para-os'
import type { PedidoGrafico } from '../schema'

const CHAVE_SESSION = 'pedidosGraficosOrigemIds'

function lerIdsDaSessao(): number[] {
  const bruto = sessionStorage.getItem(CHAVE_SESSION)
  if (!bruto) return []
  sessionStorage.removeItem(CHAVE_SESSION)
  try {
    const parsed = JSON.parse(bruto)
    return Array.isArray(parsed) ? parsed.map(Number) : []
  } catch {
    return []
  }
}

/**
 * Lê os ids gravados por PainelPedidos ao clicar "Emitir O.S." / "Emitir
 * O.S. única", busca os pedidos, mescla nos campos de uma O.S. e devolve o
 * que falta para vincular depois de criada — porta de
 * restaurarPedidosParaOS() (emitir-os.js:1573-1642).
 *
 * sessionStorage (não localStorage): esses ids servem só para a navegação
 * que está prestes a acontecer — diferente do rascunho de O.S., que é
 * intencionalmente persistente entre sessões.
 *
 * `jaLido` é necessário por causa do StrictMode (dev): o efeito monta,
 * desmonta e remonta. `lerIdsDaSessao()` já REMOVE a chave ao ler — ela não
 * sobrevive a uma segunda leitura na remontagem. A trava garante que só a
 * primeira montagem lê e dispara a busca; deliberadamente NÃO cancelamos o
 * fetch em voo no cleanup (diferente do padrão usual) — cancelar aqui
 * descartaria o único resultado que a remontagem poderia aproveitar, já que
 * a segunda montagem não tem mais a chave para ler de novo. Aplicar o
 * patch numa instância desmontada do hook não é um problema real: o
 * consumidor (FormularioOS) permanece montado durante a troca de
 * StrictMode, só este hook interno é afetado.
 */
export function usePedidosOrigem() {
  const [pedidoIds, setPedidoIds] = useState<number[]>([])
  const [patch, setPatch] = useState<Partial<OSForm> | null>(null)
  const [carregando, setCarregando] = useState(false)
  const jaLido = useRef(false)

  useEffect(() => {
    if (jaLido.current) return
    const ids = lerIdsDaSessao()
    if (ids.length === 0) return
    jaLido.current = true

    async function buscarEMesclar() {
      setCarregando(true)
      const resultados = await Promise.all(ids.map((id) => pedidosGraficosAPI.obter(id).catch(() => null)))

      // Descarta o que sumiu ou já saiu de 'pendente' (pode ter mudado noutra aba).
      const pedidos = resultados.filter((p): p is PedidoGrafico => p !== null && p.status === 'pendente')
      setCarregando(false)
      if (pedidos.length === 0) return

      setPedidoIds(pedidos.map((p) => p.id))
      const mesclado = mesclarPedidosParaOS(pedidos)
      setPatch({
        setorSolicitante: mesclado.setorSolicitante || null,
        dataPedido: mesclado.dataPedido || null,
        dataEntrega: mesclado.prazoEntrega || null,
        justificativa: mesclado.justificativa || null,
        observacoes: mesclado.observacoes || null,
        itens: mesclado.itens,
      })
    }

    buscarEMesclar()
  }, [])

  return { pedidoIds, patch, carregando }
}
