import { Workbook, type CellValue } from 'exceljs'
import { aIso, esIso } from '@/lib/fechas'
import { esColorDeTarea } from '@/lib/jornada'

export type TareaExcel = {
  nombre: string
  horas: number
  notas: string
  noAntesDe?: string
  color?: string
  finalizada?: boolean
}

export type ResultadoExcel =
  | { ok: true; tareas: TareaExcel[]; hoja: string }
  | { ok: false; error: string }

const MAX_TAREAS = 400
const MAX_HORAS = 5000

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

function leerValor(valor: CellValue): string | number | null {
  if (valor == null) return null
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor
  if (typeof valor === 'string') return valor.trim()
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No'
  if (valor instanceof Date) return aIso(valor)

  if (typeof valor === 'object') {
    if ('richText' in valor && Array.isArray(valor.richText)) {
      return valor.richText.map((parte) => parte.text).join('').trim()
    }
    if ('text' in valor && typeof valor.text === 'string') return valor.text.trim()
    if ('result' in valor) {
      if (typeof valor.result === 'number' && Number.isFinite(valor.result)) return valor.result
      if (typeof valor.result === 'string') return valor.result.trim()
      if (valor.result instanceof Date) return aIso(valor.result)
    }
  }

  return null
}

export function validarTareasManuales(
  filas: { nombre: string; horas: string; notas: string; noAntesDe?: string; color?: string; finalizada?: string }[],
): { ok: true; tareas: TareaExcel[] } | { ok: false; error: string } {
  if (filas.length === 0) {
    return { ok: false, error: 'La actividad necesita al menos una tarea.' }
  }

  if (filas.length > MAX_TAREAS) {
    return { ok: false, error: `No puedes guardar más de ${MAX_TAREAS} tareas.` }
  }

  const tareas: TareaExcel[] = []
  const errores: string[] = []

  filas.forEach((fila, indice) => {
    const nombre = fila.nombre.trim()
    const notas = fila.notas.trim()
    const numero = indice + 1

    if (!nombre) {
      errores.push(`Tarea ${numero}: falta el nombre.`)
      return
    }

    const horas = aNumero(fila.horas)
    if (horas == null) {
      errores.push(`Tarea ${numero}: las horas de «${nombre}» no son un número.`)
      return
    }

    const minutos = Math.round(horas * 60)
    if (minutos <= 0) {
      errores.push(`Tarea ${numero}: «${nombre}» debe tener al menos un minuto.`)
      return
    }

    if (horas > MAX_HORAS) {
      errores.push(`Tarea ${numero}: «${nombre}» supera ${MAX_HORAS} horas.`)
      return
    }

    const ancla = fila.noAntesDe?.trim() ?? ''
    const color = fila.color?.trim().toLowerCase()
    tareas.push({
      nombre: nombre.slice(0, 180),
      horas: minutos / 60,
      notas: notas.slice(0, 500),
      ...(esIso(ancla) ? { noAntesDe: ancla } : {}),
      ...(esColorDeTarea(color) ? { color } : {}),
      ...(fila.finalizada === '1' ? { finalizada: true } : {}),
    })
  })

  if (errores.length > 0) {
    return { ok: false, error: errores.slice(0, 5).join(' ') }
  }

  return { ok: true, tareas }
}

function aNumero(valor: string | number | null): number | null {
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor
  if (typeof valor !== 'string') return null

  const limpio = valor
    .trim()
    .toLowerCase()
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/horas?$/, '')
    .replace(/h$/, '')

  if (!limpio) return null
  const numero = Number(limpio)
  return Number.isFinite(numero) ? numero : null
}

function aTexto(valor: string | number | null): string {
  if (valor == null) return ''
  return String(valor).trim()
}

function pareceEncabezado(celdas: (string | number | null)[]): boolean {
  return celdas.some((celda) => {
    if (typeof celda !== 'string') return false
    const texto = normalizar(celda)
    return (
      texto === 'tarea' ||
      texto === 'nombre' ||
      texto === 'actividad' ||
      texto === 'notas' ||
      texto === 'nota' ||
      texto.includes('hora')
    )
  })
}

function indiceColumna(celdas: (string | number | null)[], opciones: string[], contiene: string): number {
  const textos = celdas.map((celda) => (typeof celda === 'string' ? normalizar(celda) : ''))
  const exacto = textos.findIndex((texto) => opciones.includes(texto))
  if (exacto >= 0) return exacto
  return textos.findIndex((texto) => texto.includes(contiene))
}

export async function leerExcel(contenido: Buffer): Promise<ResultadoExcel> {
  if (contenido.length < 4 || contenido[0] !== 0x50 || contenido[1] !== 0x4b) {
    return { ok: false, error: 'El archivo no parece un Excel .xlsx. Guárdalo como Libro de Excel.' }
  }

  const libro = new Workbook()

  try {
    await libro.xlsx.load(contenido as unknown as Parameters<Workbook['xlsx']['load']>[0])
  } catch {
    return { ok: false, error: 'No se pudo leer el Excel. Revisa que el archivo no esté dañado.' }
  }

  const hoja = libro.worksheets.find((candidata) => candidata.actualRowCount > 0) ?? libro.worksheets[0]
  if (!hoja) {
    return { ok: false, error: 'El archivo no tiene hojas.' }
  }

  const filas: { numero: number; celdas: (string | number | null)[] }[] = []

  hoja.eachRow({ includeEmpty: false }, (fila, numero) => {
    const cantidad = Math.max(fila.cellCount, 3)
    const celdas: (string | number | null)[] = []
    for (let columna = 1; columna <= cantidad; columna += 1) {
      celdas.push(leerValor(fila.getCell(columna).value))
    }
    if (celdas.some((celda) => aTexto(celda) !== '')) {
      filas.push({ numero, celdas })
    }
  })

  if (filas.length === 0) {
    return { ok: false, error: 'La hoja está vacía. Usa las columnas Tarea y Horas estimadas.' }
  }

  const encabezado = pareceEncabezado(filas[0].celdas)
  const columnas = encabezado ? filas[0].celdas : []
  const columnaNombre = encabezado ? Math.max(indiceColumna(columnas, ['tarea', 'nombre', 'actividad', 'descripcion', 'titulo'], 'tarea'), 0) : 0
  const columnaHoras = encabezado ? Math.max(indiceColumna(columnas, ['horas', 'horas estimadas', 'hora', 'estimacion', 'tiempo', 'duracion'], 'hora'), 1) : 1
  const columnaNotas = encabezado ? indiceColumna(columnas, ['notas', 'nota', 'observaciones', 'comentario', 'comentarios', 'detalle'], 'nota') : 2
  const datos = encabezado ? filas.slice(1) : filas
  const tareas: TareaExcel[] = []
  const errores: string[] = []

  for (const fila of datos) {
    const nombre = aTexto(fila.celdas[columnaNombre] ?? null)
    const notas = columnaNotas >= 0 ? aTexto(fila.celdas[columnaNotas] ?? null) : ''
    const horas = aNumero(fila.celdas[columnaHoras] ?? null)
    const nombreNormalizado = normalizar(nombre)

    if (!nombre && horas == null && !notas) continue
    if (['total', 'totales', 'suma'].includes(nombreNormalizado)) continue

    if (!nombre) {
      errores.push(`Fila ${fila.numero}: falta el nombre de la tarea.`)
      continue
    }

    if (horas == null) {
      errores.push(`Fila ${fila.numero}: las horas de «${nombre}» no son un número.`)
      continue
    }

    const minutos = Math.round(horas * 60)
    if (minutos <= 0) {
      errores.push(`Fila ${fila.numero}: «${nombre}» debe tener al menos un minuto.`)
      continue
    }

    if (horas > MAX_HORAS) {
      errores.push(`Fila ${fila.numero}: «${nombre}» supera ${MAX_HORAS} horas.`)
      continue
    }

    tareas.push({
      nombre: nombre.slice(0, 180),
      horas: minutos / 60,
      notas: notas.slice(0, 500),
    })
  }

  if (errores.length > 0) {
    return { ok: false, error: errores.slice(0, 5).join(' ') }
  }

  if (tareas.length === 0) {
    return { ok: false, error: 'No encontré tareas. La primera columna es el nombre y la segunda, las horas.' }
  }

  if (tareas.length > MAX_TAREAS) {
    return { ok: false, error: `El archivo tiene más de ${MAX_TAREAS} tareas.` }
  }

  return { ok: true, tareas, hoja: hoja.name }
}

export async function crearPlantilla(): Promise<Buffer> {
  const libro = new Workbook()
  const hoja = libro.addWorksheet('Tareas')
  hoja.columns = [
    { header: 'Tarea', key: 'tarea', width: 42 },
    { header: 'Horas estimadas', key: 'horas', width: 20 },
    { header: 'Notas', key: 'notas', width: 36 },
  ]
  hoja.addRows([
    ['Levantamiento de información', 16, 'Ejemplo: se puede borrar'],
    ['Diseño de la solución', 10, ''],
    ['Construcción', 40, ''],
    ['Pruebas', 12, ''],
  ])
  hoja.getRow(1).font = { bold: true }
  const datos = await libro.xlsx.writeBuffer()
  return Buffer.from(datos)
}
