import type { Metadata, Viewport } from "next"
import { Space_Mono } from "next/font/google"
import "./globals.sass"

const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: { default: "Gunner", template: "%s | Gunner" },
  description: "An arcade shooter: hold the center and shoot everything that comes at you.",
}

export const viewport: Viewport = { themeColor: "#161b28" }

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={mono.variable}>
      <body>{children}</body>
    </html>
  )
}
