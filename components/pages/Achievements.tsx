"use client"

import { Lock, Trophy } from "lucide-react"
import { ACHIEVEMENTS } from "@/lib/achievements"
import { achievementsStore } from "@/lib/save"
import site from "@/components/site/Site.module.sass"
import styles from "./Pages.module.sass"

/** Every achievement, unlocked ones first */
const Achievements = () => {
  const have = achievementsStore.useValue()
  const count = ACHIEVEMENTS.filter((a) => have[a.id]).length
  const sorted = [...ACHIEVEMENTS].sort((a, b) => Number(!have[a.id]) - Number(!have[b.id]))

  return (
    <>
      <div className={styles.progress}>
        <span>
          {count} of {ACHIEVEMENTS.length} unlocked
        </span>
        <div>
          <i style={{ width: `${(count / ACHIEVEMENTS.length) * 100}%` }} />
        </div>
      </div>
      <div className={site.cardGrid}>
        {sorted.map((a) => (
          <article key={a.id} className={`${site.card} ${styles.badge} ${have[a.id] ? "" : styles.locked}`}>
            <span className={styles.badgeIcon}>{have[a.id] ? <Trophy size={20} /> : <Lock size={18} />}</span>
            <div>
              <h3>{a.name}</h3>
              <p>{a.blurb}</p>
              {have[a.id] && <span className={styles.when}>Unlocked {new Date(have[a.id]).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

export default Achievements
