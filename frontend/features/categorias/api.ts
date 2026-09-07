import { apiFetch } from '@/lib/api'
import type { Modulo } from '@/features/modulos/config'
import { categoriaSchema, type Categoria, type CategoriaForm } from './schema'

const categoriaPersistidaSchema = categoriaSchema.extend({
  id: categoriaSchema.shape.id.unwrap(),
})

/**
 * Chamadas de API do domínio Categorias — porta tipada de categorias.js.
 * Usa a rota canônica /api/categorias/ (não a duplicata em
 * /api/alimentacao/categorias, que fixa tipo='alimentacao' e é usada só
 * pelo legado — ver plano § Domínio 1).
 */
export const categoriasAPI = {
  async listar(modulo: Modulo): Promise<Categoria[]> {
    const data = await apiFetch<unknown[]>('/api/categorias/', { modulo })
    return data.map((item) => categoriaPersistidaSchema.parse(item))
  },

  async obter(id: number): Promise<Categoria> {
    const data = await apiFetch<unknown>(`/api/categorias/${id}`)
    return categoriaPersistidaSchema.parse(data)
  },

  async criar(dados: CategoriaForm): Promise<Categoria> {
    const data = await apiFetch<unknown>('/api/categorias/', { method: 'POST', body: dados })
    return categoriaPersistidaSchema.parse(data)
  },

  async atualizar(id: number, dados: CategoriaForm): Promise<Categoria> {
    const data = await apiFetch<unknown>(`/api/categorias/${id}`, { method: 'PUT', body: dados })
    return categoriaPersistidaSchema.parse(data)
  },

  excluir(id: number) {
    return apiFetch<{ mensagem: string }>(`/api/categorias/${id}`, { method: 'DELETE' })
  },
}
