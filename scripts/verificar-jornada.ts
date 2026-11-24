import { Workbook } from 'exceljs'
import { crearPlantilla, leerExcel } from '../lib/excel'
import { aIso, desdeIso } from '../lib/fechas'
import { domingoDePascuaIso, festivoEn } from '../lib/festivos'
import { capacidadDelDia, programar, reubicarTarea, type Cronograma } from '../lib/jornada'

function afirmar(condicion: unknown, mensaje: string): asserts condicion {
  if (!condicion) throw new Error(mensaje)
}

function tramo(cronograma: Cronograma, tarea: number, fecha: string) {
  return cronograma.tareas[tarea]?.segmentos.find((segmento) => segmento.fecha === fecha)
}

function exigir(cronograma: Cronograma, tarea: number, fecha: string, horas: number, desplazamiento: number, capacidad: number) {
  const segmento = tramo(cronograma, tarea, fecha)
  afirmar(segmento, `Falta ${fecha} en la tarea ${tarea + 1}`)
  afirmar(segmento.horas === horas, `${fecha} tarea ${tarea + 1}: horas ${segmento.horas}, se esperaban ${horas}`)
  afirmar(
    segmento.desplazamientoHoras === desplazamiento,
    `${fecha} tarea ${tarea + 1}: desplazamiento ${segmento.desplazamientoHoras}, se esperaba ${desplazamiento}`,
  )
  afirmar(
    segmento.capacidadHoras === capacidad,
    `${fecha} tarea ${tarea + 1}: capacidad ${segmento.capacidadHoras}, se esperaban ${capacidad}`,
  )
}

async function main() {
afirmar(domingoDePascuaIso(2024) === '2024-03-31', 'Pascua 2024')
afirmar(domingoDePascuaIso(2025) === '2025-04-20', 'Pascua 2025')
afirmar(domingoDePascuaIso(2026) === '2026-04-05', 'Pascua 2026')

afirmar(festivoEn(desdeIso('2026-01-01')) === 'Año Nuevo', 'Año Nuevo')
afirmar(festivoEn(desdeIso('2026-01-12'))?.includes('Epifanía'), 'Reyes Magos se traslada al lunes 12')
afirmar(festivoEn(desdeIso('2026-01-06')) === undefined, 'El 6 de enero no se trabaja si no cae lunes')
afirmar(festivoEn(desdeIso('2026-03-23'))?.includes('San José'), 'San José pasa al lunes 23')
afirmar(festivoEn(desdeIso('2026-03-19')) === undefined, 'El 19 de marzo no es hábil de festivo en 2026')
afirmar(festivoEn(desdeIso('2026-04-02')) === 'Jueves Santo', 'Jueves Santo')
afirmar(festivoEn(desdeIso('2026-04-03')) === 'Viernes Santo', 'Viernes Santo')
afirmar(festivoEn(desdeIso('2026-05-01')) === 'Día del Trabajo', 'Primero de mayo')
afirmar(festivoEn(desdeIso('2026-05-18'))?.includes('Ascensión'), 'Ascensión')
afirmar(festivoEn(desdeIso('2026-06-08'))?.includes('Corpus'), 'Corpus Christi')
afirmar(festivoEn(desdeIso('2026-06-15'))?.includes('Sagrado Corazón'), 'Sagrado Corazón')
afirmar(festivoEn(desdeIso('2026-07-20'))?.includes('Independencia de Colombia'), '20 de julio')
afirmar(festivoEn(desdeIso('2026-12-25')) === 'Navidad', 'Navidad')

afirmar(capacidadDelDia(desdeIso('2026-03-06')).minutos === 6 * 60, 'Viernes normal de 6 h')
afirmar(capacidadDelDia(desdeIso('2026-03-06')).viernesAmpliado === false, 'Viernes normal no está ampliado')
afirmar(capacidadDelDia(desdeIso('2026-01-16')).minutos === 8 * 60, 'Viernes de la semana de Reyes dura 8 h')
afirmar(capacidadDelDia(desdeIso('2026-01-16')).viernesAmpliado, 'Ese viernes queda marcado como ampliado')
afirmar(capacidadDelDia(desdeIso('2026-05-01')).minutos === 0, 'Un viernes festivo no se trabaja')
afirmar(capacidadDelDia(desdeIso('2026-03-07')).minutos === 0, 'El sábado no tiene jornada')

const semanaNormal = programar('2026-03-02', [
  { nombre: 'Diseño', horas: 10 },
  { nombre: 'Construcción', horas: 20 },
  { nombre: 'Pruebas', horas: 6 },
])

afirmar(semanaNormal.fechaFin === '2026-03-06', 'La semana normal termina el viernes 6')
exigir(semanaNormal, 0, '2026-03-02', 8, 0, 8)
exigir(semanaNormal, 0, '2026-03-03', 2, 0, 8)
afirmar(tramo(semanaNormal, 0, '2026-03-02')?.texto === '8 h de 10 h', 'El tramo indica las horas de la tarea, no las del día')
afirmar(tramo(semanaNormal, 0, '2026-03-03')?.texto === '2 h de 10 h', 'El segundo tramo también usa el total de la tarea')
afirmar(tramo(semanaNormal, 2, '2026-03-06')?.texto === '4 h de 6 h', 'El viernes muestra las horas de la tarea y no las 6 h del día')
exigir(semanaNormal, 1, '2026-03-03', 6, 2, 8)
exigir(semanaNormal, 1, '2026-03-04', 8, 0, 8)
exigir(semanaNormal, 1, '2026-03-05', 6, 0, 8)
exigir(semanaNormal, 2, '2026-03-05', 2, 6, 8)
exigir(semanaNormal, 2, '2026-03-06', 4, 0, 6)
afirmar(semanaNormal.semanas[0]?.dias[4]?.capacidadTexto === '6 h', 'El viernes se etiqueta como 6 h')

const semanaReyes = programar('2026-01-13', [{ nombre: 'Cierre', horas: 32 }])
afirmar(semanaReyes.fechaFin === '2026-01-16', 'Con el viernes ampliado, 32 h caben de martes a viernes')
exigir(semanaReyes, 0, '2026-01-16', 8, 0, 8)
afirmar(semanaReyes.semanas[0]?.viernesAmpliado, 'La semana de Reyes marca el viernes ampliado')

const inicioFestivo = programar('2026-01-12', [{ nombre: 'Arranque', horas: 8 }])
afirmar(inicioFestivo.fechaInicio === '2026-01-13', 'Si el inicio es festivo, empieza al día siguiente')
afirmar(inicioFestivo.ajuste?.includes('Epifanía'), 'El aviso nombra el festivo')
afirmar(inicioFestivo.fechaFin === '2026-01-13', 'Ocho horas ocupan solo el martes')

const semanaSanta = programar('2026-03-30', [{ nombre: 'Antes de semana santa', horas: 25 }])
afirmar(semanaSanta.fechaFin === '2026-04-06', 'Lo que no cabe antes del festivo salta al lunes')
exigir(semanaSanta, 0, '2026-03-30', 8, 0, 8)
exigir(semanaSanta, 0, '2026-04-01', 8, 0, 8)
exigir(semanaSanta, 0, '2026-04-06', 1, 0, 8)
afirmar(!tramo(semanaSanta, 0, '2026-04-02'), 'Jueves Santo no recibe trabajo')
afirmar(!tramo(semanaSanta, 0, '2026-04-03'), 'Viernes Santo no recibe trabajo')

const viernesFestivo = programar('2026-04-30', [{ nombre: 'Cruce de mayo', horas: 10 }])
afirmar(viernesFestivo.fechaFin === '2026-05-04', 'El viernes 1 de mayo se salta')
exigir(viernesFestivo, 0, '2026-04-30', 8, 0, 8)
exigir(viernesFestivo, 0, '2026-05-04', 2, 0, 8)

const finDeSemana = programar('2026-03-07', [{ nombre: 'Lunes', horas: 8 }])
afirmar(finDeSemana.fechaInicio === '2026-03-09', 'Un sábado empieza el lunes')
afirmar(finDeSemana.ajuste?.includes('fin de semana'), 'El aviso explica el fin de semana')

const plantilla = await leerExcel(await crearPlantilla())
afirmar(plantilla.ok, 'La plantilla debe leerse')
if (plantilla.ok) {
  afirmar(plantilla.tareas.length === 4, 'La plantilla trae 4 tareas de ejemplo')
  afirmar(plantilla.tareas[1]?.horas === 10, 'La segunda tarea de la plantilla dura 10 h')
}

const conComa = new Workbook()
const hojaComa = conComa.addWorksheet('Datos')
hojaComa.addRow(['Tarea', 'Horas estimadas', 'Notas'])
hojaComa.addRow(['Medio día', '2,5', 'detalle'])
hojaComa.addRow(['Total', 2.5, ''])
const leidoComa = await leerExcel(Buffer.from(await conComa.xlsx.writeBuffer()))
afirmar(leidoComa.ok && leidoComa.tareas.length === 1 && leidoComa.tareas[0]?.horas === 2.5, 'Acepta decimales con coma y omite la fila Total')

const sinEncabezado = new Workbook()
sinEncabezado.addWorksheet('Lista').addRow(['Tarea suelta', 4])
const leidoSuelto = await leerExcel(Buffer.from(await sinEncabezado.xlsx.writeBuffer()))
afirmar(leidoSuelto.ok && leidoSuelto.tareas[0]?.nombre === 'Tarea suelta', 'Acepta un Excel sin encabezados')

const roto = new Workbook()
roto.addWorksheet('Datos').addRows([
  ['Tarea', 'Horas'],
  ['Incompleta', 'abc'],
])
const leidoRoto = await leerExcel(Buffer.from(await roto.xlsx.writeBuffer()))
afirmar(!leidoRoto.ok && leidoRoto.error.includes('Fila'), 'Una hora inválida explica la fila')

const mismoDia = programar('2026-03-02', [
  { nombre: 'A', horas: 3 },
  { nombre: 'B', horas: 5 },
])
const reorden = programar('2026-03-02', reubicarTarea(mismoDia, 2, '2026-03-02', 0))
afirmar(reorden.tareas[0]?.nombre === 'B', 'Reordenar deja primero a la tarea soltada')
const marcada = programar('2026-03-02', [{ nombre: 'Cierre', horas: 3, color: '#c24d2c', finalizada: true }])
afirmar(marcada.tareas[0]?.finalizada === true, 'La marca de finalizada se conserva')
afirmar(marcada.tareas[0]?.color === '#c24d2c', 'Finalizar no reemplaza el color guardado')
afirmar(reorden.tareas[0]?.color === mismoDia.tareas[1]?.color, 'La tarea movida conserva su color')
afirmar(reorden.tareas[1]?.color === mismoDia.tareas[0]?.color, 'La otra tarea también conserva su color')
exigir(reorden, 0, '2026-03-02', 5, 0, 8)
exigir(reorden, 1, '2026-03-02', 3, 5, 8)
afirmar(!reorden.tareas[0]?.noAntesDe, 'Reordenar en el mismo día no ancla la tarea')

const dosDias = programar('2026-03-02', [
  { nombre: 'A', horas: 8 },
  { nombre: 'B', horas: 8 },
])
const alViernes = programar('2026-03-02', reubicarTarea(dosDias, 2, '2026-03-06', 0))
afirmar(alViernes.tareas[1]?.noAntesDe === '2026-03-06', 'Mover a un día posterior no deja que la tarea empiece antes')
exigir(alViernes, 0, '2026-03-02', 8, 0, 8)
exigir(alViernes, 1, '2026-03-06', 6, 0, 6)
exigir(alViernes, 1, '2026-03-09', 2, 0, 8)

const masTemprano = programar('2026-03-02', reubicarTarea(dosDias, 2, '2026-03-02', 0))
afirmar(!masTemprano.tareas[0]?.noAntesDe, 'Mover a un día anterior quita el ancla')
exigir(masTemprano, 0, '2026-03-02', 8, 0, 8)
exigir(masTemprano, 1, '2026-03-03', 8, 0, 8)
afirmar(masTemprano.tareas[0]?.nombre === 'B', 'La tarea soltada al inicio del lunes queda primera')

const santaMovida = programar('2026-03-30', reubicarTarea(semanaSanta, 1, '2026-04-02', 0))
exigir(santaMovida, 0, '2026-04-06', 8, 0, 8)
afirmar(!tramo(santaMovida, 0, '2026-04-02'), 'Soltar en Jueves Santo pasa la tarea al siguiente día hábil')
afirmar(!tramo(santaMovida, 0, '2026-04-03'), 'Soltar en Jueves Santo tampoco ocupa el Viernes Santo')

console.log(`Calendario verificado. Semana de ejemplo: ${semanaNormal.rango}, ${semanaNormal.horasTexto}.`)
console.log(aIso(desdeIso('2026-03-02')))
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
