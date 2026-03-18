import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Medify - Build Your Medical Website in Minutes',
  description: 'Medical website builder for Hospitals, Clinics, and Pharmacies',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/mod logo.png',
    apple: '/mod logo.png',
    shortcut: '/mod logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="overflow-x-hidden">{children}</body>
    </html>
  )
}

