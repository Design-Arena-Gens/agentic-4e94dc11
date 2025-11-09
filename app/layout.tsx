import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jarvis AI - Personal Voice Assistant',
  description: 'AI-powered assistant for e-commerce catalog management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
