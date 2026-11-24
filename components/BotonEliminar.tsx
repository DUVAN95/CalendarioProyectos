'use client'

import { useFormStatus } from 'react-dom'
import { btnPeligro } from '@/components/estilos'

function Boton({ children }: { children: string }) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" className={btnPeligro} disabled={pending}>
      {pending ? 'Eliminando…' : children}
    </button>
  )
}

export function BotonEliminar({
  action,
  children,
  confirmar,
}: {
  action: (formData: FormData) => void | Promise<void>
  children: string
  confirmar: string
}) {
  return (
    <form
      action={action}
      className="no-print"
      onSubmit={(event) => {
        if (!window.confirm(confirmar)) event.preventDefault()
      }}
    >
      <Boton>{children}</Boton>
    </form>
  )
}
