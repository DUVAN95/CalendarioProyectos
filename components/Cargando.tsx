export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return <p className="px-6 py-16 text-sm text-muted">{texto}</p>
}
