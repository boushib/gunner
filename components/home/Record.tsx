"use client"

import Link from "next/link"
import { ACHIEVEMENTS } from "@/lib/achievements"
import { MODES, type Mode } from "@/lib/game/config"
import { achievementsStore, lifetimeStore, scoresStore } from "@/lib/save"
import styles from "./Home.module.sass"

/** Your best scores and progress, from this browser */
const Record = () => {
  const scores = scoresStore.useValue()
  const life = lifetimeStore.useValue()
  const unlocked = Object.keys(achievementsStore.useValue()).length

  if (life.games === 0)
    return (
      <p className={styles.firstGame}>
        No games yet. <Link href="/play">Play your first one</Link> and your best scores show up here.
      </p>
    )

  return (
    <div className={styles.record}>
      {(Object.keys(MODES) as Mode[]).map((m) => (
        <Link key={m} href="/leaderboard" className={styles.recordItem}>
          <span>{MODES[m].name} best</span>
          <strong>{scores[m][0] ? scores[m][0].score.toLocaleString("en-US") : "—"}</strong>
        </Link>
      ))}
      <Link href="/achievements" className={styles.recordItem}>
        <span>Achievements</span>
        <strong>
          {unlocked} / {ACHIEVEMENTS.length}
        </strong>
      </Link>
      <Link href="/stats" className={styles.recordItem}>
        <span>Games played</span>
        <strong>{life.games}</strong>
      </Link>
    </div>
  )
}

export default Record
