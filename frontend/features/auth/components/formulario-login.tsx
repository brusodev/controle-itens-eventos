'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { ApiError } from '@/lib/api-error'
import { useLogin } from '../hooks/use-login'
import { EMPTY_LOGIN_FORM } from '../schema'

const CHAVE_EMAIL_LEMBRADO = 'email'

function lerEmailLembrado(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(CHAVE_EMAIL_LEMBRADO) ?? ''
  } catch {
    return ''
  }
}

/**
 * Porta de formularioLogin em backend/templates/login.html:71-138.
 * "Lembrar-me" só persiste o e-mail (nunca a senha), como no original.
 */
export function FormularioLogin() {
  const login = useLogin()
  const emailLembrado = lerEmailLembrado()

  const [form, setForm] = useState({
    ...EMPTY_LOGIN_FORM,
    email: emailLembrado,
    lembrar: emailLembrado !== '',
  })
  const [erro, setErro] = useState('')

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setErro('')

    if (!form.email.trim() || !form.senha) {
      setErro('Por favor, preencha todos os campos.')
      return
    }

    login.mutate(
      { email: form.email.trim(), senha: form.senha },
      {
        onSuccess: (resposta) => {
          try {
            if (form.lembrar) {
              window.localStorage.setItem(CHAVE_EMAIL_LEMBRADO, form.email.trim())
            } else {
              window.localStorage.removeItem(CHAVE_EMAIL_LEMBRADO)
            }
          } catch {
            // localStorage indisponível — "lembrar-me" é conveniência, não crítico.
          }
          // Navegação de página inteira: o destino (/dashboard ou /empresa)
          // ainda é servido pelo Flask (não migrado nesta fase) — um
          // router.push() do Next tentaria resolver como rota própria e
          // daria 404. Mesmo comportamento do login.html original.
          const destino = resposta.usuario.perfil === 'empresa' ? '/empresa' : '/dashboard'
          window.location.assign(destino)
        },
        onError: (error) => {
          setErro(error instanceof ApiError ? error.message : 'Erro ao conectar ao servidor.')
        },
      },
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {erro && (
        <p role="alert" className="rounded-md bg-danger-subtle px-3 py-2 text-sm text-danger">
          {erro}
        </p>
      )}

      <Field label="Email" required>
        {(id) => (
          <Input
            id={id}
            type="email"
            autoFocus
            autoComplete="username"
            placeholder="seu.email@empresa.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        )}
      </Field>

      <Field label="Senha" required>
        {(id) => (
          <Input
            id={id}
            type="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
          />
        )}
      </Field>

      <label className="flex items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          className="size-4.5"
          checked={form.lembrar}
          onChange={(e) => setForm({ ...form, lembrar: e.target.checked })}
        />
        Lembrar-me neste computador
      </label>

      <Button type="submit" loading={login.isPending} className="mt-2">
        Entrar
      </Button>
    </form>
  )
}
