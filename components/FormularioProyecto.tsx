'use client'

import { useActionState } from 'react'
import { crearProyecto, editarProyecto } from '@/lib/acciones'
import { btn, campo } from '@/components/estilos'

export function FormularioProyecto({
  id,
  nombre = '',
  descripcion = '',
}: {
  id?: string
  nombre?: string
  descripcion?: string
}) {
  const [estado, accion, pending] = useActionState(id ? editarProyecto : crearProyecto, null)

  return (
    <form className="space-y-5" action={accion}>
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <label className="block space-y-2">
        <span className="text-sm font-medium">Nombre</span>
        <input
          name="nombre"
          required
          minLength={2}
          maxLength={120}
          defaultValue={nombre}
          className={campo}
          placeholder="Implementación portal de clientes"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Descripción</span>
        <textarea
          name="descripcion"
          rows={4}
          maxLength={2000}
          defaultValue={descripcion}
          className={campo}
          placeholder="Opcional. Sirve para reconocer el proyecto cuando tenga varias actividades."
        />
      </label>
      {estado?.error ? <p className="rounded-2xl bg-holiday px-4 py-3 text-sm text-ink">{estado.error}</p> : null}
      <button type="submit" className={btn} disabled={pending}>
        {pending ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear proyecto'}
      </button>
    </form>
  )
}
