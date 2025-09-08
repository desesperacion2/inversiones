import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Suspense } from "react"
import ClientLayout from "./components/ClientLayout"
import "./globals.css"

export const metadata: Metadata = {
  title: "Mi Portafolio de Inversiones",
  description: "Seguimiento profesional de inversiones en tiempo real",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ClientLayout>
          <Suspense fallback={null}>{children}</Suspense>
        </ClientLayout>
      </body>
    </html>
  )
}
