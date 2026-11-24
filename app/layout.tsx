import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Fraunces, Outfit } from 'next/font/google'
import { Encabezado } from '@/components/Encabezado'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
})

export const metadata: Metadata = {
  title: {
    default: 'Planeación',
    template: '%s · Planeación',
  },
  description: 'Calendario laboral a partir de las horas estimadas de un Excel.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans text-ink">
        <Encabezado />
        <div className="flex-1">{children}</div>
        <footer className="no-print px-6 py-8 text-sm text-muted">
          MongoDB local · base <span className="text-ink">calendario_planeacion</span> · colecciones proyectos y actividades
        </footer>
      </body>
    </html>
  )
}
