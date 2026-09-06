'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Field, Textarea } from '@/components/ui/field'
import { useAcoesOS } from '../../hooks/use-acoes-os'

export interface ExcluirOSState {
  osId: number
  numeroOS: string
}

/**
 * Porta de excluirOS() em ordens-servico.js:463-501 — que hoje encadeia dois
 * window.confirm() + um window.prompt() para o motivo (todos proibidos nas
 * preferências do projeto). Aqui vira um único modal: a mensagem de risco e
 * o campo de motivo (ainda obrigatório — a auditoria depende dele) ficam
 * visíveis juntos, sem bloquear a thread.
 */
export function ModalExcluirOS({
  state,
  onClose,
}: {
  state: ExcluirOSState | null
  onClose: () => void
}) {
  return (
    <Modal open={state !== null} onClose={onClose} title="Excluir Ordem de Serviço">
      {state && <FormularioExclusao key={state.osId} state={state} onClose={onClose} />}
    </Modal>
  )
}

function FormularioExclusao({ state, onClose }: { state: ExcluirOSState; onClose: () => void }) {
  const { excluir } = useAcoesOS()
  const [motivo, setMotivo] = useState('')
  const motivoValido = motivo.trim().length > 0

  function confirmarExclusao() {
    if (!motivoValido) return
    excluir.mutate({ id: state.osId, motivo: motivo.trim() }, { onSuccess: onClose })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md bg-danger-subtle p-3 text-sm text-danger">
        <p className="font-semibold">Esta ação não pode ser desfeita.</p>
        <p>
          Excluir a O.S. {state.numeroOS} reverte automaticamente o estoque e remove todos os
          dados vinculados a ela.
        </p>
      </div>
      <Field label="Motivo da exclusão" required hint="Registrado na auditoria.">
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
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={confirmarExclusao}
          disabled={!motivoValido}
          loading={excluir.isPending}
        >
          Excluir O.S.
        </Button>
      </div>
    </div>
  )
}
