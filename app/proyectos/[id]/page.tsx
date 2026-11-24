import Link from 'next/link'
import { notFound, unstable_rethrow } from 'next/navigation'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { eliminarProyecto } from '@/lib/acciones'
import { AvisoMongo } from '@/components/AvisoMongo'
import { BotonEliminar } from '@/components/BotonEliminar'
import { Cargando } from '@/components/Cargando'
import { btn, btnSecundario } from '@/components/estilos'
import { esErrorDeConexion } from '@/lib/db'
import { listarActividades, obtenerProyecto, type ActividadResumen, type ProyectoVista } from '@/lib/datos'

function ListaActividades({ proyecto, actividades }: { proyecto: ProyectoVista; actividades: ActividadResumen[] }) {
  return (
    <>
      <Link href="/" className="text-sm text-muted hover:text-ink">
        Proyectos
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight">{proyecto.nombre}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{proyecto.descripcion || 'Sin descripción'}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/proyectos/${proyecto.id}/editar`} className={btnSecundario}>
            Editar proyecto
          </Link>
          <Link href={`/proyectos/${proyecto.id}/actividades/nueva`} className={btn}>
            Nueva actividad
          </Link>
        </div>
      </div>

      {actividades.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-line bg-paper-2 px-6 py-10">
          <h2 className="font-display text-3xl">Sube el primer Excel</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Cada archivo es una actividad. Con sus horas se arma un calendario de lunes a viernes.
          </p>
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-paper-2">
          {actividades.map((actividad) => (
            <li key={actividad.id} className="flex items-stretch">
              <Link href={`/proyectos/${proyecto.id}/actividades/${actividad.id}`} className="block min-w-0 flex-1 px-5 py-4 hover:bg-soft/50">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-2xl">{actividad.nombre}</h2>
                  <span className="text-sm text-muted">{actividad.creadoEnTexto}</span>
                </div>
                <p className="mt-1 text-sm text-ink">
                  {actividad.tareas} {actividad.tareas === 1 ? 'tarea' : 'tareas'} · {actividad.horasTexto} · {actividad.rango}
                </p>
                <p className="mt-1 text-sm text-muted">{actividad.archivoNombre}</p>
              </Link>
              <Link
                href={`/proyectos/${proyecto.id}/actividades/${actividad.id}/editar`}
                className="flex items-center px-5 text-sm font-medium text-pine hover:underline"
              >
                Editar
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <BotonEliminar
          action={eliminarProyecto.bind(null, proyecto.id)}
          confirmar={`¿Eliminar el proyecto «${proyecto.nombre}» y todas sus actividades?`}
        >
          Eliminar proyecto
        </BotonEliminar>
      </div>
    </>
  )
}

async function Contenido({ params }: { params: Promise<{ id: string }> }) {
  await connection()
  const { id } = await params

  try {
    const proyecto = await obtenerProyecto(id)
    if (!proyecto) notFound()
    const actividades = await listarActividades(id)
    return <ListaActividades proyecto={proyecto} actividades={actividades} />
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
      <Suspense fallback={<Cargando texto="Abriendo el proyecto…" />}>
        <Contenido params={params} />
      </Suspense>
    </main>
  )
}
