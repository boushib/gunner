"use client"

import { ACHIEVEMENTS } from "./achievements"
import type { EnemyKind, Mode } from "./game/config"
import type { RunStats } from "./game/engine"
import { createStore, isObject } from "./store"
import { cleanUsername, isValidUsername, randomUsername } from "./usernames"

export type Settings = { name: string; volume: number; muted: boolean; shake: boolean; particles: "high" | "low" }

export const settingsStore = createStore<Settings>("gunner:settings", { name: "Player", volume: 0.6, muted: false, shake: true, particles: "high" }, (raw) => {
  if (!isObject(raw)) return null
  return {
    name: typeof raw.name === "string" && isValidUsername(cleanUsername(raw.name)) ? cleanUsername(raw.name) : "Player",
    volume: typeof raw.volume === "number" ? Math.min(1, Math.max(0, raw.volume)) : 0.6,
    muted: raw.muted === true,
    shake: raw.shake !== false,
    particles: raw.particles === "low" ? "low" : "high",
  }
})

export type Score = { name: string; score: number; wave: number; kills: number; accuracy: number; seconds: number; at: string }
export type Scores = Record<Mode, Score[]>

const EMPTY_SCORES: Scores = { classic: [], blitz: [], hardcore: [] }
const isScore = (s: unknown): s is Score => isObject(s) && typeof s.score === "number" && typeof s.at === "string"

export const scoresStore = createStore<Scores>("gunner:scores", EMPTY_SCORES, (raw) => {
  if (!isObject(raw)) return null
  const list = (m: Mode) => (Array.isArray(raw[m]) ? (raw[m] as unknown[]).filter(isScore).slice(0, 10) : [])
  return { classic: list("classic"), blitz: list("blitz"), hardcore: list("hardcore") }
})

export type Lifetime = {
  games: number
  seconds: number
  kills: Record<EnemyKind, number>
  shots: number
  hits: number
  bestCombo: number
  bestWave: number
  powerups: number
  perfectWaves: number
  gamesByMode: Record<Mode, number>
}

const EMPTY_KILLS: Record<EnemyKind, number> = { drone: 0, runner: 0, weaver: 0, splitter: 0, brute: 0, boss: 0 }
const EMPTY_LIFETIME: Lifetime = { games: 0, seconds: 0, kills: EMPTY_KILLS, shots: 0, hits: 0, bestCombo: 0, bestWave: 0, powerups: 0, perfectWaves: 0, gamesByMode: { classic: 0, blitz: 0, hardcore: 0 } }
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0)

export const lifetimeStore = createStore<Lifetime>("gunner:lifetime", EMPTY_LIFETIME, (raw) => {
  if (!isObject(raw)) return null
  const k = isObject(raw.kills) ? raw.kills : {}
  const g = isObject(raw.gamesByMode) ? raw.gamesByMode : {}
  return {
    games: num(raw.games),
    seconds: num(raw.seconds),
    kills: Object.fromEntries(Object.keys(EMPTY_KILLS).map((key) => [key, num(k[key])])) as Record<EnemyKind, number>,
    shots: num(raw.shots),
    hits: num(raw.hits),
    bestCombo: num(raw.bestCombo),
    bestWave: num(raw.bestWave),
    powerups: num(raw.powerups),
    perfectWaves: num(raw.perfectWaves),
    gamesByMode: { classic: num(g.classic), blitz: num(g.blitz), hardcore: num(g.hardcore) },
  }
})

/** Achievement id → when it was unlocked */
export const achievementsStore = createStore<Record<string, string>>("gunner:achievements", {}, (raw) =>
  isObject(raw) ? (Object.fromEntries(Object.entries(raw).filter(([, v]) => typeof v === "string")) as Record<string, string>) : null
)

/**
 * Gives this browser a real username the first time it's needed (instead of "Player"),
 * and moves scores saved as "Player" over to it
 */
export const ensureUsername = () => {
  const current = settingsStore.read().name
  if (current !== "Player") return current
  const name = randomUsername()
  settingsStore.set((s) => ({ ...s, name }))
  scoresStore.set((all) => {
    const fix = (list: Score[]) => list.map((e) => (e.name === "Player" ? { ...e, name } : e))
    return { classic: fix(all.classic), blitz: fix(all.blitz), hardcore: fix(all.hardcore) }
  })
  return name
}

/** Renames you everywhere: settings and the scores saved under your old name */
export const renameUser = (name: string) => {
  const old = settingsStore.read().name
  settingsStore.set((s) => ({ ...s, name }))
  scoresStore.set((all) => {
    const fix = (list: Score[]) => list.map((e) => (e.name === old ? { ...e, name } : e))
    return { classic: fix(all.classic), blitz: fix(all.blitz), hardcore: fix(all.hardcore) }
  })
}

/** Saves a finished game everywhere; says whether it's a new best and what it unlocked */
export const recordRun = (run: RunStats) => {
  ensureUsername()
  const at = new Date().toISOString()
  const kills = Object.values(run.kills).reduce((a, b) => a + b, 0)
  const previous = scoresStore.read()[run.mode]
  const best = run.score > 0 && run.score > (previous[0]?.score ?? 0)
  if (run.score > 0) {
    const entry: Score = { name: settingsStore.read().name, score: run.score, wave: run.wave, kills, accuracy: run.shots ? run.hits / run.shots : 0, seconds: Math.round(run.seconds), at }
    scoresStore.set((s) => ({ ...s, [run.mode]: [...s[run.mode], entry].sort((a, b) => b.score - a.score).slice(0, 10) }))
  }

  lifetimeStore.set((l) => ({
    games: l.games + 1,
    seconds: l.seconds + run.seconds,
    kills: Object.fromEntries(Object.entries(l.kills).map(([k, v]) => [k, v + run.kills[k as EnemyKind]])) as Record<EnemyKind, number>,
    shots: l.shots + run.shots,
    hits: l.hits + run.hits,
    bestCombo: Math.max(l.bestCombo, run.bestCombo),
    bestWave: run.mode === "blitz" ? l.bestWave : Math.max(l.bestWave, run.wave),
    powerups: l.powerups + run.powerups,
    perfectWaves: l.perfectWaves + run.perfectWaves,
    gamesByMode: { ...l.gamesByMode, [run.mode]: l.gamesByMode[run.mode] + 1 },
  }))

  const life = lifetimeStore.read()
  const have = achievementsStore.read()
  const unlocked = ACHIEVEMENTS.filter((a) => !have[a.id] && a.check(run, life))
  if (unlocked.length) achievementsStore.set((s) => ({ ...s, ...Object.fromEntries(unlocked.map((a) => [a.id, at])) }))
  return { best, unlocked: unlocked.map((a) => a.name) }
}

export const resetAll = () => {
  scoresStore.reset()
  lifetimeStore.reset()
  achievementsStore.reset()
}
