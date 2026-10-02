"use client"

import Game from "@/components/game/Game"

export default function Home() {
  return <Game settings={{ shake: true, particles: "high" }} />
}
