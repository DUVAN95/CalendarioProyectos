import Link from 'next/link'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { AvisoMongo } from '@/components/AvisoMongo'
import { Cargando } from '@/components/Cargando'
import { esErrorDeConexion } from '@/lib/db'
import { listarProyectos, type ProyectoVista } from '@/lib/datos'

function textoActividades(cantidad: number): string {
  if (cantidad === 0) return 'Sin actividades'
  if (cantidad === 1) return '1 actividad'
  return `${cantidad} actividades`
}

function Lista({ proyectos }: { proyectos: ProyectoVista[] }) {
  if (proyectos.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-paper-2 px-6 py-12">
        <h2 className="font-display text-3xl">Todavía no hay proyectos</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
          Crea un proyecto y, dentro, sube un Excel. Cada archivo se convierte en una actividad con su propio calendario.
        </p>
        <Link href="/proyectos/nuevo" className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper">
          Crear el primero
        </Link>
      </div>
    )
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {proyectos.map((proyecto) => (
        <li key={proyecto.id}>
          <Link
            href={`/proyectos/${proyecto.id}`}
            className="flex h-full flex-col rounded-3xl border border-line bg-paper-2 p-6 transition hover:-translate-y-0.5 hover:border-ink/25"
          >
            <h2 className="font-display text-3xl leading-tight">{proyecto.nombre}</h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-muted">{proyecto.descripcion || 'Sin descripción'}</p>
            <p className="mt-6 text-sm">
              {textoActividades(proyecto.actividades)}
              <span className="text-muted"> · {proyecto.creadoEnTexto}</span>
            </p>
          </Link>
        </li>
      ))}
    </ul>
  )
}

async function Contenido() {
  await connection()

  try {
    const proyectos = await listarProyectos()
    return <Lista proyectos={proyectos} />
  } catch (error) {
    console.error(error)
    if (esErrorDeConexion(error)) return <AvisoMongo />
    throw error
  }
}

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm uppercase tracking-[0.16em] text-accent">Proyectos</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="max-w-xl font-display text-5xl leading-none tracking-tight">Calendario de actividades</h1>
        <p className="max-w-sm text-sm leading-6 text-muted">
          Asocia un Excel de tareas y horas a un proyecto. La actividad dibuja de qué día a qué día llega cada una.
        </p>
      </div>
      <div className="mt-10">
        <Suspense fallback={<Cargando texto="Buscando proyectos…" />}>
          <Contenido />
        </Suspense>
      </div>
    </main>
  )
}
