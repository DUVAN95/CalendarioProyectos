import {
  aIso,
  diaCorto,
  desdeIso,
  esIso,
  etiquetaCorta,
  etiquetaLarga,
  etiquetaSemana,
  inicioDeDia,
  lunesDeLaSemana,
  mesCorto,
  sumarDias,
  textoHoras,
} from '@/lib/fechas'
import { festivoEn } from '@/lib/festivos'

export const HORAS_ENTRE_SEMANA = 8
export const HORAS_VIERNES = 6
export const HORAS_VIERNES_CON_FESTIVO = 8

const COLORES = ['#c24d2c', '#1f4f45', '#8a5a12', '#1e3a5f', '#8e2f45', '#3d5c28', '#53447a', '#7a3e28']
export const COLOR_FINALIZADA = '#d4cdc3'

export type TareaEntrada = {
  nombre: string
  horas: number
  notas?: string
  noAntesDe?: string
  color?: string
  finalizada?: boolean
  manual?: boolean
}

export function colorMostrado(tarea: { color: string; finalizada?: boolean }): string {
  return tarea.finalizada ? COLOR_FINALIZADA : tarea.color
}

export type Segmento = {
  fecha: string
  etiqueta: string
  horas: number
  capacidadHoras: number
  desplazamientoHoras: number
  texto: string
  corto: string
}

export type TareaProgramada = {
  indice: number
  nombre: string
  notas: string
  horas: number
  horasTexto: string
  inicioTexto: string
  finTexto: string
  rango: string
  color: string
  noAntesDe?: string
  finalizada?: boolean
  manual?: boolean
  segmentos: Segmento[]
}

export type DiaCalendario = {
  fecha: string
  titulo: string
  diaCorto: string
  numero: number
  mesCorto: string
  capacidadTexto: string
  festivo?: string
  viernesAmpliado: boolean
  anterior: boolean
  posterior: boolean
}

export type SemanaCalendario = {
  inicio: string
  etiqueta: string
  viernesAmpliado: boolean
  dias: DiaCalendario[]
}

export type Cronograma = {
  fechaSolicitada: string
  fechaInicio: string
  fechaFin: string
  fechaInicioTexto: string
  fechaFinTexto: string
  rango: string
  ajuste?: string
  horasTotales: number
  horasTexto: string
  diasConTrabajo: number
  semanas: SemanaCalendario[]
  tareas: TareaProgramada[]
  festivos: { fecha: string; nombre: string; etiqueta: string }[]
}

type CapacidadDia = {
  minutos: number
  festivo?: string
  viernesAmpliado: boolean
}

function lunesAJuevesTieneFestivo(fecha: Date): boolean {
  const lunes = lunesDeLaSemana(fecha)
  for (let indice = 0; indice < 4; indice += 1) {
    if (festivoEn(sumarDias(lunes, indice))) return true
  }
  return false
}

export function capacidadDelDia(fecha: Date): CapacidadDia {
  const festivo = festivoEn(fecha)
  const dia = fecha.getDay()

  if (dia === 0 || dia === 6) {
    return { minutos: 0, festivo, viernesAmpliado: false }
  }

  if (festivo) {
    return { minutos: 0, festivo, viernesAmpliado: false }
  }

  if (dia === 5) {
    const ampliado = lunesAJuevesTieneFestivo(fecha)
    return {
      minutos: (ampliado ? HORAS_VIERNES_CON_FESTIVO : HORAS_VIERNES) * 60,
      viernesAmpliado: ampliado,
    }
  }

  return { minutos: HORAS_ENTRE_SEMANA * 60, viernesAmpliado: false }
}

export function esColorDeTarea(valor: string | undefined): valor is string {
  return Boolean(valor && COLORES.includes(valor.toLowerCase()))
}

function anclaAceptada(valor: string | undefined): string | undefined {
  if (!valor || !esIso(valor)) return undefined
  const anio = Number(valor.slice(0, 4))
  if (anio < 2000 || anio > 2100) return undefined
  return valor
}

function textoCapacidad(capacidad: CapacidadDia): string {
  if (capacidad.festivo) return 'Festivo'
  if (capacidad.minutos === 0) return '—'
  if (capacidad.viernesAmpliado) return `${HORAS_VIERNES_CON_FESTIVO} h por festivo`
  return textoHoras(capacidad.minutos / 60)
}

export function sugerirInicio(desde = new Date()): string {
  let fecha = inicioDeDia(desde)

  for (let indice = 0; indice < 370; indice += 1) {
    if (capacidadDelDia(fecha).minutos > 0) return aIso(fecha)
    fecha = sumarDias(fecha, 1)
  }

  return aIso(inicioDeDia(desde))
}

export function programar(fechaSolicitada: string, tareasEntrada: TareaEntrada[]): Cronograma {
  if (!esIso(fechaSolicitada)) {
    throw new Error('La fecha de inicio no es válida.')
  }

  if (tareasEntrada.length === 0) {
    throw new Error('No hay tareas para programar.')
  }

  const tareas = tareasEntrada.map((tarea) => {
    const minutos = Math.round(tarea.horas * 60)
    if (!Number.isFinite(minutos) || minutos <= 0) {
      throw new Error(`La tarea «${tarea.nombre}» no tiene horas válidas.`)
    }

    return {
      nombre: tarea.nombre,
      notas: tarea.notas?.trim() ?? '',
      minutos,
      restante: minutos,
      noAntesDe: anclaAceptada(tarea.noAntesDe),
      color: esColorDeTarea(tarea.color) ? tarea.color.toLowerCase() : undefined,
      finalizada: Boolean(tarea.finalizada),
      manual: tarea.manual,
      segmentos: [] as Segmento[],
    }
  })

  let cursor = desdeIso(fechaSolicitada)
  const omitidos: string[] = []
  let guardia = 0

  while (capacidadDelDia(cursor).minutos === 0) {
    const festivo = festivoEn(cursor)
    if (festivo) omitidos.push(`${etiquetaCorta(aIso(cursor))} (${festivo})`)
    cursor = sumarDias(cursor, 1)
    guardia += 1
    if (guardia > 370) {
      throw new Error('No encontré un día hábil en el año siguiente a la fecha de inicio.')
    }
  }

  const fechaInicio = aIso(cursor)
  let ajuste: string | undefined

  if (fechaInicio !== fechaSolicitada) {
    ajuste = omitidos.length
      ? `No se trabaja el ${omitidos.join(', ')}. El calendario empieza el ${etiquetaLarga(fechaInicio)}.`
      : `La fecha cae en fin de semana. El calendario empieza el ${etiquetaLarga(fechaInicio)}.`
  }

  const usoPorDia = new Map<string, number>()
  let indice = 0
  guardia = 0

  while (indice < tareas.length) {
    guardia += 1
    if (guardia > 20000) {
      throw new Error('El calendario es demasiado largo. Revisa las horas del Excel.')
    }

    const tarea = tareas[indice]
    if (tarea.segmentos.length === 0 && tarea.noAntesDe && aIso(cursor) < tarea.noAntesDe) {
      cursor = desdeIso(tarea.noAntesDe)
      continue
    }

    const capacidad = capacidadDelDia(cursor)
    const clave = aIso(cursor)

    if (capacidad.minutos === 0) {
      cursor = sumarDias(cursor, 1)
      continue
    }

    const usado = usoPorDia.get(clave) ?? 0
    const libre = capacidad.minutos - usado

    if (libre <= 0) {
      cursor = sumarDias(cursor, 1)
      continue
    }

    const tomar = Math.min(tarea.restante, libre)
    if (tomar <= 0) {
      throw new Error('No se pudo repartir las horas.')
    }

    const horas = tomar / 60
    const capacidadHoras = capacidad.minutos / 60
    tarea.segmentos.push({
      fecha: clave,
      etiqueta: etiquetaCorta(clave),
      horas,
      capacidadHoras,
      desplazamientoHoras: usado / 60,
      texto: `${textoHoras(horas)} de ${textoHoras(tarea.minutos / 60)}`,
      corto: textoHoras(horas),
    })

    tarea.restante -= tomar
    usoPorDia.set(clave, usado + tomar)

    if (tarea.restante === 0) indice += 1
    if (usado + tomar === capacidad.minutos) cursor = sumarDias(cursor, 1)
  }

  const fechaFin = tareas[tareas.length - 1].segmentos.at(-1)?.fecha
  if (!fechaFin) {
    throw new Error('No se pudo cerrar el calendario.')
  }

  const coloresUsados = new Set(tareas.flatMap((tarea) => (tarea.color ? [tarea.color] : [])))
  const tareasProgramadas: TareaProgramada[] = tareas.map((tarea, posicion) => {
    const inicio = tarea.segmentos[0].fecha
    const fin = tarea.segmentos[tarea.segmentos.length - 1].fecha
    let color = tarea.color
    if (!color) {
      color = COLORES.find((candidato) => !coloresUsados.has(candidato)) ?? COLORES[posicion % COLORES.length]
      coloresUsados.add(color)
    }
    return {
      indice: posicion + 1,
      nombre: tarea.nombre,
      notas: tarea.notas,
      horas: tarea.minutos / 60,
      horasTexto: textoHoras(tarea.minutos / 60),
      inicioTexto: etiquetaCorta(inicio),
      finTexto: etiquetaCorta(fin),
      rango: inicio === fin ? etiquetaCorta(inicio) : `${etiquetaCorta(inicio)} → ${etiquetaCorta(fin)}`,
      color,
      noAntesDe: tarea.noAntesDe,
      ...(tarea.finalizada ? { finalizada: true } : {}),
      ...(tarea.manual === true ? { manual: true } : tarea.manual === false ? { manual: false } : {}),
      segmentos: tarea.segmentos,
    }
  })

  const semanas: SemanaCalendario[] = []
  let lunes = lunesDeLaSemana(desdeIso(fechaInicio))
  const ultimoLunes = sumarDias(lunesDeLaSemana(desdeIso(fechaFin)), 7)

  while (aIso(lunes) <= aIso(ultimoLunes)) {
    const dias: DiaCalendario[] = []

    for (let desplazamiento = 0; desplazamiento < 5; desplazamiento += 1) {
      const fecha = sumarDias(lunes, desplazamiento)
      const iso = aIso(fecha)
      const capacidad = capacidadDelDia(fecha)
      dias.push({
        fecha: iso,
        titulo: etiquetaLarga(iso),
        diaCorto: diaCorto(iso),
        numero: fecha.getDate(),
        mesCorto: mesCorto(iso),
        capacidadTexto: textoCapacidad(capacidad),
        festivo: capacidad.festivo,
        viernesAmpliado: capacidad.viernesAmpliado,
        anterior: iso < fechaInicio,
        posterior: iso > fechaFin,
      })
    }

    semanas.push({
      inicio: aIso(lunes),
      etiqueta: etiquetaSemana(aIso(lunes)),
      viernesAmpliado: dias[4]?.viernesAmpliado ?? false,
      dias,
    })
    lunes = sumarDias(lunes, 7)
  }

  const festivos = semanas.flatMap((semana) =>
    semana.dias
      .filter((dia) => dia.festivo)
      .map((dia) => ({ fecha: dia.fecha, nombre: dia.festivo as string, etiqueta: etiquetaCorta(dia.fecha) })),
  )
  const horasTotales = tareas.reduce((total, tarea) => total + tarea.minutos, 0) / 60

  return {
    fechaSolicitada,
    fechaInicio,
    fechaFin,
    fechaInicioTexto: etiquetaLarga(fechaInicio),
    fechaFinTexto: etiquetaLarga(fechaFin),
    rango: fechaInicio === fechaFin ? etiquetaCorta(fechaInicio) : `${etiquetaCorta(fechaInicio)} → ${etiquetaCorta(fechaFin)}`,
    ajuste,
    horasTotales,
    horasTexto: textoHoras(horasTotales),
    diasConTrabajo: usoPorDia.size,
    semanas,
    tareas: tareasProgramadas,
    festivos,
  }
}

export function tareasDelCronograma(cronograma: Cronograma): TareaEntrada[] {
  return cronograma.tareas.map((tarea) => ({
    nombre: tarea.nombre,
    horas: tarea.horas,
    notas: tarea.notas,
    color: tarea.color,
    ...(tarea.finalizada ? { finalizada: true } : {}),
    ...(tarea.noAntesDe ? { noAntesDe: tarea.noAntesDe } : {}),
    ...(tarea.manual === true ? { manual: true } : tarea.manual === false ? { manual: false } : {}),
  }))
}

export function reubicarTarea(
  cronograma: Cronograma,
  indice: number,
  fechaDestino: string,
  posicion: number,
): TareaEntrada[] {
  const actuales = tareasDelCronograma(cronograma)
  const desde = cronograma.tareas.findIndex((tarea) => tarea.indice === indice)
  if (desde < 0 || !esIso(fechaDestino)) return actuales

  const origen = cronograma.tareas[desde]
  const movida: TareaEntrada = { ...actuales[desde] }
  const restoTareas = cronograma.tareas.filter((tarea) => tarea.indice !== indice)
  const resto = actuales.filter((_, i) => i !== desde)
  const enDia = restoTareas.filter((tarea) => tarea.segmentos.some((segmento) => segmento.fecha === fechaDestino))
  const lugar = Number.isFinite(posicion) ? Math.max(0, Math.floor(posicion)) : 0

  let insertAt = resto.length
  if (enDia.length === 0) {
    insertAt = 0
    restoTareas.forEach((tarea, i) => {
      const fin = tarea.segmentos.at(-1)?.fecha ?? ''
      if (fin < fechaDestino) insertAt = i + 1
    })
  } else if (lugar >= enDia.length) {
    insertAt = restoTareas.findIndex((tarea) => tarea.indice === enDia[enDia.length - 1].indice) + 1
  } else {
    insertAt = restoTareas.findIndex((tarea) => tarea.indice === enDia[lugar].indice)
  }

  const inicio = origen.segmentos[0]?.fecha ?? fechaDestino
  const tocaDestino = origen.segmentos.some((segmento) => segmento.fecha === fechaDestino)
  if (fechaDestino < cronograma.fechaInicio || (!tocaDestino && fechaDestino < inicio)) {
    delete movida.noAntesDe
  } else if (!tocaDestino && fechaDestino > inicio) {
    movida.noAntesDe = fechaDestino
  }

  const copia = [...resto]
  copia.splice(Math.max(0, Math.min(insertAt, copia.length)), 0, movida)
  return copia
}

export function insertarTareaEnDia(cronograma: Cronograma, tarea: TareaEntrada, fechaDestino: string): TareaEntrada[] {
  const actuales = tareasDelCronograma(cronograma)
  if (!esIso(fechaDestino)) return actuales

  const enDia = cronograma.tareas.filter((item) => item.segmentos.some((segmento) => segmento.fecha === fechaDestino))
  const continuaciones = enDia.filter((item) => (item.segmentos[0]?.fecha ?? fechaDestino) < fechaDestino)

  let insertAt = actuales.length
  if (continuaciones.length > 0) {
    const ultima = continuaciones[continuaciones.length - 1]
    insertAt = cronograma.tareas.findIndex((item) => item.indice === ultima.indice) + 1
  } else if (enDia.length > 0) {
    insertAt = cronograma.tareas.findIndex((item) => item.indice === enDia[0].indice)
  } else {
    insertAt = 0
    cronograma.tareas.forEach((item, indice) => {
      const fin = item.segmentos.at(-1)?.fecha ?? ''
      if (fin < fechaDestino) insertAt = indice + 1
    })
  }

  const nueva: TareaEntrada = {
    nombre: tarea.nombre,
    horas: tarea.horas,
    notas: tarea.notas?.trim() ?? '',
    manual: true,
  }
  if (fechaDestino >= cronograma.fechaInicio) nueva.noAntesDe = fechaDestino

  const copia = [...actuales]
  copia.splice(Math.max(0, Math.min(insertAt, copia.length)), 0, nueva)
  return copia
}
