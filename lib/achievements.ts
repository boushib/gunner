import type { RunStats } from "./game/engine"
import type { Lifetime } from "./save"

export type Achievement = {
  id: string
  name: string
  blurb: string
  /** Checked after every run, with lifetime stats that already include it */
  check: (run: RunStats, life: Lifetime) => boolean
}

const kills = (run: RunStats) => Object.values(run.kills).reduce((a, b) => a + b, 0)

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-blood", name: "First blood", blurb: "Destroy your first enemy.", check: (r) => kills(r) >= 1 },
  { id: "century", name: "Century", blurb: "Destroy 100 enemies in one game.", check: (r) => kills(r) >= 100 },
  { id: "sharpshooter", name: "Sharpshooter", blurb: "Finish a game with 75% accuracy or better (50 shots or more).", check: (r) => r.shots >= 50 && r.hits / r.shots >= 0.75 },
  { id: "combo-25", name: "On a roll", blurb: "Reach a 25 combo.", check: (r) => r.bestCombo >= 25 },
  { id: "combo-60", name: "Unstoppable", blurb: "Reach a 60 combo.", check: (r) => r.bestCombo >= 60 },
  { id: "gun-max", name: "Fully loaded", blurb: "Upgrade your gun to the Storm cannon.", check: (r) => r.bestGun >= 6 },
  { id: "boss", name: "Mothership down", blurb: "Destroy a Mothership.", check: (r) => r.kills.boss >= 1 },
  { id: "wave-10", name: "Holding the line", blurb: "Reach wave 10 in Classic.", check: (r) => r.mode === "classic" && r.wave >= 10 },
  { id: "wave-20", name: "Last turret standing", blurb: "Reach wave 20 in Classic.", check: (r) => r.mode === "classic" && r.wave >= 20 },
  { id: "perfect-5", name: "Untouchable", blurb: "Clear five waves without a scratch in one game.", check: (r) => r.perfectWaves >= 5 },
  { id: "score-10k", name: "Five figures", blurb: "Score 10,000 points in one game.", check: (r) => r.score >= 10000 },
  { id: "collector", name: "Collector", blurb: "Grab 8 power-ups in one game.", check: (r) => r.powerups >= 8 },
  { id: "nuke-15", name: "Clean sweep", blurb: "Destroy 15 enemies with one nuke.", check: (r) => r.bestNuke >= 15 },
  { id: "blitz-5k", name: "Blitzkrieg", blurb: "Score 5,000 in Blitz.", check: (r) => r.mode === "blitz" && r.score >= 5000 },
  { id: "hardcore-5", name: "Nerves of steel", blurb: "Reach wave 5 in Hardcore.", check: (r) => r.mode === "hardcore" && r.wave >= 5 },
  { id: "veteran", name: "Veteran", blurb: "Play 50 games.", check: (_, l) => l.games >= 50 },
  { id: "exterminator", name: "Exterminator", blurb: "Destroy 5,000 enemies in total.", check: (_, l) => Object.values(l.kills).reduce((a, b) => a + b, 0) >= 5000 },
]
