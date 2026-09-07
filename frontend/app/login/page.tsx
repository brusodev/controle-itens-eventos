import { FormularioLogin } from '@/features/auth/components/formulario-login'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-sm rounded-lg bg-surface p-8 shadow-lg">
        <header className="mb-6 text-center">
          <h1 className="text-xl font-bold text-text">Bem-vindo de volta!</h1>
          <p className="text-sm text-text-muted">Controle de Itens de Eventos</p>
        </header>

        <FormularioLogin />

        <p className="mt-6 text-center text-xs text-text-muted">
          Problemas para acessar? Entre em contato com o administrador.
        </p>
      </div>
    </div>
  )
}
