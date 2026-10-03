import type { Metadata } from "next"
import { Suspense } from "react"
import PlayScreen from "@/components/game/PlayScreen"

export const metadata: Metadata = { title: "Play" }

// The mode comes from ?mode= in the browser, so the page itself stays static
export default function Play() {
  return (
    <Suspense>
      <PlayScreen />
    </Suspense>
  )
}
