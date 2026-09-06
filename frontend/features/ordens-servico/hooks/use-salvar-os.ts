import { useMutation, useQueryClient } from '@tanstack/react-query'
import { osAPI } from '../api'
import type { OSForm } from '../schema'

/**
 * A peça central do plano (§ "A peça central: formulário unificado"): UMA
 * função de submit para criar E editar. Antes existiam dois caminhos
 * (emitir-os.js e ordens-servico.js) com payloads que podiam divergir — essa
 * era a causa raiz da família de bugs "campo não salva na edição". Aqui não
 * há como divergir: é a mesma mutação, o mesmo payload, os dois casos.
 */
export function useSalvarOS(osId?: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dados: OSForm) => (osId ? osAPI.atualizar(osId, dados) : osAPI.criar(dados)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
      if (osId) {
        queryClient.invalidateQueries({ queryKey: ['ordens-servico', osId] })
      }
    },
  })
}
