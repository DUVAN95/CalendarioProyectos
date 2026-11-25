'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { btn, btnPeligro, btnSecundario, campo } from '@/components/estilos'

export type BorradorTarea = {
  nombre: string
  horas: number
  notas: string
}

function leerHoras(valor: string): number | null {
  const limpio = valor.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(limpio)) return null
  const numero = Number(limpio)
  if (!Number.isFinite(numero)) return null
  const minutos = Math.round(numero * 60)
  if (minutos <= 0 || numero > 5000) return null
  return minutos / 60
}

export function ModalTarea({
  titulo,
  detalle,
  inicial,
  guardando = false,
  error,
  confirmarTexto,
  onCerrar,
  onGuardar,
  onEliminar,
}: {
  titulo: string
  detalle?: string
  inicial: { nombre: string; horas: string; notas: string }
  guardando?: boolean
  error?: string | null
  confirmarTexto: string
  onCerrar: () => void
  onGuardar: (tarea: BorradorTarea) => void
  onEliminar?: () => void
}) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const tituloId = useId()
  const [nombre, setNombre] = useState(inicial.nombre)
  const [horas, setHoras] = useState(inicial.horas)
  const [notas, setNotas] = useState(inicial.notas)
  const [local, setLocal] = useState<string | null>(null)
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)

  useEffect(() => {
    const nodo = dialogo.current
    if (!nodo || nodo.open) return
    nodo.showModal()
  }, [])

  function cerrar() {
    if (guardando) return
    dialogo.current?.close()
  }

  function confirmar() {
    const nombreLimpio = nombre.trim()
    if (nombreLimpio.length < 1) {
      setLocal('Escribe el nombre de la tarea.')
      return
    }
    if (nombreLimpio.length > 180) {
      setLocal('El nombre no puede pasar de 180 caracteres.')
      return
    }
    const cantidad = leerHoras(horas)
    if (cantidad == null) {
      setLocal('Escribe las horas con un número mayor que cero.')
      return
    }
    setLocal(null)
    onGuardar({ nombre: nombreLimpio, horas: cantidad, notas: notas.trim().slice(0, 500) })
  }

  const aviso = local ?? error

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={tituloId}
      className="w-[min(100%-2rem,32rem)] rounded-3xl border border-line bg-paper-2 p-0 text-ink shadow-xl backdrop:bg-ink/40"
      onClose={onCerrar}
      onClick={(event) => {
        if (event.target === dialogo.current) cerrar()
      }}
      onCancel={(event) => {
        if (guardando) event.preventDefault()
      }}
    >
      <form
        className="space-y-4 p-6"
        onSubmit={(event) => {
          event.preventDefault()
          confirmar()
        }}
      >
        <div>
          <h2 id={tituloId} className="font-display text-3xl tracking-tight">
            {titulo}
          </h2>
          {detalle ? <p className="mt-2 text-sm leading-6 text-muted">{detalle}</p> : null}
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Nombre</span>
          <input value={nombre} onChange={(event) => setNombre(event.target.value)} className={campo} autoFocus maxLength={180} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Horas</span>
          <input value={horas} inputMode="decimal" onChange={(event) => setHoras(event.target.value)} className={campo} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Notas</span>
          <input value={notas} onChange={(event) => setNotas(event.target.value)} className={campo} maxLength={500} />
        </label>
        {aviso ? <p className="rounded-2xl bg-holiday px-4 py-3 text-sm leading-6 text-ink">{aviso}</p> : null}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {onEliminar ? (
            <button
              type="button"
              className={`${btnPeligro} mr-auto`}
              disabled={guardando}
              onClick={() => {
                if (!confirmarBorrado) {
                  setConfirmarBorrado(true)
                  return
                }
                onEliminar()
              }}
            >
              {confirmarBorrado ? 'Confirmar eliminación' : 'Eliminar'}
            </button>
          ) : null}
          <button type="button" className={btnSecundario} onClick={cerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className={btn} disabled={guardando}>
            {guardando ? 'Guardando…' : confirmarTexto}
          </button>
        </div>
      </form>
    </dialog>
  )
}
