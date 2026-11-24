'use client'

import { useActionState, useState } from 'react'
import { editarActividad } from '@/lib/acciones'
import { btn, btnSecundario, campo } from '@/components/estilos'
import type { TareaExcel } from '@/lib/excel'

type Fila = {
  clave: string
  nombre: string
  horas: string
  notas: string
  noAntesDe: string
  color: string
  finalizada: string
}

function horasVisibles(horas: number): string {
  const redondeadas = Math.round(horas * 100) / 100
  return Number.isInteger(redondeadas) ? String(redondeadas) : String(redondeadas)
}

export function FormularioEditarActividad({
  proyectoId,
  actividadId,
  nombre,
  fechaInicio,
  tareasIniciales,
  archivoNombre,
}: {
  proyectoId: string
  actividadId: string
  nombre: string
  fechaInicio: string
  tareasIniciales: TareaExcel[]
  archivoNombre: string
}) {
  const [estado, accion, pending] = useActionState(editarActividad, null)
  const [archivo, setArchivo] = useState<string | null>(null)
  const [tareas, setTareas] = useState<Fila[]>(() =>
    tareasIniciales.map((tarea, indice) => ({
      clave: `${indice}-${tarea.nombre}`,
      nombre: tarea.nombre,
      horas: horasVisibles(tarea.horas),
      notas: tarea.notas,
      noAntesDe: tarea.noAntesDe ?? '',
      color: tarea.color ?? '',
      finalizada: tarea.finalizada ? '1' : '',
    })),
  )

  function cambiar(clave: string, campoFila: keyof Omit<Fila, 'clave'>, valor: string) {
    setTareas((actuales) => actuales.map((tarea) => (tarea.clave === clave ? { ...tarea, [campoFila]: valor } : tarea)))
  }

  function mover(indice: number, destino: number) {
    setTareas((actuales) => {
      if (destino < 0 || destino >= actuales.length) return actuales
      const copia = [...actuales]
      const [fila] = copia.splice(indice, 1)
      copia.splice(destino, 0, fila)
      return copia
    })
  }

  return (
    <form className="space-y-6" action={accion}>
      <input type="hidden" name="proyectoId" value={proyectoId} />
      <input type="hidden" name="actividadId" value={actividadId} />
      <label className="block space-y-2">
        <span className="text-sm font-medium">Nombre de la actividad</span>
        <input name="nombre" required minLength={2} maxLength={140} defaultValue={nombre} className={campo} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Fecha de inicio</span>
        <input name="fechaInicio" type="date" required defaultValue={fechaInicio} className={campo} />
        <span className="block text-sm text-muted">Cambiar esta fecha rearma el calendario desde el nuevo día.</span>
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Tareas</h2>
          <button
            type="button"
            className={btnSecundario}
            onClick={() =>
              setTareas((actuales) => [
                ...actuales,
                { clave: `nueva-${actuales.length}-${Date.now()}`, nombre: '', horas: '', notas: '', noAntesDe: '', color: '', finalizada: '' },
              ])
            }
          >
            Agregar tarea
          </button>
        </div>
        <ul className="space-y-3">
          {tareas.map((tarea, indice) => (
            <li key={tarea.clave} className="rounded-2xl border border-line bg-soft/40 p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem]">
                <label className="block space-y-1">
                  <span className="text-xs text-muted">Tarea {indice + 1}</span>
                  <input
                    name="tareaNombre"
                    value={tarea.nombre}
                    onChange={(event) => cambiar(tarea.clave, 'nombre', event.target.value)}
                    className={campo}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-muted">Horas</span>
                  <input
                    name="tareaHoras"
                    inputMode="decimal"
                    value={tarea.horas}
                    onChange={(event) => cambiar(tarea.clave, 'horas', event.target.value)}
                    className={campo}
                  />
                </label>
              </div>
              <input type="hidden" name="tareaNoAntesDe" value={tarea.noAntesDe} />
              <input type="hidden" name="tareaColor" value={tarea.color} />
              <input type="hidden" name="tareaFinalizada" value={tarea.finalizada} />
              <label className="mt-3 block space-y-1">
                <span className="text-xs text-muted">Notas</span>
                <input
                  name="tareaNotas"
                  value={tarea.notas}
                  onChange={(event) => cambiar(tarea.clave, 'notas', event.target.value)}
                  className={campo}
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <button type="button" className="text-pine hover:underline" onClick={() => mover(indice, indice - 1)} disabled={indice === 0}>
                  Subir
                </button>
                <button
                  type="button"
                  className="text-pine hover:underline"
                  onClick={() => mover(indice, indice + 1)}
                  disabled={indice === tareas.length - 1}
                >
                  Bajar
                </button>
                <button
                  type="button"
                  className="text-accent hover:underline"
                  onClick={() => setTareas((actuales) => actuales.filter((fila) => fila.clave !== tarea.clave))}
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-line bg-soft/60 px-4 py-6 text-center">
        <input
          name="archivo"
          type="file"
          accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={(event) => setArchivo(event.target.files?.[0]?.name ?? null)}
        />
        <span className="font-medium">{archivo ?? 'Reemplazar el Excel'}</span>
        <span className="mt-1 text-sm text-muted">
          El archivo actual es {archivoNombre}. Si subes otro, sustituye la lista de tareas.
        </span>
      </label>

      {estado?.error ? <p className="rounded-2xl bg-holiday px-4 py-3 text-sm leading-6 text-ink">{estado.error}</p> : null}
      <button type="submit" className={btn} disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar actividad'}
      </button>
    </form>
  )
}
