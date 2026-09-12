import { apiFetch } from '@/lib/api'
import { debugLog } from '@/lib/debug-log'
import type { Modulo } from '@/features/modulos/config'
import { osSchema, type OSForm, type OSPersistida } from './schema'
import { atividadePortalSchema, comentarioSchema, type AtividadePortal, type Comentario } from './schema-atividade'

// `id` e `status` são exigidos aqui porque toda O.S. que volta da API já foi
// persistida — o parse falha alto (em vez de deixar `id: undefined` escapar
// para um componente) se o backend um dia parar de mandar algum dos dois.
const osPersistidaSchema = osSchema.extend({
  id: osSchema.shape.id.unwrap(),
  status: osSchema.shape.status.unwrap(),
})

/**
 * Chamadas de API do domínio O.S. — porta tipada da seção
 * "ORDENS DE SERVIÇO" de backend/static/js/api-client.js. Toda resposta
 * passa pelo schema Zod (não só um cast de tipo) — é a mesma fonte que
 * valida o formulário validando também o que a API de fato devolveu.
 */
export const osAPI = {
  async listar(
    modulo: Modulo,
    params: { busca?: string; grupo?: string; filtro?: string } = {},
  ): Promise<OSPersistida[]> {
    const query = new URLSearchParams()
    if (params.busca) query.set('busca', params.busca)
    if (params.grupo) query.set('grupo', params.grupo)
    if (params.filtro) query.set('filtro', params.filtro)
    const qs = query.toString()
    const data = await apiFetch<unknown[]>(`/api/ordens-servico/${qs ? `?${qs}` : ''}`, { modulo })

    // `safeParse` por item, não `.map(parse)`: um único registro que não bate
    // o schema (ex. O.S. antiga com campo divergente) não pode apagar a lista
    // inteira — foi exatamente esse o bug que zerava a listagem de Serviços
    // Gráficos (ver `evento` em schema.ts). Descarta só a linha inválida e
    // avisa em dev; `obter()`/`criar()`/`atualizar()` continuam com `.parse()`
    // porque ali é uma O.S. só, e renderizar pela metade é pior que falhar.
    const resultados = data.map((item) => osPersistidaSchema.safeParse(item))
    const invalidas = resultados.filter((resultado) => !resultado.success)
    if (invalidas.length > 0) {
      debugLog(`osAPI.listar: ${invalidas.length} de ${data.length} O.S. descartadas por schema inválido`, invalidas)
    }
    return resultados.flatMap((resultado) => (resultado.success ? [resultado.data] : []))
  },

  async obter(id: number): Promise<OSPersistida> {
    const data = await apiFetch<unknown>(`/api/ordens-servico/${id}`)
    return osPersistidaSchema.parse(data)
  },

  async criar(dados: OSForm): Promise<OSPersistida> {
    const data = await apiFetch<unknown>('/api/ordens-servico/', { method: 'POST', body: dados })
    return osPersistidaSchema.parse(data)
  },

  async atualizar(id: number, dados: OSForm): Promise<OSPersistida> {
    const data = await apiFetch<unknown>(`/api/ordens-servico/${id}`, { method: 'PUT', body: dados })
    return osPersistidaSchema.parse(data)
  },

  excluir(id: number, motivo?: string) {
    return apiFetch<void>(`/api/ordens-servico/${id}`, {
      method: 'DELETE',
      body: motivo ? { motivo } : undefined,
    })
  },

  cancelar(id: number, motivo: string) {
    // motivo é obrigatório no backend (os_routes.py:1035) — 400 sem ele.
    return apiFetch<void>(`/api/ordens-servico/${id}/cancelar`, {
      method: 'POST',
      body: { motivo },
    })
  },

  registrarPagamento(id: number, vencimento: string | null, pago: boolean) {
    // Payload exato de backend/routes/os_routes.py:846 (atualizar_pagamento) —
    // vencimento em ISO (yyyy-mm-dd); a conversão dd/mm/aaaa → ISO é feita no
    // componente que chama esta função (ver ModalPagamento).
    return apiFetch<{ sucesso: boolean }>(`/api/ordens-servico/${id}/pagamento`, {
      method: 'PUT',
      body: { pagamentoVencimento: vencimento, pagamentoPago: pago },
    })
  },

  enviarParaEmpresa(id: number) {
    return apiFetch<void>(`/api/ordens-servico/${id}/enviar-empresa`, { method: 'POST' })
  },

  reenviarParaEmpresa(id: number) {
    return apiFetch<void>(`/api/ordens-servico/${id}/reenviar-empresa`, { method: 'POST' })
  },

  reordenar(modulo: Modulo, grupo: string, ordem: number[]) {
    return apiFetch<void>('/api/ordens-servico/reordenar', {
      method: 'PUT',
      body: { modulo, grupo, ordem },
    })
  },

  proximoNumero(modulo: Modulo, grupo: string) {
    return apiFetch<{ proximoNumero: string }>(
      `/api/ordens-servico/proximo-numero?modulo=${modulo}&grupo=${encodeURIComponent(grupo)}`,
    )
  },

  /** Setores solicitantes já usados no módulo — alimenta o autocomplete de Transporte/Serviços Gráficos. */
  async setoresSolicitantes(modulo: Modulo): Promise<string[]> {
    const data = await apiFetch<{ success: boolean; setores: string[] }>(
      '/api/relatorios/setores-solicitantes',
      { modulo },
    )
    return data.setores
  },

  /** URLs de download server-side (ReportLab/openpyxl) — o browser baixa direto, sem passar por apiFetch. */
  urlPdf(id: number) {
    return `/api/ordens-servico/${id}/pdf`
  },
  urlPng(id: number) {
    return `/api/ordens-servico/${id}/png`
  },

  async atividadePortal(id: number): Promise<AtividadePortal> {
    const data = await apiFetch<unknown>(`/api/ordens-servico/${id}/atividade-portal`)
    return atividadePortalSchema.parse(data)
  },

  async comentar(id: number, texto: string): Promise<Comentario> {
    const data = await apiFetch<{ comentario: unknown }>(`/api/ordens-servico/${id}/comentar`, {
      method: 'POST',
      body: { texto },
    })
    return comentarioSchema.parse(data.comentario)
  },
}
