'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { brParaIso, isoParaBr } from '@/lib/data-br'
import { useAcoesOS } from '../../hooks/use-acoes-os'

export interface PagamentoModalState {
  osId: number
  vencimentoAtual: string | null
  pagoAtual: boolean
}

/** Porta de abrirModalPagamento/salvarPagamento em ordens-servico.js:1366-1454. */
export function ModalPagamento({
  state,
  onClose,
}: {
  state: PagamentoModalState | null
  onClose: () => void
}) {
  return (
    <Modal open={state !== null} onClose={onClose} title="Pagamento">
      {/* `key` força remount a cada O.S. diferente — o formulário sempre
          nasce com os valores certos, sem lógica de reidratação manual. */}
      {state && <FormularioPagamento key={state.osId} state={state} onClose={onClose} />}
    </Modal>
  )
}

function FormularioPagamento({
  state,
  onClose,
}: {
  state: PagamentoModalState
  onClose: () => void
}) {
  const { registrarPagamento } = useAcoesOS()
  const [vencimento, setVencimento] = useState(() => isoParaBr(state.vencimentoAtual))
  const [pago, setPago] = useState(state.pagoAtual)

  function salvar() {
    registrarPagamento.mutate(
      { id: state.osId, vencimento: brParaIso(vencimento), pago },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Data de vencimento da nota">
        {(id, describedBy) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            placeholder="dd/mm/aaaa"
            maxLength={10}
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
          />
        )}
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium text-text">
        <input
          type="checkbox"
          className="size-4.5 accent-success"
          checked={pago}
          onChange={(e) => setPago(e.target.checked)}
        />
        Nota já foi paga
      </label>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={salvar} loading={registrarPagamento.isPending}>
          Salvar
        </Button>
      </div>
    </div>
  )
}
