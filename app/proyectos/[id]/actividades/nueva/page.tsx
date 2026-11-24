import Link from 'next/link'
import { notFound, unstable_rethrow } from 'next/navigation'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { AvisoMongo } from '@/components/AvisoMongo'
import { Cargando } from '@/components/Cargando'
import { FormularioActividad } from '@/components/FormularioActividad'
import { ReglasJornada } from '@/components/ReglasJornada'
import { esErrorDeConexion } from '@/lib/db'
import { obtenerProyecto } from '@/lib/datos'
import { sugerirInicio } from '@/lib/jornada'

async function Contenido({ params }: { params: Promise<{ id: string }> }) {
  await connection()
  const { id } = await params

  try {
    const proyecto = await obtenerProyecto(id)
    if (!proyecto) notFound()

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
        </nav>
        <h1 className="mt-3 font-display text-5xl tracking-tight">Nueva actividad</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
          El Excel queda asociado a {proyecto.nombre}. Con las horas se calcula hasta qué día llega cada tarea.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="rounded-3xl border border-line bg-paper-2 p-6">
            <FormularioActividad proyectoId={proyecto.id} fechaSugerida={sugerirInicio()} />
          </div>
          <aside className="rounded-3xl border border-line bg-soft/50 p-6">
            <h2 className="font-display text-2xl">Cómo se reparte</h2>
            <div className="mt-4">
              <ReglasJornada />
            </div>
          </aside>
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

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Suspense fallback={<Cargando texto="Preparando el formulario…" />}>
        <Contenido params={params} />
      </Suspense>
    </main>
  )
}
