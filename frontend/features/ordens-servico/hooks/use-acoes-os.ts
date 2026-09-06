import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api-error'
import { osAPI } from '../api'

/**
 * Mutações das ações da lista (exceto salvar, que é useSalvarOS — a peça
 * unificada de criar/editar). Cada mutação invalida a lista para refletir
 * o novo estado sem refetch manual espalhado pelos componentes.
 */
export function useAcoesOS() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
  }

  function tratarErro(error: unknown) {
    const message = error instanceof ApiError ? error.message : 'Erro inesperado.'
    showToast(message, 'error')
  }

  const excluir = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo?: string }) => osAPI.excluir(id, motivo),
    onSuccess: () => {
      invalidar()
      showToast('O.S. excluída.', 'success')
    },
    onError: tratarErro,
  })

  const cancelar = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => osAPI.cancelar(id, motivo),
    onSuccess: () => {
      invalidar()
      showToast('O.S. cancelada.', 'success')
    },
    onError: tratarErro,
  })

  const registrarPagamento = useMutation({
    mutationFn: ({
      id,
      vencimento,
      pago,
    }: {
      id: number
      vencimento: string | null
      pago: boolean
    }) => osAPI.registrarPagamento(id, vencimento, pago),
    onSuccess: () => {
      invalidar()
      showToast('Pagamento atualizado.', 'success')
    },
    onError: tratarErro,
  })

  const enviarParaEmpresa = useMutation({
    mutationFn: (id: number) => osAPI.enviarParaEmpresa(id),
    onSuccess: () => {
      invalidar()
      showToast('O.S. enviada à empresa.', 'success')
    },
    onError: tratarErro,
  })

  return { excluir, cancelar, registrarPagamento, enviarParaEmpresa }
}
