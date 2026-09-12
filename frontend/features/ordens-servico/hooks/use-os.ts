import { useQuery } from '@tanstack/react-query'
import { osAPI } from '../api'

/**
 * Busca uma O.S. persistida por id. Extraído de `FormularioOS` (que usava
 * essa query inline) para ser reaproveitado pela tela de detalhe — mesma
 * `queryKey`, então `useSalvarOS` já invalida os dois consumidores após
 * criar/editar, sem trabalho extra.
 */
export function useOS(osId: number | undefined) {
  return useQuery({
    queryKey: ['ordens-servico', osId],
    queryFn: () => osAPI.obter(osId!),
    enabled: !!osId,
  })
}
