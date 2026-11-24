const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'] as const
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const

export function inicioDeDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}

export function sumarDias(fecha: Date, dias: number): Date {
  const copia = inicioDeDia(fecha)
  copia.setDate(copia.getDate() + dias)
  return copia
}

export function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

export function desdeIso(iso: string): Date {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!coincidencia) {
    throw new Error('Fecha inválida')
  }

  const anio = Number(coincidencia[1])
  const mes = Number(coincidencia[2])
  const dia = Number(coincidencia[3])
  const fecha = new Date(anio, mes - 1, dia)

  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
    throw new Error('Fecha inválida')
  }

  return fecha
}

export function esIso(valor: string): boolean {
  try {
    desdeIso(valor)
    return true
  } catch {
    return false
  }
}

export function lunesDeLaSemana(fecha: Date): Date {
  const dia = fecha.getDay()
  const retroceso = dia === 0 ? 6 : dia - 1
  return sumarDias(fecha, -retroceso)
}

export function etiquetaCorta(iso: string): string {
  const fecha = desdeIso(iso)
  return `${DIAS_CORTOS[fecha.getDay()]} ${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]}`
}

export function etiquetaLarga(iso: string): string {
  const fecha = desdeIso(iso)
  return `${DIAS[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`
}

export function etiquetaSemana(lunesIso: string): string {
  const lunes = desdeIso(lunesIso)
  const viernes = sumarDias(lunes, 4)

  if (lunes.getMonth() === viernes.getMonth()) {
    return `${lunes.getDate()} al ${viernes.getDate()} de ${MESES[lunes.getMonth()]}`
  }

  return `${lunes.getDate()} ${MESES_CORTOS[lunes.getMonth()]} al ${viernes.getDate()} ${MESES_CORTOS[viernes.getMonth()]}`
}

export function diaCorto(iso: string): string {
  return DIAS_CORTOS[desdeIso(iso).getDay()]
}

export function mesCorto(iso: string): string {
  return MESES_CORTOS[desdeIso(iso).getMonth()]
}

export function etiquetaCreacion(fecha: Date): string {
  return `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]} ${fecha.getFullYear()}`
}

export function textoHoras(horas: number): string {
  const redondeadas = Math.round(horas * 100) / 100
  const signo = redondeadas < 0 ? '-' : ''
  const [entera, decimal] = Math.abs(redondeadas).toFixed(2).split('.')
  const visible = decimal === '00' ? entera : decimal.endsWith('0') ? `${entera},${decimal[0]}` : `${entera},${decimal}`
  return `${signo}${visible} h`
}
