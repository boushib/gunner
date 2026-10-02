import type { Metadata } from "next"
import Achievements from "@/components/pages/Achievements"
import site from "@/components/site/Site.module.sass"

export const metadata: Metadata = { title: "Achievements" }

export default function AchievementsPage() {
  return (
    <div className="container">
      <header className={site.pageHead}>
        <h1>Achievements</h1>
        <p>Goals to chase across all three modes.</p>
      </header>
      <section className={site.section}>
        <Achievements />
      </section>
    </div>
  )
}
