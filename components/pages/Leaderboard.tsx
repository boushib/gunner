"use client"

import { useState } from "react"
import Link from "next/link"
import { MODES, type Mode } from "@/lib/game/config"
import { scoresStore } from "@/lib/save"
import site from "@/components/site/Site.module.sass"
import styles from "./Pages.module.sass"

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

/** The top ten games per mode, saved in this browser */
const Leaderboard = () => {
  const scores = scoresStore.useValue()
  const [mode, setMode] = useState<Mode>("classic")
  const rows = scores[mode]

  return (
    <>
      <div className={styles.tabs} role="tablist">
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={m === mode} className={m === mode ? styles.tabOn : ""} onClick={() => setMode(m)}>
            {MODES[m].name}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className={site.empty}>
          No {MODES[mode].name} games yet. <Link href={`/play?mode=${mode}`}>Play one</Link>
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th className={styles.num}>Score</th>
                {mode !== "blitz" && <th className={styles.num}>Wave</th>}
                <th className={styles.num}>Kills</th>
                <th className={styles.num}>Accuracy</th>
                <th className={styles.num}>Time</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.at}>
                  <td className={i === 0 ? styles.top : styles.rank}>{i + 1}</td>
                  <td>{r.name}</td>
                  <td className={`${styles.num} ${i === 0 ? styles.top : ""}`}>{r.score.toLocaleString("en-US")}</td>
                  {mode !== "blitz" && <td className={styles.num}>{r.wave}</td>}
                  <td className={styles.num}>{r.kills}</td>
                  <td className={styles.num}>{Math.round(r.accuracy * 100)}%</td>
                  <td className={styles.num}>{clock(r.seconds)}</td>
                  <td className={styles.rank}>{new Date(r.at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export default Leaderboard
