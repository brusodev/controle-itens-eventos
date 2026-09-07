import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriasAPI } from '../api'
import type { CategoriaForm } from '../schema'

/** Um único caminho de submit para criar e editar — mesmo padrão de useSalvarOS. */
export function useSalvarCategoria(id?: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dados: CategoriaForm) => (id ? categoriasAPI.atualizar(id, dados) : categoriasAPI.criar(dados)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
    },
  })
}
