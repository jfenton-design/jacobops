import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JacobOps — Acquisition Dealflow OS',
  description: 'Personal acquisition dealflow operating system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
