import type { Metadata } from "next"
import Stats from "@/components/pages/Stats"
import site from "@/components/site/Site.module.sass"

export const metadata: Metadata = { title: "Stats" }

export default function StatsPage() {
  return (
    <div className="container">
      <header className={site.pageHead}>
        <h1>Stats</h1>
        <p>Your lifetime numbers across every mode.</p>
      </header>
      <Stats />
    </div>
  )
}
