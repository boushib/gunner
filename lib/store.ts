"use client"

import { useSyncExternalStore } from "react"

/**
 * A tiny localStorage-backed store shared by every component (and kept in sync across tabs).
 * Reads are validated so a damaged or outdated save falls back to defaults.
 */
export const createStore = <T>(key: string, fallback: T, validate: (raw: unknown) => T | null) => {
  const listeners = new Set<() => void>()
  let cache: T | undefined

  const read = (): T => {
    if (cache !== undefined) return cache
    try {
      const raw = localStorage.getItem(key)
      cache = (raw && validate(JSON.parse(raw))) || fallback
    } catch {
      cache = fallback
    }
    return cache
  }

  const set = (update: T | ((prev: T) => T)) => {
    cache = typeof update === "function" ? (update as (prev: T) => T)(read()) : update
    try {
      localStorage.setItem(key, JSON.stringify(cache))
    } catch {}
    listeners.forEach((l) => l())
  }

  const subscribe = (l: () => void) => {
    listeners.add(l)
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return
      cache = undefined
      l()
    }
    window.addEventListener("storage", onStorage)
    return () => {
      listeners.delete(l)
      window.removeEventListener("storage", onStorage)
    }
  }

  const use = () => useSyncExternalStore(subscribe, read, () => fallback)

  return { read, set, use, reset: () => set(fallback) }
}

export const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)
