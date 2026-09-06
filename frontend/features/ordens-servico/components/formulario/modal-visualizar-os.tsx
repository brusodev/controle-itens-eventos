import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import type { OSForm } from '../../schema'
import { PreviewOS } from './preview-os'

/** Porta do modal em index.html:257-267 (modal-visualizar-os). */
export function ModalVisualizarOS({
  dados,
  salvando,
  onConfirmar,
  onClose,
}: {
  dados: OSForm | null
  salvando: boolean
  onConfirmar: () => void
  onClose: () => void
}) {
  return (
    <Modal open={dados !== null} onClose={onClose} title="Visualizar O.S." className="sm:max-w-3xl">
      {dados && (
        <div className="flex flex-col gap-4">
          <PreviewOS dados={dados} />
          <div className="flex justify-center gap-3">
            <Button onClick={onConfirmar} loading={salvando}>
              Confirmar e Emitir
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Voltar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
