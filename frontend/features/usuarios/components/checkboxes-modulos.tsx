import { MODULOS_COM_LABEL } from '../schema'

/**
 * Os 6 checkboxes de módulo — porta de .modulo-permitido-cb
 * (gerenciar-usuarios.html:485-490).
 *
 * Nenhum marcado = sem restrição (mesma semântica de
 * Usuario.tem_acesso_modulo(), já usada no resto do projeto — nunca "sem
 * acesso a nada"). O aviso abaixo é o mesmo do legado, para não deixar essa
 * regra implícita.
 */
export function CheckboxesModulos({
  selecionados,
  onChange,
}: {
  selecionados: string[]
  onChange: (modulos: string[]) => void
}) {
  function alternar(modulo: string) {
    onChange(
      selecionados.includes(modulo) ? selecionados.filter((m) => m !== modulo) : [...selecionados, modulo],
    )
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-text">Módulos permitidos</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {MODULOS_COM_LABEL.map(({ modulo, label }) => (
          <label key={modulo} className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              className="size-4.5"
              checked={selecionados.includes(modulo)}
              onChange={() => alternar(modulo)}
            />
            {label}
          </label>
        ))}
      </div>
      <p className="text-xs text-text-muted">
        Nenhum módulo marcado = acesso a todos (padrão). Marque para restringir o usuário aos módulos selecionados.
      </p>
    </fieldset>
  )
}
