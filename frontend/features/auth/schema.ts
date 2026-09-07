import { z } from 'zod'

/** Espelha Usuario.to_dict() em backend/models.py:531. */
export const usuarioSchema = z.object({
  id: z.number(),
  nome: z.string(),
  email: z.string(),
  cargo: z.string().nullable(),
  perfil: z.enum(['admin', 'comum', 'empresa']),
  detentora_id: z.number().nullable(),
  ativo: z.boolean(),
  modulosPermitidos: z.array(z.string()),
})

export type Usuario = z.infer<typeof usuarioSchema>
export type Perfil = Usuario['perfil']

/** Porta de formularioLogin em backend/templates/login.html:71-122. */
export const loginFormSchema = z.object({
  email: z.string().min(1, 'Email é obrigatório.'),
  senha: z.string().min(1, 'Senha é obrigatória.'),
  lembrar: z.boolean(),
})

export type LoginForm = z.infer<typeof loginFormSchema>

export const EMPTY_LOGIN_FORM: LoginForm = {
  email: '',
  senha: '',
  lembrar: false,
}

/** Resposta de POST /auth/login (auth_routes.py:129-170). */
export const loginResponseSchema = z.object({
  sucesso: z.boolean(),
  usuario: usuarioSchema,
})

export type LoginResponse = z.infer<typeof loginResponseSchema>
