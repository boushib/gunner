import Link from "next/link"
import Header from "@/components/site/Header"
import styles from "@/components/site/Site.module.sass"

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <div className="container">
          <span>Gunner · an arcade shooter built with Next.js and canvas</span>
          <Link href="https://github.com/boushib/gunner">Source on GitHub</Link>
        </div>
      </footer>
    </>
  )
}
