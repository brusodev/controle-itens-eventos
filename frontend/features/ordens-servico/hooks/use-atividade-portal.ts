import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { osAPI } from '../api'

export function useAtividadePortal(osId: number | null) {
  return useQuery({
    queryKey: ['ordens-servico', osId, 'atividade-portal'],
    queryFn: () => osAPI.atividadePortal(osId!),
    enabled: osId !== null,
  })
}

export function useResponderAtividade(osId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (texto: string) => osAPI.comentar(osId, texto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico', osId, 'atividade-portal'] })
    },
  })
}
