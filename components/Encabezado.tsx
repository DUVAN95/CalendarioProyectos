import Link from 'next/link'

export function Encabezado() {
  return (
    <header className="no-print border-b border-line/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="font-display text-[1.7rem] leading-none tracking-tight">Planeación</span>
          <span className="hidden text-sm text-muted sm:inline">calendario laboral</span>
        </Link>
        <Link href="/proyectos/nuevo" className="text-sm font-medium text-pine hover:underline">
          Nuevo proyecto
        </Link>
      </div>
    </header>
  )
}
