import { forwardRef, useId } from 'react'
import { Input } from './field'

/**
 * Autocomplete simples via <datalist> nativo — substitui os 8 <datalist>
 * hoje espalhados em index.html (eventos, locais, horários, datas,
 * justificativas, observações, responsáveis, setores), alimentados por
 * O.S. anteriores. Ver plano § Paridade.
 *
 * `forwardRef` é necessário para funcionar com react-hook-form `register()`,
 * que anexa a ref diretamente ao input não controlado.
 */
export const DataList = forwardRef<
  HTMLInputElement,
  { suggestions: string[] } & React.InputHTMLAttributes<HTMLInputElement>
>(function DataList({ suggestions, ...inputProps }, ref) {
  const listId = useId()
  return (
    <>
      <Input ref={ref} {...inputProps} list={listId} />
      <datalist id={listId}>
        {suggestions.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
    </>
  )
})
