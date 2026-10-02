export type Mode = "classic" | "blitz" | "hardcore"
export type EnemyKind = "drone" | "runner" | "weaver" | "splitter" | "brute" | "boss"
export type PowerKind = "rapid" | "spread" | "pierce" | "slow" | "shield" | "nuke" | "heal"

export const COLORS = {
  bg: "#161b28",
  surface: "#1d2333",
  line: "#2a3248",
  player: "#ecf0f1",
  primary: "#fe7750",
  shield: "#4cc9f0",
}

export type EnemyDef = {
  name: string
  color: string
  radius: number
  hp: number
  /** px per second */
  speed: number
  points: number
  blurb: string
}

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  drone: { name: "Drone", color: "#fe7750", radius: 14, hp: 1, speed: 70, points: 10, blurb: "Flies straight at you. One shot." },
  runner: { name: "Runner", color: "#f9c74f", radius: 9, hp: 1, speed: 150, points: 15, blurb: "Small and fast. Don't let it slip through." },
  weaver: { name: "Weaver", color: "#4cc9f0", radius: 12, hp: 1, speed: 80, points: 20, blurb: "Zigzags on the way in, so lead your shots." },
  splitter: { name: "Splitter", color: "#43aa8b", radius: 19, hp: 2, speed: 60, points: 25, blurb: "Bursts into three runners when it dies." },
  brute: { name: "Brute", color: "#9b5de5", radius: 28, hp: 5, speed: 38, points: 40, blurb: "Slow and tough. Shrinks with every hit." },
  boss: { name: "Mothership", color: "#ef476f", radius: 54, hp: 40, speed: 45, points: 300, blurb: "Every fifth wave. Circles you and launches drones." },
}

export type PowerDef = { name: string; color: string; glyph: string; /** seconds, for timed powers */ duration: number; blurb: string }

export const POWERS: Record<PowerKind, PowerDef> = {
  rapid: { name: "Rapid fire", color: "#f9c74f", glyph: "R", duration: 8, blurb: "More than twice the fire rate." },
  spread: { name: "Spread shot", color: "#fe7750", glyph: "S", duration: 8, blurb: "Three bullets per shot." },
  pierce: { name: "Piercing rounds", color: "#9b5de5", glyph: "P", duration: 8, blurb: "Bullets go through everything in their way." },
  slow: { name: "Slow time", color: "#4cc9f0", glyph: "T", duration: 6, blurb: "Enemies move at 40% speed." },
  shield: { name: "Shield", color: "#43aa8b", glyph: "O", duration: 0, blurb: "Blocks the next hit." },
  nuke: { name: "Nuke", color: "#ef476f", glyph: "!", duration: 0, blurb: "Destroys every enemy on screen and wounds the boss." },
  heal: { name: "Extra life", color: "#ecf0f1", glyph: "+", duration: 0, blurb: "One more life (up to five). Five more seconds in Blitz." },
}

export const TIMED: PowerKind[] = ["rapid", "spread", "pierce", "slow"]

export type ModeDef = { name: string; blurb: string; lives: number }

export const MODES: Record<Mode, ModeDef> = {
  classic: { name: "Classic", blurb: "Survive endless waves with three lives. A boss every fifth wave.", lives: 3 },
  blitz: { name: "Blitz", blurb: "90 seconds, nonstop enemies. Getting hit costs you five seconds.", lives: Infinity },
  hardcore: { name: "Hardcore", blurb: "One life, faster enemies, double points.", lives: 1 },
}

export const BLITZ_SECONDS = 90
export const MAX_LIVES = 5

export type Gun = {
  name: string
  /** Shots per second */
  rate: number
  /** Angles of each bullet, in radians from where you aim */
  spread: number[]
  /** Side-by-side barrels, in px from the middle (for twin guns) */
  offsets: number[]
  damage: number
  /** Bullet radius */
  size: number
  /** Kills needed to reach the next level */
  next: number
}

/** Your gun levels up as you destroy enemies, and drops a level when you're hit */
export const GUNS: Gun[] = [
  { name: "Pea shooter", rate: 5, spread: [0], offsets: [0], damage: 1, size: 4, next: 8 },
  { name: "Repeater", rate: 7, spread: [0], offsets: [0], damage: 1, size: 4, next: 14 },
  { name: "Twin cannon", rate: 7, spread: [0], offsets: [-6, 6], damage: 1, size: 4, next: 20 },
  { name: "Tri-blaster", rate: 8, spread: [-0.12, 0, 0.12], offsets: [0], damage: 1, size: 4.5, next: 28 },
  { name: "Heavy tri-blaster", rate: 8, spread: [-0.12, 0, 0.12], offsets: [0], damage: 2, size: 5.5, next: 36 },
  { name: "Storm cannon", rate: 9, spread: [-0.22, -0.11, 0, 0.11, 0.22], offsets: [0], damage: 2, size: 5.5, next: Infinity },
]
