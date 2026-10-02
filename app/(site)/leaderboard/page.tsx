import type { Metadata } from "next"
import Leaderboard from "@/components/pages/Leaderboard"
import site from "@/components/site/Site.module.sass"

export const metadata: Metadata = { title: "Leaderboard" }

export default function LeaderboardPage() {
  return (
    <div className="container">
      <header className={site.pageHead}>
        <h1>Leaderboard</h1>
        <p>Your ten best games in each mode. Scores are saved in this browser, under the player name from Settings.</p>
      </header>
      <section className={site.section}>
        <Leaderboard />
      </section>
    </div>
  )
}
