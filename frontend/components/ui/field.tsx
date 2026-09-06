import { forwardRef, useId } from 'react'
import { cn } from '@/lib/cn'

export interface FieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: (id: string, describedBy: string | undefined) => React.ReactNode
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
      {children(id, describedBy)}
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
  'placeholder:text-text-muted focus-visible:border-primary disabled:opacity-50'

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(inputBaseClasses, className)} {...props} />
  },
)

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(inputBaseClasses, className)} {...props}>
      {children}
    </select>
  )
})

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(inputBaseClasses, 'min-h-24 resize-y py-2', className)}
      {...props}
    />
  )
})
