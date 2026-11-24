import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, unstable_rethrow } from 'next/navigation'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { AvisoMongo } from '@/components/AvisoMongo'
import { Cargando } from '@/components/Cargando'
import { FormularioProyecto } from '@/components/FormularioProyecto'
import { esErrorDeConexion } from '@/lib/db'
import { obtenerProyecto } from '@/lib/datos'

export const metadata: Metadata = {
  title: 'Editar proyecto',
}

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
        <h1 className="mt-3 font-display text-5xl tracking-tight">Editar proyecto</h1>
        <div className="mt-8 rounded-3xl border border-line bg-paper-2 p-6">
          <FormularioProyecto id={proyecto.id} nombre={proyecto.nombre} descripcion={proyecto.descripcion} />
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
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Suspense fallback={<Cargando texto="Abriendo el proyecto…" />}>
        <Contenido params={params} />
      </Suspense>
    </main>
  )
}
