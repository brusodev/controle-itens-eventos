'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Field, Textarea } from '@/components/ui/field'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api-error'
import { useCancelarPedido } from '../hooks/use-cancelar-pedido'
import type { PedidoGrafico } from '../schema'

/**
 * Motivo do cancelamento — porta de cancelarPedidoGraficoUI() (pedidos-
 * graficos.js:220), que usava `prompt()` (proibido nas preferências do
 * projeto). Vira um campo de texto num modal de verdade.
 */
export function ModalCancelarPedido({ pedido, onClose }: { pedido: PedidoGrafico | null; onClose: () => void }) {
  const [motivo, setMotivo] = useState('')
  const cancelar = useCancelarPedido()
  const { showToast } = useToast()

  function fechar() {
    setMotivo('')
    onClose()
  }

  function confirmar() {
    if (!pedido || !motivo.trim()) return
    cancelar.mutate(
      { id: pedido.id, motivo: motivo.trim() },
      {
        onSuccess: () => {
          showToast('Pedido cancelado.')
          fechar()
        },
        onError: (error) => {
          showToast(error instanceof ApiError ? error.message : 'Erro ao cancelar pedido.', 'error')
        },
      },
    )
  }

  return (
    <Modal open={pedido !== null} onClose={fechar} title="Cancelar pedido">
      {pedido && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">
            Cancelando o pedido de <strong className="text-text">{pedido.solicitante}</strong>: {pedido.descricao}
          </p>
          <Field label="Motivo do cancelamento" required>
            {(id) => (
              <Textarea id={id} rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Explique o motivo..." />
            )}
          </Field>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={fechar}>
              Voltar
            </Button>
            <Button variant="danger" onClick={confirmar} loading={cancelar.isPending} disabled={!motivo.trim()}>
              Confirmar cancelamento
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
