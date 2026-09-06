import { useState } from 'react'
import type { OSPersistida } from '../schema'
import type { PagamentoModalState } from '../components/lista/modal-pagamento'
import type { ExcluirOSState } from '../components/lista/modal-excluir-os'
import type { CancelarOSState } from '../components/lista/modal-cancelar-os'

// Estado único de modal — nunca flags soltas (preferência global do
// projeto). Um único `modal` diz qual está aberto e com quais dados.
export type ModalOSState =
  | { tipo: 'pagamento'; data: PagamentoModalState }
  | { tipo: 'excluir'; data: ExcluirOSState }
  | { tipo: 'cancelar'; data: CancelarOSState }
  | { tipo: 'atividade'; osId: number }
  | null

/** Centraliza a abertura dos 4 modais do card de O.S. a partir dos dados já carregados. */
export function useModalOS() {
  const [modal, setModal] = useState<ModalOSState>(null)
  const fechar = () => setModal(null)

  return {
    modal,
    fechar,
    abrirExcluir: (os: OSPersistida) =>
      setModal({ tipo: 'excluir', data: { osId: os.id, numeroOS: os.numeroOS ?? String(os.id) } }),
    abrirCancelar: (os: OSPersistida) =>
      setModal({ tipo: 'cancelar', data: { osId: os.id, numeroOS: os.numeroOS ?? String(os.id) } }),
    abrirAtividade: (osId: number) => setModal({ tipo: 'atividade', osId }),
    abrirPagamento: (os: OSPersistida) =>
      setModal({
        tipo: 'pagamento',
        data: {
          osId: os.id,
          vencimentoAtual: os.pagamentoVencimento ?? null,
          pagoAtual: os.pagamentoPago ?? false,
        },
      }),
  }
}
