'use server'

import { refresh, revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { esErrorDeConexion, mensajeMongo } from '@/lib/db'
import {
  actualizarActividad as guardarCambiosActividad,
  actualizarProyecto as guardarCambiosProyecto,
  crearActividad as guardarActividad,
  crearProyecto as guardarProyecto,
  eliminarActividad as borrarActividad,
  eliminarProyecto as borrarProyecto,
  guardarTareas,
  obtenerActividad,
  obtenerArchivo,
} from '@/lib/datos'
import { aplicarOrigen, leerExcel, validarTareasManuales, type TareaExcel } from '@/lib/excel'
import { esIso, desdeIso } from '@/lib/fechas'
import { esColorDeTarea } from '@/lib/jornada'

const MAX_ARCHIVO = 5 * 1024 * 1024

function nombreDesdeArchivo(nombre: string): string {
  const limpio = nombre.replace(/\.(xlsx|xlsm)$/i, '').replace(/[_-]+/g, ' ').trim()
  return limpio || 'Actividad'
}

export async function crearProyecto(
  _estado: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const nombre = String(formData.get('nombre') ?? '').trim()
  const descripcion = String(formData.get('descripcion') ?? '').trim()

  if (nombre.length < 2) return { error: 'Escribe un nombre de al menos 2 caracteres.' }
  if (nombre.length > 120) return { error: 'El nombre no puede pasar de 120 caracteres.' }
  if (descripcion.length > 2000) return { error: 'La descripción es demasiado larga.' }

  let id = ''

  try {
    id = await guardarProyecto({ nombre, descripcion })
  } catch (error) {
    console.error(error)
    return { error: esErrorDeConexion(error) ? mensajeMongo() : 'No se pudo crear el proyecto.' }
  }

  revalidatePath('/')
  redirect(`/proyectos/${id}`)
}

function leerFecha(fechaInicio: string): { error: string } | null {
  if (!esIso(fechaInicio)) return { error: 'Elige una fecha de inicio válida.' }
  const anio = desdeIso(fechaInicio).getFullYear()
  if (anio < 2000 || anio > 2100) return { error: 'Usa una fecha de inicio entre 2000 y 2100.' }
  return null
}

type ArchivoLeido = {
  tareas: TareaExcel[]
  hoja: string
  contenido: Buffer
  nombre: string
  tipo: string
}

async function leerArchivoNuevo(archivo: FormDataEntryValue | null): Promise<ArchivoLeido | { error: string } | null> {
  if (!(archivo instanceof File) || archivo.size === 0) return null

  if (archivo.size > MAX_ARCHIVO) return { error: 'El archivo supera 5 MB.' }
  if (!/\.xlsx$|\.xlsm$/i.test(archivo.name)) {
    return { error: 'Usa un archivo .xlsx. Si está en .xls, ábrelo y guárdalo como Libro de Excel.' }
  }

  const contenido = Buffer.from(await archivo.arrayBuffer())
  const leido = await leerExcel(contenido)
  if (!leido.ok) return { error: leido.error }

  return { tareas: leido.tareas, hoja: leido.hoja, contenido, nombre: archivo.name, tipo: archivo.type }
}

async function completarOrigen(proyectoId: string, actividadId: string, tareas: TareaExcel[]): Promise<TareaExcel[]> {
  if (tareas.every((tarea) => typeof tarea.manual === 'boolean')) return tareas
  const archivo = await obtenerArchivo(proyectoId, actividadId)
  let originales: TareaExcel[] = []
  if (archivo) {
    const leido = await leerExcel(archivo.datos)
    if (leido.ok) originales = leido.tareas
  }
  return aplicarOrigen(tareas, originales)
}

export async function editarProyecto(
  _estado: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const id = String(formData.get('id') ?? '')
  const nombre = String(formData.get('nombre') ?? '').trim()
  const descripcion = String(formData.get('descripcion') ?? '').trim()

  if (nombre.length < 2) return { error: 'Escribe un nombre de al menos 2 caracteres.' }
  if (nombre.length > 120) return { error: 'El nombre no puede pasar de 120 caracteres.' }
  if (descripcion.length > 2000) return { error: 'La descripción es demasiado larga.' }

  try {
    const actualizado = await guardarCambiosProyecto(id, { nombre, descripcion })
    if (!actualizado) return { error: 'No encontré el proyecto.' }
  } catch (error) {
    console.error(error)
    return { error: esErrorDeConexion(error) ? mensajeMongo() : 'No se pudo guardar el proyecto.' }
  }

  revalidatePath('/')
  revalidatePath(`/proyectos/${id}`)
  redirect(`/proyectos/${id}`)
}

export async function eliminarProyecto(id: string, _formData: FormData): Promise<void> {
  try {
    await borrarProyecto(id)
  } catch (error) {
    console.error(error)
    throw error
  }

  revalidatePath('/')
  redirect('/')
}

export async function crearActividad(
  _estado: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const proyectoId = String(formData.get('proyectoId') ?? '')
  const nombreEscrito = String(formData.get('nombre') ?? '').trim()
  const fechaInicio = String(formData.get('fechaInicio') ?? '')
  const archivo = formData.get('archivo')

  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: 'Adjunta un archivo Excel (.xlsx).' }
  }

  if (archivo.size > MAX_ARCHIVO) {
    return { error: 'El archivo supera 5 MB.' }
  }

  if (!/\.xlsx$|\.xlsm$/i.test(archivo.name)) {
    return { error: 'Usa un archivo .xlsx. Si está en .xls, ábrelo y guárdalo como Libro de Excel.' }
  }

  const fechaInvalida = leerFecha(fechaInicio)
  if (fechaInvalida) return fechaInvalida

  const nombre = (nombreEscrito || nombreDesdeArchivo(archivo.name)).slice(0, 140)
  if (nombre.length < 2) {
    return { error: 'Ponle un nombre a la actividad.' }
  }

  const contenido = Buffer.from(await archivo.arrayBuffer())
  const leido = await leerExcel(contenido)
  if (!leido.ok) return { error: leido.error }

  let actividadId: string | null = null

  try {
    actividadId = await guardarActividad({
      proyectoId,
      nombre,
      fechaInicio,
      hoja: leido.hoja,
      archivoNombre: archivo.name,
      archivoTipo: archivo.type,
      archivo: contenido,
      tareas: leido.tareas,
    })
  } catch (error) {
    console.error(error)
    return { error: esErrorDeConexion(error) ? mensajeMongo() : 'No se pudo guardar la actividad.' }
  }

  if (!actividadId) {
    return { error: 'No encontré el proyecto al que quieres asociar el archivo.' }
  }

  revalidatePath(`/proyectos/${proyectoId}`)
  redirect(`/proyectos/${proyectoId}/actividades/${actividadId}`)
}

export async function editarActividad(
  _estado: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const proyectoId = String(formData.get('proyectoId') ?? '')
  const actividadId = String(formData.get('actividadId') ?? '')
  const nombre = String(formData.get('nombre') ?? '').trim()
  const fechaInicio = String(formData.get('fechaInicio') ?? '')

  if (nombre.length < 2) return { error: 'Ponle un nombre a la actividad.' }
  if (nombre.length > 140) return { error: 'El nombre no puede pasar de 140 caracteres.' }

  const fechaInvalida = leerFecha(fechaInicio)
  if (fechaInvalida) return fechaInvalida

  const archivo = await leerArchivoNuevo(formData.get('archivo'))
  if (archivo && 'error' in archivo) return archivo

  const manuales = archivo
    ? { ok: true as const, tareas: archivo.tareas }
    : validarTareasManuales(
        formData.getAll('tareaNombre').map((valor, indice) => ({
          nombre: String(valor),
          horas: String(formData.getAll('tareaHoras')[indice] ?? ''),
          notas: String(formData.getAll('tareaNotas')[indice] ?? ''),
          noAntesDe: String(formData.getAll('tareaNoAntesDe')[indice] ?? ''),
          color: String(formData.getAll('tareaColor')[indice] ?? ''),
          finalizada: String(formData.getAll('tareaFinalizada')[indice] ?? ''),
          manual: String(formData.getAll('tareaManual')[indice] ?? ''),
        })),
      )

  if (!manuales.ok) return { error: manuales.error }

  try {
    const actualizada = await guardarCambiosActividad({
      proyectoId,
      actividadId,
      nombre,
      fechaInicio,
      tareas: archivo ? manuales.tareas.map((tarea) => ({ ...tarea, manual: false })) : await completarOrigen(proyectoId, actividadId, manuales.tareas),
      archivo: archivo
        ? { nombre: archivo.nombre, tipo: archivo.tipo, datos: archivo.contenido, hoja: archivo.hoja }
        : undefined,
    })
    if (!actualizada) return { error: 'No encontré la actividad.' }
  } catch (error) {
    console.error(error)
    return { error: esErrorDeConexion(error) ? mensajeMongo() : 'No se pudo guardar la actividad.' }
  }

  revalidatePath(`/proyectos/${proyectoId}`)
  revalidatePath(`/proyectos/${proyectoId}/actividades/${actividadId}`)
  refresh()
  redirect(`/proyectos/${proyectoId}/actividades/${actividadId}`)
}

export async function reemplazarTareas(
  proyectoId: string,
  actividadId: string,
  tareas: TareaExcel[],
): Promise<{ error: string } | null> {
  const manuales = validarTareasManuales(
    tareas.map((tarea) => ({
      nombre: tarea.nombre,
      horas: String(tarea.horas),
      notas: tarea.notas ?? '',
      noAntesDe: tarea.noAntesDe ?? '',
      color: tarea.color ?? '',
      finalizada: tarea.finalizada ? '1' : '',
      manual: tarea.manual === true ? '1' : tarea.manual === false ? '0' : '',
    })),
  )
  if (!manuales.ok) return { error: manuales.error }

  try {
    const actualizada = await guardarTareas(proyectoId, actividadId, await completarOrigen(proyectoId, actividadId, manuales.tareas))
    if (!actualizada) return { error: 'No encontré la actividad.' }
  } catch (error) {
    console.error(error)
    return { error: esErrorDeConexion(error) ? mensajeMongo() : 'No se pudo guardar la tarea.' }
  }

  revalidatePath(`/proyectos/${proyectoId}`)
  revalidatePath(`/proyectos/${proyectoId}/actividades/${actividadId}`)
  refresh()
  return null
}

function firmaTarea(tarea: TareaExcel): string {
  return `${tarea.nombre}\0${Math.round(tarea.horas * 60)}\0${tarea.notas}`
}

export async function guardarOrdenTareas(
  proyectoId: string,
  actividadId: string,
  tareas: TareaExcel[],
): Promise<{ error: string } | null> {
  const limpias = tareas.map((tarea) => {
    const ancla = tarea.noAntesDe?.trim() ?? ''
    const anio = Number(ancla.slice(0, 4))
    const anclaValida = esIso(ancla) && anio >= 2000 && anio <= 2100
    const color = tarea.color?.trim().toLowerCase()
    return {
      nombre: tarea.nombre,
      horas: tarea.horas,
      notas: tarea.notas,
      ...(anclaValida ? { noAntesDe: ancla } : {}),
      ...(esColorDeTarea(color) ? { color } : {}),
      ...(tarea.finalizada ? { finalizada: true } : {}),
      ...(tarea.manual === true ? { manual: true } : tarea.manual === false ? { manual: false } : {}),
    }
  })

  try {
    const actividad = await obtenerActividad(proyectoId, actividadId)
    if (!actividad) return { error: 'No encontré la actividad.' }

    const guardadas = [...actividad.tareas].map(firmaTarea).sort()
    const recibidas = limpias.map(firmaTarea).sort()
    const mismas = guardadas.length === recibidas.length && guardadas.every((firma, indice) => firma === recibidas[indice])
    if (!mismas) return { error: 'Las tareas cambiaron. Recarga la página antes de moverlas.' }

    const actualizada = await guardarTareas(proyectoId, actividadId, await completarOrigen(proyectoId, actividadId, limpias))
    if (!actualizada) return { error: 'No encontré la actividad.' }
  } catch (error) {
    console.error(error)
    return { error: esErrorDeConexion(error) ? mensajeMongo() : 'No se pudo guardar el nuevo orden.' }
  }

  revalidatePath(`/proyectos/${proyectoId}`)
  revalidatePath(`/proyectos/${proyectoId}/actividades/${actividadId}`)
  refresh()
  return null
}

export async function eliminarActividad(proyectoId: string, actividadId: string, _formData: FormData): Promise<void> {
  try {
    await borrarActividad(proyectoId, actividadId)
  } catch (error) {
    console.error(error)
    throw error
  }

  revalidatePath(`/proyectos/${proyectoId}`)
  redirect(`/proyectos/${proyectoId}`)
}
