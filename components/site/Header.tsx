"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Logo } from "./Icons"
import styles from "./Site.module.sass"

const LINKS = [
  { href: "/how-to-play", label: "How to play" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/stats", label: "Stats" },
  { href: "/achievements", label: "Achievements" },
  { href: "/settings", label: "Settings" },
]

const Header = () => {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [path, setPath] = useState(pathname)
  // Close the menu after navigating
  if (path !== pathname) {
    setPath(pathname)
    setOpen(false)
  }

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerInner}`}>
        <Link href="/" className={styles.logo}>
          <Logo /> Gunner
        </Link>
        <nav className={`${styles.nav} ${open ? styles.navOpen : ""}`} aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? styles.active : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
        <Link href="/play" className={styles.playButton}>
          Play
        </Link>
        <button type="button" className={styles.menuButton} onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  )
}

export default Header
