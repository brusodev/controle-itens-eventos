'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Field, Textarea } from '@/components/ui/field'
import { useAcoesOS } from '../../hooks/use-acoes-os'

export interface CancelarOSState {
  osId: number
  numeroOS: string
}

/** Motivo é obrigatório no backend (os_routes.py:1035) — mesmo padrão de ModalExcluirOS. */
export function ModalCancelarOS({
  state,
  onClose,
}: {
  state: CancelarOSState | null
  onClose: () => void
}) {
  return (
    <Modal open={state !== null} onClose={onClose} title="Cancelar Ordem de Serviço">
      {state && <FormularioCancelamento key={state.osId} state={state} onClose={onClose} />}
    </Modal>
  )
}

function FormularioCancelamento({
  state,
  onClose,
}: {
  state: CancelarOSState
  onClose: () => void
}) {
  const { cancelar } = useAcoesOS()
  const [motivo, setMotivo] = useState('')
  const motivoValido = motivo.trim().length > 0

  function confirmarCancelamento() {
    if (!motivoValido) return
    cancelar.mutate({ id: state.osId, motivo: motivo.trim() }, { onSuccess: onClose })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-muted">
        Cancelar a O.S. {state.numeroOS} após o aceite da empresa. Esta ação não pode ser desfeita.
      </p>
      <Field label="Motivo do cancelamento" required>
        {(id, describedBy) => (
          <Textarea
            id={id}
            aria-describedby={describedBy}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            autoFocus
          />
        )}
      </Field>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Voltar
        </Button>
        <Button
          variant="danger"
          onClick={confirmarCancelamento}
          disabled={!motivoValido}
          loading={cancelar.isPending}
        >
          Confirmar cancelamento
        </Button>
      </div>
    </div>
  )
}
