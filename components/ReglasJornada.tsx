import { HORAS_ENTRE_SEMANA, HORAS_VIERNES, HORAS_VIERNES_CON_FESTIVO } from '@/lib/jornada'

export function ReglasJornada({ compacta = false }: { compacta?: boolean }) {
  if (compacta) {
    return (
      <p className="text-sm leading-6 text-muted">
        Lunes a jueves, {HORAS_ENTRE_SEMANA} h. Viernes, {HORAS_VIERNES} h. Si entre lunes y jueves hay festivo, ese
        viernes pasa a {HORAS_VIERNES_CON_FESTIVO} h. Los festivos de Colombia no se trabajan.
      </p>
    )
  }

  return (
    <ul className="space-y-3 text-sm leading-6 text-ink">
      <li>Las tareas van una detrás de otra. Si cambias el orden o las sueltas en otro día, las horas se reparten de nuevo según la jornada.</li>
      <li>Solo cuentan los días de lunes a viernes. El calendario no muestra horas del reloj, solo qué días cubre cada tarea.</li>
      <li>
        De lunes a jueves la jornada es de {HORAS_ENTRE_SEMANA} h. El viernes es de {HORAS_VIERNES} h.
      </li>
      <li>
        Si en la semana hay un festivo de lunes a jueves, el viernes se amplía a {HORAS_VIERNES_CON_FESTIVO} h. Si el
        viernes es festivo, ese día no se trabaja.
      </li>
      <li>Los festivos son los de Colombia, incluidos los que la Ley Emiliani pasa al lunes siguiente.</li>
    </ul>
  )
}
