"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Crown, Medal, Pencil, X } from "lucide-react"
import { MODES, type Mode } from "@/lib/game/config"
import { ensureUsername, renameUser, scoresStore, settingsStore, type Score } from "@/lib/save"
import { cleanUsername, isValidUsername, usernameColor } from "@/lib/usernames"
import site from "@/components/site/Site.module.sass"
import styles from "./Leaderboard.module.sass"

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

const Avatar = ({ name, size = 36 }: { name: string; size?: number }) => (
  <span className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.42, backgroundColor: usernameColor(name) }} aria-hidden>
    {name.slice(0, 2).toUpperCase()}
  </span>
)

/** Your username, editable in place */
const Username = () => {
  const name = settingsStore.useValue().name
  const [draft, setDraft] = useState<string | null>(null)
  // Swap the "Player" placeholder for a real username as soon as you visit
  useEffect(() => {
    ensureUsername()
  }, [])

  if (draft === null)
    return (
      <div className={styles.you}>
        <Avatar name={name} size={40} />
        <span>
          Playing as <strong>{name}</strong>
        </span>
        <button type="button" onClick={() => setDraft(name)} aria-label="Change username">
          <Pencil size={15} /> Change
        </button>
      </div>
    )

  const valid = isValidUsername(draft)
  const save = () => {
    if (!valid) return
    renameUser(draft)
    setDraft(null)
  }
  return (
    <form
      className={styles.you}
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <Avatar name={valid ? draft : name} size={40} />
      <input value={draft} onChange={(e) => setDraft(cleanUsername(e.target.value))} autoFocus aria-label="Username" maxLength={16} />
      <button type="submit" disabled={!valid} aria-label="Save username">
        <Check size={16} />
      </button>
      <button type="button" onClick={() => setDraft(null)} aria-label="Cancel">
        <X size={16} />
      </button>
      {!valid && <small>3 to 16 letters, numbers, _ or -</small>}
    </form>
  )
}

const PLACES = [
  { label: "1st", className: styles.gold, icon: <Crown size={20} /> },
  { label: "2nd", className: styles.silver, icon: <Medal size={18} /> },
  { label: "3rd", className: styles.bronze, icon: <Medal size={18} /> },
]

const Podium = ({ rows, mode }: { rows: Score[]; mode: Mode }) => (
  <div className={styles.podium}>
    {/* Second, first, third: the winner stands in the middle */}
    {[1, 0, 2].map((i) => {
      const r = rows[i]
      const place = PLACES[i]
      if (!r) return <div key={i} className={`${styles.step} ${styles.empty} ${place.className}`} />
      return (
        <article key={i} className={`${styles.step} ${place.className}`}>
          <span className={styles.badge}>
            {place.icon} {place.label}
          </span>
          <Avatar name={r.name} size={i === 0 ? 64 : 52} />
          <strong className={styles.name}>{r.name}</strong>
          <span className={styles.points}>{r.score.toLocaleString("en-US")}</span>
          <dl className={styles.details}>
            {mode !== "blitz" && (
              <div>
                <dt>Wave</dt>
                <dd>{r.wave}</dd>
              </div>
            )}
            <div>
              <dt>Kills</dt>
              <dd>{r.kills}</dd>
            </div>
            <div>
              <dt>Accuracy</dt>
              <dd>{Math.round(r.accuracy * 100)}%</dd>
            </div>
          </dl>
          <span className={styles.date}>{day(r.at)}</span>
        </article>
      )
    })}
  </div>
)

/** The top ten games per mode, saved in this browser */
const Leaderboard = () => {
  const scores = scoresStore.useValue()
  const [mode, setMode] = useState<Mode>("classic")
  const rows = scores[mode]
  const rest = rows.slice(3)

  return (
    <>
      <Username />

      <div className={styles.tabs} role="tablist">
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={m === mode} className={m === mode ? styles.tabOn : ""} onClick={() => setMode(m)}>
            {MODES[m].name}
            <em>{scores[m].length}</em>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className={site.empty}>
          No {MODES[mode].name} games yet. <Link href={`/play?mode=${mode}`}>Play one</Link> and claim the top spot.
        </p>
      ) : (
        <>
          <Podium rows={rows} mode={mode} />
          {rest.length > 0 && (
            <ol className={styles.list} start={4}>
              {rest.map((r, i) => (
                <li key={r.at}>
                  <span className={styles.rank}>{i + 4}</span>
                  <Avatar name={r.name} size={32} />
                  <span className={styles.rowName}>
                    <strong>{r.name}</strong>
                    <small>{day(r.at)}</small>
                  </span>
                  <span className={styles.stat}>
                    {mode !== "blitz" ? `Wave ${r.wave} · ` : ""}
                    {r.kills} kills · {Math.round(r.accuracy * 100)}% · {clock(r.seconds)}
                  </span>
                  <span className={styles.rowScore}>{r.score.toLocaleString("en-US")}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </>
  )
}

export default Leaderboard
