import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, unstable_rethrow } from 'next/navigation'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { AvisoMongo } from '@/components/AvisoMongo'
import { Cargando } from '@/components/Cargando'
import { FormularioEditarActividad } from '@/components/FormularioEditarActividad'
import { esErrorDeConexion } from '@/lib/db'
import { obtenerActividad, obtenerProyecto } from '@/lib/datos'

export const metadata: Metadata = {
  title: 'Editar actividad',
}

async function Contenido({ params }: { params: Promise<{ id: string; actividadId: string }> }) {
  await connection()
  const { id, actividadId } = await params

  try {
    const proyecto = await obtenerProyecto(id)
    if (!proyecto) notFound()
    const actividad = await obtenerActividad(id, actividadId)
    if (!actividad) notFound()

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
          <Link href={`/proyectos/${proyecto.id}/actividades/${actividad.id}`} className="hover:text-ink">
            {actividad.nombre}
          </Link>
        </nav>
        <h1 className="mt-3 font-display text-5xl tracking-tight">Editar actividad</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
          Puedes corregir el nombre, la fecha y las horas. El calendario se calcula de nuevo al guardar.
        </p>
        <div className="mt-8 rounded-3xl border border-line bg-paper-2 p-6">
          <FormularioEditarActividad
            proyectoId={proyecto.id}
            actividadId={actividad.id}
            nombre={actividad.nombre}
            fechaInicio={actividad.fechaInicio}
            tareasIniciales={actividad.tareas}
            archivoNombre={actividad.archivoNombre}
          />
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
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Suspense fallback={<Cargando texto="Abriendo la actividad…" />}>
        <Contenido params={params} />
      </Suspense>
    </main>
  )
}
