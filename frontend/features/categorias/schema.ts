import { z } from 'zod'
import { MODULOS } from '@/features/modulos/config'

/**
 * Espelha Categoria.to_dict() em backend/models.py:43. `tipo` é o slug
 * técnico (imutável após criação — ver ModalCategoria), gerado a partir do
 * nome via normalizarSlug() (porta de atualizarSlugCategoria em
 * categorias.js:121).
 */
export const categoriaSchema = z.object({
  id: z.number().optional(), // ausente na criação
  nome: z.string().min(1, 'Nome é obrigatório.'),
  tipo: z
    .string()
    .min(1, 'Identificador é obrigatório.')
    .regex(/^[a-z0-9_]+$/, 'Apenas letras minúsculas, números e underscore.'),
  natureza: z.string().nullable().optional(),
  modulo: z.enum(MODULOS),
  icone: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
})

export type CategoriaForm = z.infer<typeof categoriaSchema>
export type Categoria = CategoriaForm & { id: number }

/** `EMPTY_CATEGORIA` fora do componente — reset limpo do modal (preferência global). */
export const EMPTY_CATEGORIA: CategoriaForm = {
  nome: '',
  tipo: '',
  natureza: '',
  modulo: 'coffee',
  icone: '',
  descricao: '',
}

/**
 * Normaliza um nome em slug técnico — porta fiel de atualizarSlugCategoria
 * (categorias.js:121-134): remove acentos (NFD), troca não-alfanumérico por
 * "_", colapsa underscores repetidos, remove das bordas.
 */
// U+0300–U+036F (combining diacritical marks), escritos como \uXXXX em vez de
// caractere literal no arquivo — evita qualquer ambiguidade de encoding ao
// salvar/ler este arquivo fonte.
const DIACRITICOS = /[\u0300-\u036f]/g

export function normalizarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICOS, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}
