"use client"

import { useEffect, useRef } from "react"
import { drawGunner } from "@/lib/game/guns"

/** The gunner holding a gun level, drawn exactly as in the game, facing right */
const GunPreview = ({ level, width = 240, height = 96 }: { level: number; width?: number; height?: number }) => {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * dpr
    canvas.height = height * dpr
    const ctx = canvas.getContext("2d")!
    ctx.setTransform(dpr * 2.4, 0, 0, dpr * 2.4, (width / 2 - 56) * dpr, (height / 2) * dpr)
    drawGunner(ctx, level, { spin: 0.4 })
  }, [level, width, height])
  return <canvas ref={ref} style={{ width, height }} aria-hidden />
}

export default GunPreview
