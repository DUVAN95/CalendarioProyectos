'use client'

import { useActionState, useState } from 'react'
import { editarActividad } from '@/lib/acciones'
import { btn, btnSecundario, campo } from '@/components/estilos'
import { ModalTarea } from '@/components/ModalTarea'
import type { TareaExcel } from '@/lib/excel'

type Fila = {
  clave: string
  nombre: string
  horas: string
  notas: string
  noAntesDe: string
  color: string
  finalizada: string
  manual: string
  creadaEn: number
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
  const [creando, setCreando] = useState(false)
  const [tareas, setTareas] = useState<Fila[]>(() =>
    tareasIniciales.map((tarea, indice) => ({
      clave: `${indice}-${tarea.nombre}`,
      nombre: tarea.nombre,
      horas: horasVisibles(tarea.horas),
      notas: tarea.notas,
      noAntesDe: tarea.noAntesDe ?? '',
      color: tarea.color ?? '',
      finalizada: tarea.finalizada ? '1' : '',
      manual: tarea.manual === true ? '1' : tarea.manual === false ? '0' : '',
      creadaEn: indice,
    })),
  )
  const visibles = tareas
    .map((tarea, indice) => ({ tarea, indice }))
    .sort((a, b) => b.tarea.creadaEn - a.tarea.creadaEn || b.indice - a.indice)

  function cambiar(clave: string, campoFila: 'nombre' | 'horas' | 'notas', valor: string) {
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
    <>
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
          <div>
            <h2 className="font-display text-2xl">Tareas</h2>
            <p className="text-sm text-muted">Las más recientes aparecen primero. El puesto es el orden en el calendario.</p>
          </div>
          <button type="button" className={btnSecundario} onClick={() => setCreando(true)}>
            Agregar tarea
          </button>
        </div>
        <div className="hidden" aria-hidden>
          {tareas.map((tarea) => (
            <div key={tarea.clave}>
              <input type="hidden" name="tareaNombre" value={tarea.nombre} />
              <input type="hidden" name="tareaHoras" value={tarea.horas} />
              <input type="hidden" name="tareaNotas" value={tarea.notas} />
              <input type="hidden" name="tareaNoAntesDe" value={tarea.noAntesDe} />
              <input type="hidden" name="tareaColor" value={tarea.color} />
              <input type="hidden" name="tareaFinalizada" value={tarea.finalizada} />
              <input type="hidden" name="tareaManual" value={tarea.manual} />
            </div>
          ))}
        </div>
        <ul className="space-y-3">
          {visibles.map(({ tarea, indice }) => (
            <li key={tarea.clave} className="rounded-2xl border border-line bg-soft/40 p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem]">
                <label className="block space-y-1">
                  <span className="text-xs text-muted">Puesto {indice + 1} en el calendario</span>
                  <input
                    value={tarea.nombre}
                    onChange={(event) => cambiar(tarea.clave, 'nombre', event.target.value)}
                    className={campo}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-muted">Horas</span>
                  <input
                    inputMode="decimal"
                    value={tarea.horas}
                    onChange={(event) => cambiar(tarea.clave, 'horas', event.target.value)}
                    className={campo}
                  />
                </label>
              </div>
              <label className="mt-3 block space-y-1">
                <span className="text-xs text-muted">Notas</span>
                <input
                  value={tarea.notas}
                  onChange={(event) => cambiar(tarea.clave, 'notas', event.target.value)}
                  className={campo}
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <button type="button" className="text-pine hover:underline" onClick={() => mover(indice, indice - 1)} disabled={indice === 0}>
                  Adelantar
                </button>
                <button
                  type="button"
                  className="text-pine hover:underline"
                  onClick={() => mover(indice, indice + 1)}
                  disabled={indice === tareas.length - 1}
                >
                  Atrasar
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
    {creando ? (
      <ModalTarea
        titulo="Nueva tarea"
        detalle="Aparece primera en esta lista. En el calendario queda al final, hasta que la adelantes."
        inicial={{ nombre: '', horas: '', notas: '' }}
        confirmarTexto="Crear tarea"
        onCerrar={() => setCreando(false)}
        onGuardar={(tarea) => {
          setTareas((actuales) => [
            ...actuales,
            {
              clave: `nueva-${Date.now()}-${actuales.length}`,
              nombre: tarea.nombre,
              horas: horasVisibles(tarea.horas),
              notas: tarea.notas,
              noAntesDe: '',
              color: '',
              finalizada: '',
              manual: '1',
              creadaEn: Date.now(),
            },
          ])
          setCreando(false)
        }}
      />
    ) : null}
    </>
  )
}
