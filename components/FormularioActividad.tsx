'use client'

import { useActionState, useState } from 'react'
import { crearActividad } from '@/lib/acciones'
import { btn, campo } from '@/components/estilos'

export function FormularioActividad({ proyectoId, fechaSugerida }: { proyectoId: string; fechaSugerida: string }) {
  const [estado, accion, pending] = useActionState(crearActividad, null)
  const [archivo, setArchivo] = useState<string | null>(null)

  return (
    <form className="space-y-5" action={accion}>
      <input type="hidden" name="proyectoId" value={proyectoId} />
      <label className="block space-y-2">
        <span className="text-sm font-medium">Nombre de la actividad</span>
        <input name="nombre" maxLength={140} className={campo} placeholder="Si lo dejas vacío, se usa el nombre del archivo" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Fecha de inicio</span>
        <input name="fechaInicio" type="date" required defaultValue={fechaSugerida} className={campo} />
        <span className="block text-sm text-muted">El reparto empieza ese día, o el siguiente día hábil si cae en festivo o fin de semana.</span>
      </label>
      <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-line bg-soft/60 px-4 py-8 text-center">
        <input
          name="archivo"
          type="file"
          required
          accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={(event) => setArchivo(event.target.files?.[0]?.name ?? null)}
        />
        <span className="font-medium">{archivo ?? 'Selecciona el Excel'}</span>
        <span className="mt-1 text-sm text-muted">Columnas: Tarea, Horas estimadas y, si quieres, Notas.</span>
      </label>
      {estado?.error ? <p className="rounded-2xl bg-holiday px-4 py-3 text-sm leading-6 text-ink">{estado.error}</p> : null}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className={btn} disabled={pending}>
          {pending ? 'Leyendo Excel…' : 'Generar calendario'}
        </button>
        <a href="/plantilla" className="text-sm font-medium text-pine hover:underline">
          Descargar plantilla
        </a>
      </div>
    </form>
  )
}
