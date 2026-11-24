import Link from 'next/link'
import { notFound, unstable_rethrow } from 'next/navigation'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { eliminarActividad } from '@/lib/acciones'
import { AvisoMongo } from '@/components/AvisoMongo'
import { BotonEliminar } from '@/components/BotonEliminar'
import { Cargando } from '@/components/Cargando'
import { PlanActividad } from '@/components/PlanActividad'
import { btnSecundario } from '@/components/estilos'
import { esErrorDeConexion } from '@/lib/db'
import { obtenerActividad, obtenerProyecto } from '@/lib/datos'
import { aIso } from '@/lib/fechas'
import { programar } from '@/lib/jornada'

async function Contenido({ params }: { params: Promise<{ id: string; actividadId: string }> }) {
  await connection()
  const { id, actividadId } = await params

  try {
    const proyecto = await obtenerProyecto(id)
    if (!proyecto) notFound()
    const actividad = await obtenerActividad(id, actividadId)
    if (!actividad) notFound()

    let cronograma: ReturnType<typeof programar>
    try {
      cronograma = programar(actividad.fechaInicio, actividad.tareas)
    } catch (error) {
      console.error(error)
      return <p className="text-sm text-ink">No se pudo armar el calendario con las tareas guardadas.</p>
    }

    return (
      <>
        <nav className="text-sm text-muted">
          <Link href="/" className="hover:text-ink">
            Proyectos
          </Link>
          <span> / </span>
          <Link href={`/proyectos/${proyecto.id}`} className="hover:text-ink">
            {proyecto.nombre}
          </Link>
          <span> / </span>
          <span className="text-ink">{actividad.nombre}</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl tracking-tight">{actividad.nombre}</h1>
            <p className="mt-2 text-sm text-muted">
              {actividad.archivoNombre}
              {actividad.hoja ? ` · hoja ${actividad.hoja}` : ''} · {actividad.creadoEnTexto}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/proyectos/${proyecto.id}/actividades/${actividad.id}/editar`} className={btnSecundario}>
              Editar
            </Link>
            <a href={`/proyectos/${proyecto.id}/actividades/${actividad.id}/archivo`} className={btnSecundario}>
              Descargar Excel
            </a>
          </div>
        </div>

        <PlanActividad proyectoId={proyecto.id} actividadId={actividad.id} cronograma={cronograma} hoy={aIso(new Date())} />

        <div className="mt-8">
          <BotonEliminar
            action={eliminarActividad.bind(null, proyecto.id, actividad.id)}
            confirmar={`¿Eliminar la actividad «${actividad.nombre}» y su Excel?`}
          >
            Eliminar actividad
          </BotonEliminar>
        </div>
      </>
    )
  } catch (error) {
    unstable_rethrow(error)
    console.error(error)
    if (esErrorDeConexion(error)) return <AvisoMongo />
    throw error
  }
}

export default function Page({ params }: { params: Promise<{ id: string; actividadId: string }> }) {
  return (
    <main className="px-4 py-8 sm:px-6">
      <Suspense fallback={<Cargando texto="Armando el calendario…" />}>
        <Contenido params={params} />
      </Suspense>
    </main>
  )
}
