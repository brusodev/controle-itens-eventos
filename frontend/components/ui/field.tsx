import { forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface FieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  /**
   * `invalid` é passado como 3º argumento à render-prop — telas existentes
   * que só leem `(id, describedBy)` continuam funcionando sem mudança; quem
   * quiser a borda de erro passa `invalid` para Input/Select/Textarea.
   */
  children: (id: string, describedBy: string | undefined, invalid: boolean) => React.ReactNode
}

/**
 * Envelope de label + erro + hint para inputs — cada input concreto (Input,
 * Select, Textarea) recebe o `id` e o `aria-describedby` já resolvidos, para
 * que label/erro fiquem associados ao campo por padrão (§ Acessibilidade).
 */
export function Field({ label, error, hint, required, children }: FieldProps) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined
  const hintId = hint ? `${id}-hint` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
        {required && (
          <span className="text-danger-strong" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children(id, describedBy, Boolean(error))}
      {hint && !error && (
        <p id={hintId} className="text-xs text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger-strong">
          {error}
        </p>
      )}
    </div>
  )
}

const inputBaseClasses =
  'h-11 rounded-md border border-border bg-surface px-3 text-sm text-text ' +
  'placeholder:text-text-muted transition-colors ' +
  'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 ' +
  'disabled:opacity-50'

/** Props em comum entre os 3 campos — `invalid` (de `Field`) pinta borda e liga `aria-invalid`. */
interface CampoInvalidoProps {
  invalid?: boolean
}

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & CampoInvalidoProps
>(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(inputBaseClasses, invalid && 'border-danger-strong focus-visible:ring-danger-strong/30', className)}
      {...props}
    />
  )
})

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & CampoInvalidoProps
>(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          inputBaseClasses,
          'w-full appearance-none pr-9',
          invalid && 'border-danger-strong focus-visible:ring-danger-strong/30',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
        strokeWidth={1.75}
      />
    </div>
  )
})

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & CampoInvalidoProps
>(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        inputBaseClasses,
        'min-h-24 resize-y py-2',
        invalid && 'border-danger-strong focus-visible:ring-danger-strong/30',
        className,
      )}
      {...props}
    />
  )
})
