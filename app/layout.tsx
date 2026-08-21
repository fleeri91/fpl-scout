import type { Metadata } from 'next'
import { Bricolage_Grotesque, Geist_Mono, Public_Sans } from 'next/font/google'
import './globals.css'

import QueryProvider from '@/provider/QueryProvider'
import { cn } from '@/lib/utils'

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
})

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--font-heading',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
        geistMono.variable,
        'font-sans',
        publicSans.variable,
        bricolageGrotesque.variable
      )}
    >
      <body className="flex min-h-full flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
