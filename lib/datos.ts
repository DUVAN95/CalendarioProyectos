import { Binary, ObjectId, type Collection } from 'mongodb'
import { etiquetaCreacion } from '@/lib/fechas'
import { getDb } from '@/lib/db'
import type { TareaExcel } from '@/lib/excel'
import { programar } from '@/lib/jornada'

type ProyectoDoc = {
  _id: ObjectId
  nombre: string
  descripcion: string
  creadoEn: Date
}

type ActividadDoc = {
  _id: ObjectId
  proyectoId: ObjectId
  nombre: string
  fechaInicio: string
  hoja: string
  archivo: {
    nombre: string
    tipo: string
    datos: Binary
  }
  tareas: TareaExcel[]
  creadoEn: Date
}

export type ProyectoVista = {
  id: string
  nombre: string
  descripcion: string
  creadoEnTexto: string
  actividades: number
}

export type ActividadResumen = {
  id: string
  nombre: string
  archivoNombre: string
  tareas: number
  horasTexto: string
  rango: string
  creadoEnTexto: string
}

export type ActividadVista = {
  id: string
  proyectoId: string
  nombre: string
  fechaInicio: string
  hoja: string
  archivoNombre: string
  tareas: TareaExcel[]
  creadoEnTexto: string
}

function aObjectId(id: string): ObjectId | null {
  if (!/^[a-f0-9]{24}$/i.test(id)) return null
  return new ObjectId(id)
}

async function colecciones(): Promise<{
  proyectos: Collection<ProyectoDoc>
  actividades: Collection<ActividadDoc>
}> {
  const db = await getDb()
  return {
    proyectos: db.collection<ProyectoDoc>('proyectos'),
    actividades: db.collection<ActividadDoc>('actividades'),
  }
}

export async function listarProyectos(): Promise<ProyectoVista[]> {
  const { proyectos } = await colecciones()
  const documentos = await proyectos
    .aggregate<{
      _id: ObjectId
      nombre: string
      descripcion: string
      creadoEn: Date
      actividades: number
    }>([
      {
        $lookup: {
          from: 'actividades',
          localField: '_id',
          foreignField: 'proyectoId',
          as: 'actividades',
        },
      },
      { $addFields: { actividades: { $size: '$actividades' } } },
      { $sort: { creadoEn: -1 } },
    ])
    .toArray()

  return documentos.map((documento) => ({
    id: documento._id.toHexString(),
    nombre: documento.nombre,
    descripcion: documento.descripcion,
    creadoEnTexto: etiquetaCreacion(documento.creadoEn),
    actividades: documento.actividades,
  }))
}

export async function obtenerProyecto(id: string): Promise<ProyectoVista | null> {
  const oid = aObjectId(id)
  if (!oid) return null

  const { proyectos, actividades } = await colecciones()
  const documento = await proyectos.findOne({ _id: oid })
  if (!documento) return null

  const cantidad = await actividades.countDocuments({ proyectoId: oid })
  return {
    id: documento._id.toHexString(),
    nombre: documento.nombre,
    descripcion: documento.descripcion,
    creadoEnTexto: etiquetaCreacion(documento.creadoEn),
    actividades: cantidad,
  }
}

export async function crearProyecto(datos: { nombre: string; descripcion: string }): Promise<string> {
  const { proyectos } = await colecciones()
  const resultado = await proyectos.insertOne({
    _id: new ObjectId(),
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    creadoEn: new Date(),
  })
  return resultado.insertedId.toHexString()
}

export async function actualizarProyecto(id: string, datos: { nombre: string; descripcion: string }): Promise<boolean> {
  const oid = aObjectId(id)
  if (!oid) return false

  const { proyectos } = await colecciones()
  const resultado = await proyectos.updateOne(
    { _id: oid },
    { $set: { nombre: datos.nombre, descripcion: datos.descripcion } },
  )
  return resultado.matchedCount === 1
}

export async function eliminarProyecto(id: string): Promise<void> {
  const oid = aObjectId(id)
  if (!oid) return
  const { proyectos, actividades } = await colecciones()
  await actividades.deleteMany({ proyectoId: oid })
  await proyectos.deleteOne({ _id: oid })
}

export async function listarActividades(proyectoId: string): Promise<ActividadResumen[]> {
  const oid = aObjectId(proyectoId)
  if (!oid) return []

  const { actividades } = await colecciones()
  const documentos = await actividades
    .find({ proyectoId: oid }, { projection: { 'archivo.datos': 0 } })
    .sort({ creadoEn: -1 })
    .toArray()

  return documentos.map((documento) => {
    let rango = 'Sin calendario'
    let horasTexto = '—'

    try {
      const cronograma = programar(documento.fechaInicio, documento.tareas)
      rango = cronograma.rango
      horasTexto = cronograma.horasTexto
    } catch (error) {
      console.error(error)
      rango = 'No se pudo calcular'
    }

    return {
      id: documento._id.toHexString(),
      nombre: documento.nombre,
      archivoNombre: documento.archivo.nombre,
      tareas: documento.tareas.length,
      horasTexto,
      rango,
      creadoEnTexto: etiquetaCreacion(documento.creadoEn),
    }
  })
}

export async function obtenerActividad(proyectoId: string, actividadId: string): Promise<ActividadVista | null> {
  const proyecto = aObjectId(proyectoId)
  const actividad = aObjectId(actividadId)
  if (!proyecto || !actividad) return null

  const { actividades } = await colecciones()
  const documento = await actividades.findOne(
    { _id: actividad, proyectoId: proyecto },
    { projection: { 'archivo.datos': 0 } },
  )
  if (!documento) return null

  return {
    id: documento._id.toHexString(),
    proyectoId: documento.proyectoId.toHexString(),
    nombre: documento.nombre,
    fechaInicio: documento.fechaInicio,
    hoja: documento.hoja,
    archivoNombre: documento.archivo.nombre,
    tareas: documento.tareas,
    creadoEnTexto: etiquetaCreacion(documento.creadoEn),
  }
}

export async function crearActividad(datos: {
  proyectoId: string
  nombre: string
  fechaInicio: string
  hoja: string
  archivoNombre: string
  archivoTipo: string
  archivo: Buffer
  tareas: TareaExcel[]
}): Promise<string | null> {
  const proyecto = aObjectId(datos.proyectoId)
  if (!proyecto) return null

  const { proyectos, actividades } = await colecciones()
  const existe = await proyectos.findOne({ _id: proyecto }, { projection: { _id: 1 } })
  if (!existe) return null

  const resultado = await actividades.insertOne({
    _id: new ObjectId(),
    proyectoId: proyecto,
    nombre: datos.nombre,
    fechaInicio: datos.fechaInicio,
    hoja: datos.hoja,
    archivo: {
      nombre: datos.archivoNombre,
      tipo: datos.archivoTipo || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      datos: new Binary(datos.archivo),
    },
    tareas: datos.tareas,
    creadoEn: new Date(),
  })

  return resultado.insertedId.toHexString()
}

export async function actualizarActividad(datos: {
  proyectoId: string
  actividadId: string
  nombre: string
  fechaInicio: string
  tareas: TareaExcel[]
  archivo?: {
    nombre: string
    tipo: string
    datos: Buffer
    hoja: string
  }
}): Promise<boolean> {
  const proyecto = aObjectId(datos.proyectoId)
  const actividad = aObjectId(datos.actividadId)
  if (!proyecto || !actividad) return false

  const cambio: Record<string, unknown> = {
    nombre: datos.nombre,
    fechaInicio: datos.fechaInicio,
    tareas: datos.tareas,
  }

  if (datos.archivo) {
    cambio.hoja = datos.archivo.hoja
    cambio.archivo = {
      nombre: datos.archivo.nombre,
      tipo: datos.archivo.tipo || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      datos: new Binary(datos.archivo.datos),
    }
  }

  const { actividades } = await colecciones()
  const resultado = await actividades.updateOne({ _id: actividad, proyectoId: proyecto }, { $set: cambio })
  return resultado.matchedCount === 1
}

export async function guardarTareas(proyectoId: string, actividadId: string, tareas: TareaExcel[]): Promise<boolean> {
  const proyecto = aObjectId(proyectoId)
  const actividad = aObjectId(actividadId)
  if (!proyecto || !actividad) return false

  const { actividades } = await colecciones()
  const resultado = await actividades.updateOne({ _id: actividad, proyectoId: proyecto }, { $set: { tareas } })
  return resultado.matchedCount === 1
}

export async function eliminarActividad(proyectoId: string, actividadId: string): Promise<void> {
  const proyecto = aObjectId(proyectoId)
  const actividad = aObjectId(actividadId)
  if (!proyecto || !actividad) return
  const { actividades } = await colecciones()
  await actividades.deleteOne({ _id: actividad, proyectoId: proyecto })
}

export async function obtenerArchivo(
  proyectoId: string,
  actividadId: string,
): Promise<{ nombre: string; tipo: string; datos: Buffer } | null> {
  const proyecto = aObjectId(proyectoId)
  const actividad = aObjectId(actividadId)
  if (!proyecto || !actividad) return null

  const { actividades } = await colecciones()
  const documento = await actividades.findOne(
    { _id: actividad, proyectoId: proyecto },
    { projection: { archivo: 1 } },
  )
  if (!documento) return null

  return {
    nombre: documento.archivo.nombre,
    tipo: documento.archivo.tipo,
    datos: Buffer.from(documento.archivo.datos.value()),
  }
}
