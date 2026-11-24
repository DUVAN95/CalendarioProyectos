import { obtenerArchivo } from '@/lib/datos'

export async function GET(_request: Request, contexto: { params: Promise<{ id: string; actividadId: string }> }) {
  const { id, actividadId } = await contexto.params
  const archivo = await obtenerArchivo(id, actividadId)

  if (!archivo) {
    return new Response('No se encontró el archivo.', { status: 404 })
  }

  const nombre = archivo.nombre.replace(/[\r\n"]/g, '') || 'tareas.xlsx'

  return new Response(new Uint8Array(archivo.datos), {
    headers: {
      'Content-Type': archivo.tipo || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${nombre}"; filename*=UTF-8''${encodeURIComponent(archivo.nombre)}`,
    },
  })
}
