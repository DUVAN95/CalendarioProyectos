'use client'

import { Fragment, useRef, useState, type DragEvent as ReactDragEvent } from 'react'
import { colorMostrado, type Cronograma as DatosCronograma, type DiaCalendario, type Segmento, type SemanaCalendario, type TareaProgramada } from '@/lib/jornada'

function viernesEnUso(semana: SemanaCalendario): boolean {
  const viernes = semana.dias[4]
  return Boolean(viernes?.viernesAmpliado && !viernes.anterior && !viernes.posterior && !viernes.festivo)
}

function claseDia(dia: DiaCalendario, hoy: string): string {
  if (dia.festivo) return 'bg-holiday/80'
  if (dia.fecha === hoy) return 'bg-pine/5'
  if (dia.anterior || dia.posterior) return 'bg-soft/40'
  return 'bg-paper-2'
}

function EncabezadoDia({
  dia,
  hoy,
  className = 'w-32 shrink-0',
}: {
  dia: DiaCalendario
  hoy: string
  className?: string
}) {
  return (
    <div className={`px-2 py-2 ${claseDia(dia, hoy)} ${className}`} title={dia.titulo}>
      <p className="text-[11px] uppercase tracking-wide text-muted">{dia.diaCorto}</p>
      <p className={`font-display text-xl leading-none ${dia.fecha === hoy ? 'text-pine' : ''}`}>{dia.numero}</p>
      <p className="text-[11px] text-muted">{dia.mesCorto}</p>
      {dia.festivo ? (
        <>
          <p className="mt-1 text-[11px] font-medium text-accent">Festivo</p>
          <p className="text-[11px] leading-tight text-accent">{dia.festivo}</p>
        </>
      ) : dia.anterior ? (
        <p className="mt-1 text-[11px] text-muted">Antes del inicio</p>
      ) : dia.posterior ? (
        <p className="mt-1 text-[11px] text-muted">Después del fin</p>
      ) : (
        <p className={`mt-1 text-[11px] leading-tight ${dia.viernesAmpliado ? 'font-medium text-pine' : 'text-muted'}`}>
          {dia.capacidadTexto}
        </p>
      )}
    </div>
  )
}

function posicionDestino(columna: HTMLElement, clienteY: number, indice: number): number {
  const tarjetas = [...columna.querySelectorAll<HTMLElement>('[data-indice]')].filter(
    (tarjeta) => tarjeta.dataset.indice !== String(indice),
  )
  for (let i = 0; i < tarjetas.length; i += 1) {
    const rect = tarjetas[i].getBoundingClientRect()
    if (clienteY < rect.top + rect.height / 2) return i
  }
  return tarjetas.length
}

function Barra({ tarea, segmento }: { tarea: TareaProgramada; segmento: Segmento }) {
  const inicio = (segmento.desplazamientoHoras / segmento.capacidadHoras) * 100
  const ancho = (segmento.horas / segmento.capacidadHoras) * 100

  return (
    <div
      className={`absolute top-3 flex h-8 items-center overflow-hidden rounded-md px-1.5 text-[11px] font-medium ${tarea.finalizada ? 'text-ink' : 'text-white'}`}
      style={{
        left: `${inicio}%`,
        width: `${ancho}%`,
        background: colorMostrado(tarea),
      }}
      title={`${tarea.nombre}: ${segmento.etiqueta}, ${segmento.texto}`}
    >
      {ancho >= 38 ? <span className="truncate">{segmento.corto}</span> : null}
    </div>
  )
}

export function Cronograma({
  cronograma,
  hoy,
  guardando = false,
  onMover,
  onFinalizar,
}: {
  cronograma: DatosCronograma
  hoy: string
  guardando?: boolean
  onMover?: (indice: number, fecha: string, posicion: number) => void
  onFinalizar?: (indice: number) => void
}) {
  const [vista, setVista] = useState<'barras' | 'dias'>('dias')
  const [arrastre, setArrastre] = useState<{ indice: number; fecha: string; posicion: number } | null>(null)
  const indiceArrastre = useRef<number | null>(null)

  function alArrastrar(event: ReactDragEvent<HTMLLIElement>, indice: number) {
    if (!onMover || guardando) {
      event.preventDefault()
      return
    }
    event.dataTransfer.setData('text/plain', String(indice))
    event.dataTransfer.effectAllowed = 'move'
    indiceArrastre.current = indice
    setArrastre({ indice, fecha: '', posicion: 0 })
  }

  function alPasar(event: ReactDragEvent<HTMLDivElement>) {
    if (indiceArrastre.current == null) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    const fecha = event.currentTarget.dataset.fecha
    if (!fecha) return
    const posicion = posicionDestino(event.currentTarget, event.clientY, indiceArrastre.current)
    setArrastre((actual) =>
      actual?.fecha === fecha && actual.posicion === posicion ? actual : { indice: indiceArrastre.current as number, fecha, posicion },
    )
  }

  function alSoltar(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault()
    const indice = indiceArrastre.current
    const fecha = event.currentTarget.dataset.fecha
    indiceArrastre.current = null
    setArrastre(null)
    if (indice == null || !fecha || !onMover) return
    onMover(indice, fecha, posicionDestino(event.currentTarget, event.clientY, indice))
  }

  function alTerminar() {
    indiceArrastre.current = null
    setArrastre(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-line bg-paper-2 p-1">
        <button
            type="button"
            aria-pressed={vista === 'dias'}
            className={vista === 'dias' ? 'rounded-full bg-ink px-4 py-1.5 text-sm text-paper' : 'rounded-full px-4 py-1.5 text-sm text-muted'}
            onClick={() => setVista('dias')}
          >
            Por día
          </button>
          <button
            type="button"
            aria-pressed={vista === 'barras'}
            className={vista === 'barras' ? 'rounded-full bg-ink px-4 py-1.5 text-sm text-paper' : 'rounded-full px-4 py-1.5 text-sm text-muted'}
            onClick={() => setVista('barras')}
          >
            Barras
          </button>
        </div>
        <p className="text-sm text-muted">
          {vista === 'barras'
            ? 'Desplaza hacia los lados para ver las semanas.'
            : guardando
              ? 'Guardando el nuevo orden…'
              : 'Arrastra una tarea para moverla de día o cambiar su orden. Las horas se reparten de nuevo según la jornada.'}
        </p>
      </div>

      {vista === 'barras' ? (
        <div className="max-h-[70vh] overflow-auto rounded-3xl border border-line bg-paper-2">
          <div className="min-w-max">
            <div className="sticky top-0 z-20 flex border-b border-line bg-paper-2">
              <div className="sticky left-0 z-30 w-72 shrink-0 border-r border-line bg-paper-2 px-4 py-3 text-sm text-muted">
                Tarea
              </div>
              {cronograma.semanas.map((semana, indice) => (
                <div key={semana.inicio} className={`border-l border-line ${indice > 0 ? 'ml-3' : ''}`}>
                  <div className="border-b border-line px-2 py-1.5 text-xs text-muted">
                    {semana.etiqueta}
                    {viernesEnUso(semana) ? <span className="ml-2 text-pine">viernes de 8 h</span> : null}
                  </div>
                  <div className="flex">
                    {semana.dias.map((dia) => (
                      <EncabezadoDia key={dia.fecha} dia={dia} hoy={hoy} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {cronograma.tareas.map((tarea) => (
              <div key={tarea.indice} className="flex border-t border-line">
                <div className="sticky left-0 z-10 w-72 shrink-0 border-r border-line bg-paper-2 px-4 py-3">
                  <p className="flex items-start gap-2 font-medium leading-5">
                    <span className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorMostrado(tarea) }} />
                    <span>{tarea.nombre}</span>
                  </p>
                  <p className="mt-1 pl-4 text-sm text-muted">
                    {tarea.horasTexto} · {tarea.rango}
                  </p>
                  {tarea.notas ? <p className="mt-1 pl-4 text-xs text-muted">{tarea.notas}</p> : null}
                </div>
                {cronograma.semanas.map((semana, indice) => (
                  <div key={semana.inicio} className={`flex border-l border-line ${indice > 0 ? 'ml-3' : ''}`}>
                    {semana.dias.map((dia) => {
                      const segmento = tarea.segmentos.find((item) => item.fecha === dia.fecha)
                      return (
                        <div key={dia.fecha} className={`relative h-16 w-32 shrink-0 ${claseDia(dia, hoy)}`}>
                          {segmento ? <Barra tarea={tarea} segmento={segmento} /> : null}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {cronograma.semanas.map((semana) => (
            <section key={semana.inicio} className="overflow-hidden rounded-3xl border border-line bg-paper-2">
              <div className="border-b border-line px-4 py-2 text-xs text-muted">
                {semana.etiqueta}
                {viernesEnUso(semana) ? <span className="ml-2 text-pine">viernes de 8 h</span> : null}
              </div>
              <div className="overflow-x-auto">
                <div className="grid min-w-[52rem] grid-cols-5">
                  {semana.dias.map((dia) => {
                    const piezas = cronograma.tareas.flatMap((tarea) => {
                      const segmento = tarea.segmentos.find((item) => item.fecha === dia.fecha)
                      return segmento ? [{ tarea, segmento }] : []
                    })
                    const sobreEsteDia = arrastre?.fecha === dia.fecha
                    let vistas = 0

                    return (
                      <div
                        key={dia.fecha}
                        data-fecha={dia.fecha}
                        className={`min-w-0 border-l border-line first:border-l-0 ${claseDia(dia, hoy)} ${sobreEsteDia ? 'ring-2 ring-inset ring-pine' : ''}`}
                        onDragOver={alPasar}
                        onDrop={alSoltar}
                      >
                        <EncabezadoDia dia={dia} hoy={hoy} className="w-full" />
                        <ul className={`min-h-16 space-y-2 px-2 pb-3 ${arrastre ? 'cursor-grabbing' : ''}`}>
                          {piezas.map(({ tarea, segmento }) => {
                            const esArrastrada = arrastre?.indice === tarea.indice
                            const esUltimoDia = tarea.segmentos.at(-1)?.fecha === segmento.fecha
                            const mostrarLinea = sobreEsteDia && !esArrastrada && arrastre.posicion === vistas
                            if (!esArrastrada) vistas += 1
                            return (
                              <Fragment key={tarea.indice}>
                                {mostrarLinea ? <li className="h-1 rounded-full bg-pine" aria-hidden /> : null}
                                <li
                                  data-indice={tarea.indice}
                                  draggable={Boolean(onMover) && !guardando}
                                  className={`rounded-xl px-2.5 py-2 ${tarea.finalizada ? 'text-ink ring-1 ring-line' : 'text-white'} ${onMover ? 'cursor-grab active:cursor-grabbing' : ''} ${esArrastrada ? 'opacity-40' : ''}`}
                                  style={{ background: colorMostrado(tarea) }}
                                  onDragStart={(event) => {
                                    if (event.target instanceof Element && event.target.closest('[data-check]')) {
                                      event.preventDefault()
                                      return
                                    }
                                    alArrastrar(event, tarea.indice)
                                  }}
                                  onDragEnd={alTerminar}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm leading-5">{tarea.nombre}</p>
                                    {esUltimoDia ? (
                                      <span
                                        data-check
                                        className="shrink-0 pt-0.5"
                                        onMouseDown={(event) => event.stopPropagation()}
                                        onPointerDown={(event) => event.stopPropagation()}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={Boolean(tarea.finalizada)}
                                          aria-label={tarea.finalizada ? 'Quitar finalizada' : 'Marcar como finalizada'}
                                          disabled={!onFinalizar || guardando}
                                          className="block h-3.5 w-3.5 cursor-pointer accent-ink"
                                          onChange={() => onFinalizar?.(tarea.indice)}
                                          onClick={(event) => event.stopPropagation()}
                                          onDragStart={(event) => {
                                            event.preventDefault()
                                            event.stopPropagation()
                                          }}
                                        />
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className={`mt-1 text-[11px] ${tarea.finalizada ? 'text-muted' : 'text-white/80'}`}>{segmento.texto}</p>
                                </li>
                              </Fragment>
                            )
                          })}
                          {sobreEsteDia && arrastre.posicion >= vistas ? (
                            <li className="h-1 rounded-full bg-pine" aria-hidden />
                          ) : null}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
