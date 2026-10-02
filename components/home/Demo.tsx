"use client"

import { useEffect, useRef } from "react"
import { Engine } from "@/lib/game/engine"
import styles from "./Home.module.sass"

/** The game playing itself, as a backdrop */
const Demo = () => {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    // On wide screens the turret sits to the right of the headline
    const anchor = window.innerWidth > 900 ? 0.7 : 0.5
    const g = new Engine(ref.current!, { mode: "classic", autopilot: true, anchor, settings: { shake: false, particles: "high" } })
    g.start()
    return () => g.destroy()
  }, [])
  return <canvas ref={ref} className={styles.demo} aria-label="Gunner playing itself" />
}

export default Demo
