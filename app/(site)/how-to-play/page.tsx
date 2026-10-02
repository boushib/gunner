import type { Metadata } from "next"
import { EnemyIcon, PowerIcon } from "@/components/site/Icons"
import { ENEMIES, GUNS, MODES, POWERS, type EnemyKind, type Mode, type PowerKind } from "@/lib/game/config"
import site from "@/components/site/Site.module.sass"
import styles from "@/components/pages/Pages.module.sass"

export const metadata: Metadata = { title: "How to play" }

const CONTROLS = [
  ["Aim", "Move the mouse, or drag your finger"],
  ["Fire", "Hold the mouse button, your finger or the space bar"],
  ["Pause", "P or Esc (the game also pauses when you switch tabs)"],
]

export default function HowToPlay() {
  return (
    <div className="container">
      <header className={site.pageHead}>
        <h1>How to play</h1>
        <p>You&apos;re the turret in the middle. Enemies fly in from every side; shoot them before they reach you.</p>
      </header>

      <section className={site.section}>
        <h2>Controls</h2>
        <dl className={styles.controls}>
          {CONTROLS.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={site.section}>
        <h2>Enemies</h2>
        <div className={site.cardGrid}>
          {(Object.keys(ENEMIES) as EnemyKind[]).map((k) => {
            const e = ENEMIES[k]
            return (
              <article key={k} className={`${site.card} ${styles.entry}`}>
                <EnemyIcon kind={k} size={52} />
                <div>
                  <h3>{e.name}</h3>
                  <p>{e.blurb}</p>
                  <span className={styles.facts}>
                    {e.points} pts · {e.hp} {e.hp === 1 ? "hit" : "hits"}
                    {k === "boss" ? " (more each time)" : ""}
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className={site.section}>
        <h2>Your gun</h2>
        <p className={styles.lead}>Every kill fills your gun bar (a brute counts three, a Mothership fills it). A full bar upgrades your gun for the rest of the game. Getting hit knocks it down a level.</p>
        <ol className={styles.guns}>
          {GUNS.map((g, i) => (
            <li key={g.name}>
              <span className={styles.level}>Lv {i + 1}</span>
              <strong>{g.name}</strong>
              <span>
                {g.rate} shots/s · {g.spread.length * g.offsets.length} {g.spread.length * g.offsets.length === 1 ? "bullet" : "bullets"}
                {g.damage > 1 ? " · double damage" : ""}
              </span>
              <span className={styles.facts}>{Number.isFinite(g.next) ? `${g.next} kills to the next level` : "Top level"}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className={site.section}>
        <h2>Power-ups</h2>
        <p className={styles.lead}>Destroyed enemies sometimes drop an orb. Shoot it to grab it before it fades.</p>
        <div className={site.cardGrid}>
          {(Object.keys(POWERS) as PowerKind[]).map((k) => {
            const p = POWERS[k]
            return (
              <article key={k} className={`${site.card} ${styles.entry}`}>
                <PowerIcon kind={k} size={44} />
                <div>
                  <h3>{p.name}</h3>
                  <p>{p.blurb}</p>
                  {p.duration > 0 && <span className={styles.facts}>{p.duration} seconds</span>}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className={site.section}>
        <h2>Scoring</h2>
        <ul className={styles.rules}>
          <li>
            <b>Combos:</b> kills less than two seconds apart build a combo. Every 8 kills add ×1 to your points, up to ×5. Getting hit resets it.
          </li>
          <li>
            <b>Wave clear:</b> 50 points × the wave number when a wave ends.
          </li>
          <li>
            <b>Perfect wave:</b> another 100 × the wave number if you cleared it without getting hit.
          </li>
          <li>
            <b>Hardcore</b> doubles every point you earn.
          </li>
        </ul>
      </section>

      <section className={site.section}>
        <h2>Modes</h2>
        <div className={site.cardGrid}>
          {(Object.keys(MODES) as Mode[]).map((m) => (
            <article key={m} className={site.card}>
              <h3>{MODES[m].name}</h3>
              <p>{MODES[m].blurb}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
