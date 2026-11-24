import { crearPlantilla } from '@/lib/excel'

export async function GET() {
  const archivo = await crearPlantilla()

  return new Response(new Uint8Array(archivo), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-tareas.xlsx"',
    },
  })
}
