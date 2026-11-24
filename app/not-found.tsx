import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm uppercase tracking-[0.16em] text-accent">No encontrado</p>
      <h1 className="mt-2 font-display text-5xl">Esa página no está en el calendario.</h1>
      <Link href="/" className="mt-6 inline-block text-sm font-medium text-pine hover:underline">
        Volver a proyectos
      </Link>
    </main>
  )
}
