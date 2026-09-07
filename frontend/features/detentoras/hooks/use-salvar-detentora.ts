import { useMutation, useQueryClient } from '@tanstack/react-query'
import { detentorasAPI } from '../api'
import type { DetentoraForm } from '../schema'

export function useSalvarDetentora(id?: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dados: DetentoraForm) => (id ? detentorasAPI.atualizar(id, dados) : detentorasAPI.criar(dados)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detentoras'] })
    },
  })
}
