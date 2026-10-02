"use client"

import { useEffect, useRef, useState } from "react"
import { Heart, Pause, Play, RotateCcw, Shield } from "lucide-react"
import { MODES, POWERS, type Mode } from "@/lib/game/config"
import { Engine, type Hud, type RunStats, type Settings, type Sound } from "@/lib/game/engine"
import styles from "./Game.module.sass"

type Phase = { kind: "menu" } | { kind: "playing"; mode: Mode; run: number } | { kind: "over"; stats: RunStats }

type Props = {
  settings: Settings
  /** Start straight into this mode, skipping the menu */
  initialMode?: Mode
  onSound?: (sound: Sound) => void
  /** Called once per finished run; returns what to celebrate on the results screen */
  onFinish?: (stats: RunStats) => { best: boolean; unlocked: string[] }
  menuExtra?: React.ReactNode
}

const ORDER: Mode[] = ["classic", "blitz", "hardcore"]

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`

/** The whole game screen: mode menu, the canvas, the HUD, pause and results */
const Game = ({ settings, initialMode, onSound, onFinish, menuExtra }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engine = useRef<Engine | null>(null)
  const [phase, setPhase] = useState<Phase>(initialMode ? { kind: "playing", mode: initialMode, run: 1 } : { kind: "menu" })
  const [hud, setHud] = useState<Hud | null>(null)
  const [result, setResult] = useState<{ best: boolean; unlocked: string[] } | null>(null)
  const [lastMode, setLastMode] = useState<Mode>(initialMode ?? "classic")

  // Keep the newest callbacks without restarting the engine
  const callbacks = useRef({ settings, onSound, onFinish })
  useEffect(() => {
    callbacks.current = { settings, onSound, onFinish }
    if (engine.current) engine.current.settings = settings
  })

  const playing = phase.kind === "playing"
  const mode = playing ? phase.mode : null
  const run = playing ? phase.run : 0
  const menu = phase.kind === "menu"

  useEffect(() => {
    if (!menu && !mode) return
    const g = new Engine(canvasRef.current!, {
      mode: mode ?? "classic",
      autopilot: !mode,
      settings: callbacks.current.settings,
      onHud: mode ? setHud : undefined,
      onSound: (s) => callbacks.current.onSound?.(s),
      onEnd: (stats) => {
        setResult(callbacks.current.onFinish?.(stats) ?? null)
        setPhase({ kind: "over", stats })
      },
    })
    engine.current = g
    g.start()
    return () => {
      g.destroy()
      engine.current = null
    }
  }, [menu, mode, run])

  const start = (m: Mode) => {
    setLastMode(m)
    setHud(null)
    setResult(null)
    setPhase((p) => ({ kind: "playing", mode: m, run: (p.kind === "playing" ? p.run : 0) + 1 }))
  }

  return (
    <div className={styles.game}>
      <canvas ref={canvasRef} className={styles.canvas} />

      {playing && hud && (
        <div className={styles.hud}>
          <div className={styles.topLeft}>
            <strong className={styles.score}>{hud.score.toLocaleString("en-US")}</strong>
            <span className={styles.meta}>{hud.timeLeft !== null ? <b className={hud.timeLeft <= 10 ? styles.urgent : ""}>{clock(hud.timeLeft)}</b> : `Wave ${hud.wave}`}</span>
            {hud.combo >= 2 && (
              <span className={styles.combo}>
                {hud.combo} combo{hud.multiplier > 1 && <b> ×{hud.multiplier}</b>}
              </span>
            )}
          </div>

          <div className={styles.topRight}>
            {hud.maxLives > 0 && (
              <span className={styles.lives} aria-label={`${hud.lives} lives`}>
                {Array.from({ length: hud.maxLives }, (_, i) => (
                  <Heart key={i} size={18} className={i < hud.lives ? styles.heartOn : styles.heartOff} />
                ))}
                {hud.shield && <Shield size={18} className={styles.shieldIcon} />}
              </span>
            )}
            {hud.maxLives === 0 && hud.shield && <Shield size={18} className={styles.shieldIcon} />}
            <button type="button" className={styles.iconButton} onClick={() => engine.current?.setPaused(true)} aria-label="Pause">
              <Pause size={18} />
            </button>
          </div>

          {hud.boss && (
            <div className={styles.boss}>
              <span>Mothership</span>
              <div>
                <i style={{ width: `${(hud.boss.hp / hud.boss.max) * 100}%` }} />
              </div>
            </div>
          )}

          {hud.banner && <div className={styles.banner}>{hud.banner}</div>}

          {hud.powers.length > 0 && (
            <div className={styles.powers}>
              {hud.powers.map((p) => (
                <span key={p.kind} style={{ borderColor: POWERS[p.kind].color, color: POWERS[p.kind].color }}>
                  {POWERS[p.kind].name} <b>{p.left}s</b>
                </span>
              ))}
            </div>
          )}

          {hud.paused && (
            <div className={styles.overlay}>
              <div className={styles.card}>
                <h2>Paused</h2>
                <button type="button" className={styles.primary} onClick={() => engine.current?.setPaused(false)}>
                  <Play size={18} /> Resume
                </button>
                <button type="button" className={styles.secondary} onClick={() => start(phase.mode)}>
                  <RotateCcw size={18} /> Restart
                </button>
                <button type="button" className={styles.link} onClick={() => setPhase({ kind: "menu" })}>
                  Quit to menu
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {menu && (
        <div className={styles.overlay}>
          <div className={styles.menu}>
            <h1 className={styles.title}>Gunner</h1>
            <p className={styles.tagline}>Hold the center. Shoot everything.</p>
            <div className={styles.modes}>
              {ORDER.map((m) => (
                <button key={m} type="button" className={`${styles.mode} ${m === lastMode ? styles.modeOn : ""}`} onClick={() => start(m)}>
                  <strong>{MODES[m].name}</strong>
                  <span>{MODES[m].blurb}</span>
                </button>
              ))}
            </div>
            <p className={styles.hint}>Aim with the mouse or your finger · hold to fire · P or Esc to pause</p>
            {menuExtra}
          </div>
        </div>
      )}

      {phase.kind === "over" && (
        <div className={styles.overlay}>
          <div className={styles.card}>
            <span className={styles.overMode}>{MODES[phase.stats.mode].name}</span>
            {result?.best && <span className={styles.best}>New best!</span>}
            <strong className={styles.final}>{phase.stats.score.toLocaleString("en-US")}</strong>
            <dl className={styles.results}>
              {phase.stats.mode !== "blitz" && (
                <div>
                  <dt>Wave</dt>
                  <dd>{phase.stats.wave}</dd>
                </div>
              )}
              <div>
                <dt>Kills</dt>
                <dd>{Object.values(phase.stats.kills).reduce((a, b) => a + b, 0)}</dd>
              </div>
              <div>
                <dt>Accuracy</dt>
                <dd>{phase.stats.shots ? Math.round((phase.stats.hits / phase.stats.shots) * 100) : 0}%</dd>
              </div>
              <div>
                <dt>Best combo</dt>
                <dd>{phase.stats.bestCombo}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>{clock(phase.stats.seconds)}</dd>
              </div>
            </dl>
            {result && result.unlocked.length > 0 && (
              <p className={styles.unlocked}>
                Unlocked: <b>{result.unlocked.join(", ")}</b>
              </p>
            )}
            <button type="button" className={styles.primary} onClick={() => start(phase.stats.mode)}>
              <RotateCcw size={18} /> Play again
            </button>
            <button type="button" className={styles.link} onClick={() => setPhase({ kind: "menu" })}>
              Change mode
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game
