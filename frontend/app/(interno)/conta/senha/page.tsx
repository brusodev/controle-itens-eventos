import { FormularioSenha } from '@/features/conta/components/formulario-senha'

/** Porta de alterar-senha.html — o formulário e suas regras vivem no componente. */
export default function AlterarSenhaPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-text sm:text-2xl">Alterar Senha</h1>
        <p className="text-sm text-text-muted">Crie uma senha forte para proteger sua conta.</p>
      </header>

      <div className="rounded-lg border border-border-subtle bg-surface p-4 sm:p-6">
        <FormularioSenha />
      </div>
    </div>
  )
}
