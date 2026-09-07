import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { authAPI } from '@/features/auth/api'

/** Porta de fazerLogout() em layout_parts.html — troca window.confirm() por ConfirmDialog. */
export function ModalConfirmarLogout({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ConfirmDialog
      open={open}
      title="Sair do sistema?"
      description="Você precisará fazer login novamente para continuar."
      confirmLabel="Sair"
      danger
      onConfirm={authAPI.logout}
      onCancel={onClose}
    />
  )
}
