"use client"

import { useEffect, useRef, useState } from "react"
import { createGame } from "@/lib/game"
import styles from "./Game.module.sass"

/** The canvas, the score and the start / game over dialog */
const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const game = useRef<ReturnType<typeof createGame> | null>(null)
  const [score, setScore] = useState(0)
  const [over, setOver] = useState<{ score: number; played: boolean } | null>({ score: 0, played: false })

  useEffect(() => {
    game.current = createGame(canvasRef.current!, { onScore: setScore, onGameOver: (s) => setOver({ score: s, played: true }) })
    return () => game.current?.destroy()
  }, [])

  const start = () => {
    setOver(null)
    game.current?.start()
  }

  return (
    <div className={styles.game}>
      <div className={styles.score}>Score: {score}</div>
      {over && (
        <div className={styles.modal}>
          <div className={styles.content}>
            <h1 className={styles.points}>{over.score}</h1>
            <p>Points</p>
            <button type="button" className={styles.btn} onClick={start}>
              {over.played ? "Try Again" : "Start Game"}
            </button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  )
}

export default Game
