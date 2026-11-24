import type { Metadata } from 'next'
import Link from 'next/link'
import { FormularioProyecto } from '@/components/FormularioProyecto'

export const metadata: Metadata = {
  title: 'Nuevo proyecto',
}

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        Proyectos
      </Link>
      <h1 className="mt-3 font-display text-5xl tracking-tight">Nuevo proyecto</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
        El proyecto agrupa actividades. Cada actividad nace de un Excel y tiene su calendario.
      </p>
      <div className="mt-8 rounded-3xl border border-line bg-paper-2 p-6">
        <FormularioProyecto />
      </div>
    </main>
  )
}
