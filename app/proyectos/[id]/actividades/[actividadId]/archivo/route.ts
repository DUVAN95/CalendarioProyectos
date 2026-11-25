import { connection } from 'next/server'
import { obtenerActividad } from '@/lib/datos'
import { exportarTareas } from '@/lib/excel'
import { etiquetaCreacion } from '@/lib/fechas'

function nombreDescarga(fecha: Date): string {
  const hora = String(fecha.getHours()).padStart(2, '0')
  const minuto = String(fecha.getMinutes()).padStart(2, '0')
  return `resumen evento ${etiquetaCreacion(fecha)} ${hora}-${minuto}.xlsx`
}

export async function GET(_request: Request, contexto: { params: Promise<{ id: string; actividadId: string }> }) {
  await connection()
  const { id, actividadId } = await contexto.params
  const actividad = await obtenerActividad(id, actividadId)

  if (!actividad) {
    return new Response('No se encontró el archivo.', { status: 404 })
  }

  const datos = await exportarTareas(actividad.tareas)
  const nombre = nombreDescarga(new Date())

  return new Response(new Uint8Array(datos), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${nombre}"; filename*=UTF-8''${encodeURIComponent(nombre)}`,
    },
  })
}
