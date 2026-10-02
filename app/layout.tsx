import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import "./globals.sass"

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" })
const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-display" })

export const metadata: Metadata = {
  title: { default: "Gunner", template: "%s | Gunner" },
  description: "An arcade shooter: hold the center and shoot everything that comes at you.",
}

export const viewport: Viewport = { themeColor: "#161b28" }

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  )
}
