import type { Metadata } from "next"
import Leaderboard from "@/components/pages/Leaderboard"
import site from "@/components/site/Site.module.sass"

export const metadata: Metadata = { title: "Leaderboard" }

export default function LeaderboardPage() {
  return (
    <div className="container">
      <header className={site.pageHead}>
        <h1>Leaderboard</h1>
        <p>The ten best games in each mode on this device, with the top three on the podium.</p>
      </header>
      <section className={site.section}>
        <Leaderboard />
      </section>
    </div>
  )
}
