'use client'

import { useEffect, useRef, useState } from 'react'
import { guardarOrdenTareas, reemplazarTareas } from '@/lib/acciones'
import { Cronograma } from '@/components/Cronograma'
import { ModalTarea, type BorradorTarea } from '@/components/ModalTarea'
import { ReglasJornada } from '@/components/ReglasJornada'
import {
  colorMostrado,
  insertarTareaEnDia,
  programar,
  reubicarTarea,
  tareasDelCronograma,
  type Cronograma as DatosCronograma,
  type TareaEntrada,
} from '@/lib/jornada'

function firma(tareas: TareaEntrada[]): string {
  return JSON.stringify(tareas.map((tarea) => [tarea.nombre, tarea.horas, tarea.notas, tarea.noAntesDe ?? '']))
}

function paraGuardar(tareas: TareaEntrada[]) {
  return tareas.map((tarea) => ({
    nombre: tarea.nombre,
    horas: tarea.horas,
    notas: tarea.notas ?? '',
    ...(tarea.noAntesDe ? { noAntesDe: tarea.noAntesDe } : {}),
    ...(tarea.color ? { color: tarea.color } : {}),
    ...(tarea.finalizada ? { finalizada: true } : {}),
    ...(tarea.manual === true ? { manual: true } : tarea.manual === false ? { manual: false } : {}),
  }))
}

function tituloDelDia(cronograma: DatosCronograma, fecha: string): string {
  for (const semana of cronograma.semanas) {
    const dia = semana.dias.find((item) => item.fecha === fecha)
    if (dia) return dia.titulo
  }
  return fecha
}

export function PlanActividad({
  proyectoId,
  actividadId,
  cronograma,
  hoy,
}: {
  proyectoId: string
  actividadId: string
  cronograma: DatosCronograma
  hoy: string
}) {
  const [actual, setActual] = useState(cronograma)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [modal, setModal] = useState<{ modo: 'crear'; fecha: string } | { modo: 'editar'; indice: number } | null>(null)
  const [errorModal, setErrorModal] = useState<string | null>(null)
  const ocupado = useRef(false)
  const guardado = useRef(firma(tareasDelCronograma(cronograma)))

  useEffect(() => {
    if (ocupado.current) return
    guardado.current = firma(tareasDelCronograma(cronograma))
    setActual(cronograma)
  }, [cronograma])

  async function mover(indice: number, fecha: string, posicion: number) {
    if (ocupado.current) return
    const tareas = reubicarTarea(actual, indice, fecha, posicion)
    if (firma(tareas) === firma(tareasDelCronograma(actual))) return

    let siguiente: DatosCronograma
    try {
      siguiente = programar(actual.fechaSolicitada, tareas)
    } catch (causa) {
      console.error(causa)
      setError('No se pudo recalcular las horas con ese movimiento.')
      return
    }

    const anterior = actual
    setActual(siguiente)
    setError(null)
    ocupado.current = true
    setGuardando(true)
    const resultado = await guardarOrdenTareas(
      proyectoId,
      actividadId,
      tareas.map((tarea) => ({
        nombre: tarea.nombre,
        horas: tarea.horas,
        notas: tarea.notas ?? '',
        ...(tarea.noAntesDe ? { noAntesDe: tarea.noAntesDe } : {}),
        ...(tarea.color ? { color: tarea.color } : {}),
        ...(tarea.finalizada ? { finalizada: true } : {}),
        ...(tarea.manual === true ? { manual: true } : tarea.manual === false ? { manual: false } : {}),
      })),
    )
    ocupado.current = false
    setGuardando(false)

    if (resultado?.error) {
      setActual(anterior)
      setError(resultado.error)
      return
    }

    guardado.current = firma(tareas)
  }

  async function alternarFinalizada(indice: number) {
    if (ocupado.current) return
    const anterior = actual
    const siguiente: DatosCronograma = {
      ...actual,
      tareas: actual.tareas.map((tarea) => (tarea.indice === indice ? { ...tarea, finalizada: !tarea.finalizada } : tarea)),
    }
    const tareas = tareasDelCronograma(siguiente)
    setActual(siguiente)
    setError(null)
    ocupado.current = true
    setGuardando(true)
    const resultado = await guardarOrdenTareas(
      proyectoId,
      actividadId,
      tareas.map((tarea) => ({
        nombre: tarea.nombre,
        horas: tarea.horas,
        notas: tarea.notas ?? '',
        ...(tarea.noAntesDe ? { noAntesDe: tarea.noAntesDe } : {}),
        ...(tarea.color ? { color: tarea.color } : {}),
        ...(tarea.finalizada ? { finalizada: true } : {}),
        ...(tarea.manual === true ? { manual: true } : tarea.manual === false ? { manual: false } : {}),
      })),
    )
    ocupado.current = false
    setGuardando(false)
    if (resultado?.error) {
      setActual(anterior)
      setError(resultado.error)
      return
    }
    guardado.current = firma(tareas)
  }

  async function guardarBorrador(borrador: BorradorTarea) {
    if (!modal || ocupado.current) return
    const anteriores = tareasDelCronograma(actual)
    const tareas =
      modal.modo === 'crear'
        ? insertarTareaEnDia(actual, borrador, modal.fecha)
        : anteriores.map((tarea, indice) =>
            actual.tareas[indice]?.indice === modal.indice ? { ...tarea, ...borrador } : tarea,
          )

    let siguiente: DatosCronograma
    try {
      siguiente = programar(actual.fechaSolicitada, tareas)
    } catch (causa) {
      console.error(causa)
      setErrorModal('No se pudo recalcular el calendario con esa tarea.')
      return
    }

    const previa = actual
    setActual(siguiente)
    setError(null)
    setErrorModal(null)
    ocupado.current = true
    setGuardando(true)
    const resultado = await reemplazarTareas(proyectoId, actividadId, paraGuardar(tareasDelCronograma(siguiente)))
    ocupado.current = false
    setGuardando(false)

    if (resultado?.error) {
      setActual(previa)
      setErrorModal(resultado.error)
      return
    }

    guardado.current = firma(tareasDelCronograma(siguiente))
    setModal(null)
  }

  async function eliminarTarea() {
    if (!modal || modal.modo !== 'editar' || ocupado.current) return
    const tareas = tareasDelCronograma(actual).filter((_, indice) => actual.tareas[indice]?.indice !== modal.indice)
    if (tareas.length === 0) {
      setErrorModal('La actividad necesita al menos una tarea.')
      return
    }

    let siguiente: DatosCronograma
    try {
      siguiente = programar(actual.fechaSolicitada, tareas)
    } catch (causa) {
      console.error(causa)
      setErrorModal('No se pudo recalcular el calendario sin esa tarea.')
      return
    }

    const previa = actual
    setActual(siguiente)
    setError(null)
    setErrorModal(null)
    ocupado.current = true
    setGuardando(true)
    const resultado = await reemplazarTareas(proyectoId, actividadId, paraGuardar(tareasDelCronograma(siguiente)))
    ocupado.current = false
    setGuardando(false)

    if (resultado?.error) {
      setActual(previa)
      setErrorModal(resultado.error)
      return
    }

    guardado.current = firma(tareasDelCronograma(siguiente))
    setModal(null)
  }

  const tareaModal = modal?.modo === 'editar' ? actual.tareas.find((tarea) => tarea.indice === modal.indice) : null
  const empieza = actual.tareas[0]?.inicioTexto ?? actual.fechaInicioTexto

  return (
    <>
      <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Horas', actual.horasTexto],
          ['Días con trabajo', String(actual.diasConTrabajo)],
          ['Empieza', empieza],
          ['Termina', actual.fechaFinTexto],
        ].map(([etiqueta, valor]) => (
          <div key={etiqueta} className="rounded-2xl border border-line bg-paper-2 px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-muted">{etiqueta}</dt>
            <dd className="mt-1 text-sm leading-5">{valor}</dd>
          </div>
        ))}
      </dl>

      {actual.ajuste ? <p className="mt-4 rounded-2xl bg-soft px-4 py-3 text-sm leading-6">{actual.ajuste}</p> : null}

      {actual.festivos.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {actual.festivos.map((festivo) => (
            <li key={festivo.fecha} className="rounded-full bg-holiday px-3 py-1 text-xs text-ink">
              {festivo.etiqueta} · {festivo.nombre}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4">
        <ReglasJornada compacta />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-paper-2">
        <table className="w-full text-left text-sm">
          <thead className="bg-soft text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Tarea</th>
              <th className="px-4 py-3 font-medium">Horas</th>
              <th className="px-4 py-3 font-medium">Desde</th>
              <th className="px-4 py-3 font-medium">Hasta</th>
            </tr>
          </thead>
          <tbody>
            {actual.tareas.map((tarea) => (
              <tr key={tarea.indice} className="border-t border-line">
                <td className="px-4 py-3">
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: colorMostrado(tarea) }} />
                  {tarea.nombre}
                  {tarea.notas ? <span className="mt-1 block pl-4 text-xs text-muted">{tarea.notas}</span> : null}
                </td>
                <td className="px-4 py-3">{tarea.horasTexto}</td>
                <td className="px-4 py-3">{tarea.inicioTexto}</td>
                <td className="px-4 py-3">{tarea.finTexto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error ? <p className="mt-4 rounded-2xl bg-holiday px-4 py-3 text-sm leading-6 text-ink">{error}</p> : null}

      <div className="mt-6">
        <Cronograma
          cronograma={actual}
          hoy={hoy}
          guardando={guardando}
          onMover={mover}
          onFinalizar={alternarFinalizada}
          onAgregar={(fecha) => {
            setErrorModal(null)
            setModal({ modo: 'crear', fecha })
          }}
          onEditar={(indice) => {
            setErrorModal(null)
            setModal({ modo: 'editar', indice })
          }}
        />
      </div>
      {modal?.modo === 'crear' ? (
        <ModalTarea
          key={`crear-${modal.fecha}`}
          titulo="Nueva tarea"
          detalle={`Queda al inicio del ${tituloDelDia(actual, modal.fecha)}. Si ese día ya trae horas de una tarea anterior, esta queda debajo.`}
          inicial={{ nombre: '', horas: '', notas: '' }}
          guardando={guardando}
          error={errorModal}
          confirmarTexto="Crear tarea"
          onCerrar={() => setModal(null)}
          onGuardar={guardarBorrador}
        />
      ) : null}
      {modal?.modo === 'editar' && tareaModal ? (
        <ModalTarea
          key={`editar-${tareaModal.indice}`}
          titulo="Editar tarea"
          inicial={{
            nombre: tareaModal.nombre,
            horas: Number.isInteger(tareaModal.horas) ? String(tareaModal.horas) : String(tareaModal.horas),
            notas: tareaModal.notas,
          }}
          guardando={guardando}
          error={errorModal}
          confirmarTexto="Guardar tarea"
          onCerrar={() => setModal(null)}
          onGuardar={guardarBorrador}
          onEliminar={eliminarTarea}
        />
      ) : null}
    </>
  )
}
