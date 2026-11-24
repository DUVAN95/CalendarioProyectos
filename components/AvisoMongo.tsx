import { mensajeMongo } from '@/lib/db'

export function AvisoMongo() {
  return (
    <div className="rounded-3xl border border-accent/30 bg-holiday px-5 py-4 text-sm leading-6 text-ink">
      {mensajeMongo()}
    </div>
  )
}
