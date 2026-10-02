"use client"

import Link from "next/link"
import { EnemyIcon } from "@/components/site/Icons"
import { ENEMIES, MODES, type EnemyKind, type Mode } from "@/lib/game/config"
import { lifetimeStore } from "@/lib/save"
import site from "@/components/site/Site.module.sass"
import styles from "./Pages.module.sass"

const duration = (s: number) => {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}h ${m}m` : `${m}m ${Math.floor(s % 60)}s`
}

/** Everything you've done across all your games */
const Stats = () => {
  const life = lifetimeStore.useValue()
  if (life.games === 0)
    return (
      <p className={site.empty}>
        Nothing yet. <Link href="/play">Play a game</Link> and your stats build up here.
      </p>
    )

  const kills = Object.values(life.kills).reduce((a, b) => a + b, 0)
  const most = Math.max(...Object.values(life.kills), 1)
  const cards = [
    ["Games played", life.games.toLocaleString("en-US")],
    ["Time played", duration(life.seconds)],
    ["Enemies destroyed", kills.toLocaleString("en-US")],
    ["Accuracy", `${life.shots ? Math.round((life.hits / life.shots) * 100) : 0}%`],
    ["Shots fired", life.shots.toLocaleString("en-US")],
    ["Best combo", life.bestCombo],
    ["Highest wave", life.bestWave || "—"],
    ["Power-ups grabbed", life.powerups],
  ]

  return (
    <>
      <section className={site.section}>
        <dl className={styles.statGrid}>
          {cards.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={site.section}>
        <h2>Destroyed, by enemy</h2>
        <div className={styles.bars}>
          {(Object.keys(ENEMIES) as EnemyKind[]).map((k) => (
            <div key={k} className={styles.bar}>
              <EnemyIcon kind={k} size={32} />
              <span>{ENEMIES[k].name}</span>
              <div className={styles.track}>
                <i style={{ width: `${(life.kills[k] / most) * 100}%`, backgroundColor: ENEMIES[k].color }} />
              </div>
              <span>{life.kills[k].toLocaleString("en-US")}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={site.section}>
        <h2>Games by mode</h2>
        <dl className={styles.statGrid}>
          {(Object.keys(MODES) as Mode[]).map((m) => (
            <div key={m}>
              <dt>{MODES[m].name}</dt>
              <dd>{life.gamesByMode[m]}</dd>
            </div>
          ))}
          <div>
            <dt>Perfect waves</dt>
            <dd>{life.perfectWaves}</dd>
          </div>
        </dl>
      </section>
    </>
  )
}

export default Stats
