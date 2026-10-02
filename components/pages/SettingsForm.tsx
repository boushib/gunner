"use client"

import { useEffect, useState } from "react"
import { ensureUsername, renameUser, resetAll, settingsStore, type Settings } from "@/lib/save"
import { cleanUsername, isValidUsername } from "@/lib/usernames"
import { playSound } from "@/lib/sound"
import styles from "./Pages.module.sass"

const Switch = ({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} className={`${styles.switch} ${on ? styles.switchOn : ""}`} onClick={() => onChange(!on)} />
)

/** Player name, sound and effects, saved as you change them */
const SettingsForm = () => {
  const s = settingsStore.useValue()
  const [confirming, setConfirming] = useState(false)
  const [cleared, setCleared] = useState(false)
  const update = (patch: Partial<Settings>) => settingsStore.set((prev) => ({ ...prev, ...patch }))
  // The username is edited as a draft and saved when you leave the field
  const [name, setName] = useState(s.name)
  const [saved, setSaved] = useState(s.name)
  if (saved !== s.name) {
    setSaved(s.name)
    setName(s.name)
  }
  useEffect(() => {
    ensureUsername()
  }, [])

  return (
    <div className={styles.form}>
      <label className={styles.row}>
        <span>
          Username
          <small>{isValidUsername(name) ? "Shown on the leaderboard" : "3 to 16 letters, numbers, _ or -"}</small>
        </span>
        <input type="text" value={name} maxLength={16} onChange={(e) => setName(cleanUsername(e.target.value))} onBlur={() => (isValidUsername(name) ? renameUser(name) : setName(s.name))} />
      </label>

      <div className={styles.row}>
        <span>
          Sound
          <small>Synthesized effects for shots, hits and power-ups</small>
        </span>
        <Switch on={!s.muted} onChange={(on) => update({ muted: !on })} label="Sound" />
      </div>

      <label className={styles.row}>
        <span>
          Volume
          <small>{Math.round(s.volume * 100)}%</small>
        </span>
        <input type="range" min={0} max={1} step={0.05} value={s.volume} disabled={s.muted} onChange={(e) => update({ volume: Number(e.target.value) })} onPointerUp={() => playSound("power", s.volume)} />
      </label>

      <div className={styles.row}>
        <span>
          Screen shake
          <small>When you get hit and when big enemies explode</small>
        </span>
        <Switch on={s.shake} onChange={(shake) => update({ shake })} label="Screen shake" />
      </div>

      <div className={styles.row}>
        <span>
          Particles
          <small>Fewer particles help on slower devices</small>
        </span>
        <div className={styles.choice}>
          {(["high", "low"] as const).map((p) => (
            <button key={p} type="button" className={s.particles === p ? styles.choiceOn : ""} onClick={() => update({ particles: p })}>
              {p === "high" ? "Lots" : "Fewer"}
            </button>
          ))}
        </div>
      </div>

      {cleared ? (
        <p className={styles.when}>Scores, stats and achievements cleared.</p>
      ) : confirming ? (
        <div className={styles.row}>
          <span>
            Clear everything?
            <small>Scores, stats and achievements are deleted for good.</small>
          </span>
          <div className={styles.choice}>
            <button type="button" onClick={() => setConfirming(false)}>
              Keep
            </button>
            <button
              type="button"
              className={styles.choiceOn}
              onClick={() => {
                resetAll()
                setCleared(true)
              }}
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={styles.danger} onClick={() => setConfirming(true)}>
          Clear scores, stats and achievements
        </button>
      )}
    </div>
  )
}

export default SettingsForm
