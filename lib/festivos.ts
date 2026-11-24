import { aIso, sumarDias } from '@/lib/fechas'

const cache = new Map<number, Map<string, string>>()

function trasladarALunes(fecha: Date): Date {
  const dia = fecha.getDay()
  if (dia === 1) return fecha
  const salto = dia === 0 ? 1 : 8 - dia
  return sumarDias(fecha, salto)
}

function domingoDePascua(anio: number): Date {
  const a = anio % 19
  const b = Math.floor(anio / 100)
  const c = anio % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(anio, mes - 1, dia)
}

function agregar(mapa: Map<string, string>, fecha: Date, nombre: string) {
  const clave = aIso(fecha)
  const previo = mapa.get(clave)
  mapa.set(clave, previo ? `${previo} · ${nombre}` : nombre)
}

export function festivosDelAno(anio: number): Map<string, string> {
  const guardado = cache.get(anio)
  if (guardado) return guardado

  const mapa = new Map<string, string>()
  const fijos: [number, number, string][] = [
    [1, 1, 'Año Nuevo'],
    [5, 1, 'Día del Trabajo'],
    [7, 20, 'Independencia de Colombia'],
    [8, 7, 'Batalla de Boyacá'],
    [12, 8, 'Inmaculada Concepción'],
    [12, 25, 'Navidad'],
  ]
  const emiliani: [number, number, string][] = [
    [1, 6, 'Epifanía (Reyes Magos)'],
    [3, 19, 'San José'],
    [6, 29, 'San Pedro y San Pablo'],
    [8, 15, 'Asunción de la Virgen'],
    [10, 12, 'Día de la Raza'],
    [11, 1, 'Todos los Santos'],
    [11, 11, 'Independencia de Cartagena'],
  ]

  for (const [mes, dia, nombre] of fijos) {
    agregar(mapa, new Date(anio, mes - 1, dia), nombre)
  }

  for (const [mes, dia, nombre] of emiliani) {
    agregar(mapa, trasladarALunes(new Date(anio, mes - 1, dia)), nombre)
  }

  const pascua = domingoDePascua(anio)
  agregar(mapa, sumarDias(pascua, -3), 'Jueves Santo')
  agregar(mapa, sumarDias(pascua, -2), 'Viernes Santo')
  agregar(mapa, trasladarALunes(sumarDias(pascua, 39)), 'Ascensión del Señor')
  agregar(mapa, trasladarALunes(sumarDias(pascua, 60)), 'Corpus Christi')
  agregar(mapa, trasladarALunes(sumarDias(pascua, 68)), 'Sagrado Corazón')

  cache.set(anio, mapa)
  return mapa
}

export function festivoEn(fecha: Date): string | undefined {
  return festivosDelAno(fecha.getFullYear()).get(aIso(fecha))
}

export function domingoDePascuaIso(anio: number): string {
  return aIso(domingoDePascua(anio))
}
