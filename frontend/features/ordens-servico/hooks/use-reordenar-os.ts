import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/toast'
import type { Modulo } from '@/features/modulos/config'
import { osAPI } from '../api'
import type { ReordenarLinha } from '../components/lista/reordenar-linha'

function numeroOrdenavel(numeroOS: string | null | undefined): number {
  const n = parseInt(String(numeroOS ?? '').replace(/\D/g, ''), 10)
  return Number.isNaN(n) ? Infinity : n
}

/** Lista do grupo em ordem crescente de numeração — porta de abrirModalReordenarOS (ordens-servico.js:1644). */
export function useOrdensParaReordenar(modulo: Modulo, grupo: string) {
  return useQuery({
    queryKey: ['ordens-servico', modulo, grupo, 'reordenar'],
    queryFn: async (): Promise<ReordenarLinha[]> => {
      const lista = await osAPI.listar(modulo, { grupo })
      return [...lista]
        .sort((a, b) => numeroOrdenavel(a.numeroOS) - numeroOrdenavel(b.numeroOS))
        .map((os) => ({
          id: os.id,
          numeroAtual: os.numeroOS ?? '',
          evento: os.evento,
          dataEmissao: os.dataEmissao,
        }))
    },
    enabled: grupo !== '',
  })
}

export function useSalvarReordenacao(modulo: Modulo, grupo: string) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (ordem: number[]) => osAPI.reordenar(modulo, grupo, ordem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
      showToast('O.S. renumeradas com sucesso.', 'success')
    },
    onError: () => showToast('Erro ao reordenar. Tente novamente.', 'error'),
  })
}
