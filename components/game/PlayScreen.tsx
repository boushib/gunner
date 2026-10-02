"use client"

import Link from "next/link"
import { Volume2, VolumeX } from "lucide-react"
import type { Mode } from "@/lib/game/config"
import { recordRun, settingsStore } from "@/lib/save"
import { playSound } from "@/lib/sound"
import Game from "./Game"
import styles from "./Game.module.sass"

/** The game wired to your settings, sound and saved scores */
const PlayScreen = ({ mode }: { mode?: Mode }) => {
  const settings = settingsStore.use()
  const volume = settings.muted ? 0 : settings.volume

  return (
    <Game
      settings={{ shake: settings.shake, particles: settings.particles }}
      initialMode={mode}
      onSound={(s) => playSound(s, volume)}
      onFinish={recordRun}
      menuExtra={
        <nav className={styles.menuLinks}>
          <Link href="/">Home</Link>
          <Link href="/how-to-play">How to play</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <button type="button" onClick={() => settingsStore.set((s) => ({ ...s, muted: !s.muted }))} aria-label={settings.muted ? "Unmute" : "Mute"}>
            {settings.muted ? <VolumeX size={16} /> : <Volume2 size={16} />} {settings.muted ? "Sound off" : "Sound on"}
          </button>
        </nav>
      }
    />
  )
}

export default PlayScreen
