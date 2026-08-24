import type { Metadata } from 'next'
import {
  Archivo,
  Big_Shoulders,
  Familjen_Grotesk,
  Spline_Sans_Mono,
} from 'next/font/google'
import './globals.css'

import QueryProvider from '@/provider/QueryProvider'
import { cn } from '@/lib/utils'

const familjenGrotesk = Familjen_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
})

// Big Shoulders' `opsz` axis is what gives it the tall, condensed "Display"
// cut at large sizes (and a text-friendly cut at small ones) — the family
// no longer ships as a separate Big_Shoulders_Display export.
const bigShouldersDisplay = Big_Shoulders({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-heading',
})

const splineSansMono = Spline_Sans_Mono({
  variable: '--font-geist-mono',
  weight: ['400', '500', '600'],
  subsets: ['latin'],
})

// The v3 display/label/figure type system, ported from the Claude Design
// mockup ("FPL Scout v3.dc.html") — see components/fpl-scout.css.
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
})

export const metadata: Metadata = {
  title: 'FPL Scout',
  description: '',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={cn(
        'h-full',
        'antialiased',
        splineSansMono.variable,
        'font-sans',
        familjenGrotesk.variable,
        bigShouldersDisplay.variable,
        archivo.variable
      )}
    >
      <body className="flex min-h-full flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
