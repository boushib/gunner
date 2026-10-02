import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"
import Demo from "@/components/home/Demo"
import Record from "@/components/home/Record"
import { EnemyIcon, PowerIcon } from "@/components/site/Icons"
import { ENEMIES, MODES, POWERS, type EnemyKind, type Mode, type PowerKind } from "@/lib/game/config"
import site from "@/components/site/Site.module.sass"
import styles from "@/components/home/Home.module.sass"

export default function Home() {
  return (
    <>
      <section className={styles.hero}>
        <Demo />
        <div className={`container ${styles.heroInner}`}>
          <h1>Gunner</h1>
          <p>You&apos;re a turret in the middle of the screen. Everything is coming for you. Aim, hold to fire, and survive as long as you can.</p>
          <div className={styles.heroActions}>
            <Link href="/play" className={site.primary}>
              <Play size={18} /> Play now
            </Link>
            <Link href="/how-to-play" className={site.secondary}>
              How to play
            </Link>
          </div>
        </div>
      </section>

      <div className="container">
        <section className={site.section}>
          <h2>Your record</h2>
          <Record />
        </section>

        <section className={site.section}>
          <h2>Three ways to play</h2>
          <div className={styles.modes}>
            {(Object.keys(MODES) as Mode[]).map((m) => (
              <Link key={m} href={`/play?mode=${m}`} className={styles.mode}>
                <h3>{MODES[m].name}</h3>
                <p>{MODES[m].blurb}</p>
                <span>
                  Play <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className={site.section}>
          <h2>Know what&apos;s coming</h2>
          <div className={styles.lineup}>
            {(Object.keys(ENEMIES) as EnemyKind[]).map((k) => (
              <div key={k}>
                <EnemyIcon kind={k} size={56} />
                <span>{ENEMIES[k].name}</span>
              </div>
            ))}
          </div>
          <div className={styles.lineup}>
            {(Object.keys(POWERS) as PowerKind[]).map((k) => (
              <div key={k}>
                <PowerIcon kind={k} size={44} />
                <span>{POWERS[k].name}</span>
              </div>
            ))}
          </div>
          <Link href="/how-to-play" className={styles.more}>
            Enemies, power-ups and scoring <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </>
  )
}
