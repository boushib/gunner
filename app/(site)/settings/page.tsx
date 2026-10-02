import type { Metadata } from "next"
import SettingsForm from "@/components/pages/SettingsForm"
import site from "@/components/site/Site.module.sass"

export const metadata: Metadata = { title: "Settings" }

export default function SettingsPage() {
  return (
    <div className="container">
      <header className={site.pageHead}>
        <h1>Settings</h1>
        <p>Changes save right away, in this browser.</p>
      </header>
      <section className={site.section}>
        <SettingsForm />
      </section>
    </div>
  )
}
