'use client'

export default function ErrorPagina({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl">No se pudo mostrar esta página.</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Si acabas de abrir la app, revisa que MongoDB local esté en marcha en el puerto 27017.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper"
      >
        Reintentar
      </button>
    </main>
  )
}
