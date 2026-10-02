import type { Metadata } from "next"
import PlayScreen from "@/components/game/PlayScreen"
import { MODES, type Mode } from "@/lib/game/config"

export const metadata: Metadata = { title: "Play" }

export default async function Play({ searchParams }: PageProps<"/play">) {
  const { mode } = await searchParams
  const picked = typeof mode === "string" && mode in MODES ? (mode as Mode) : undefined
  return <PlayScreen mode={picked} />
}
