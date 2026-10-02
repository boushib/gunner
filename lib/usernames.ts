const ADJECTIVES = ["Swift", "Silent", "Brave", "Lucky", "Rapid", "Iron", "Neon", "Crimson", "Frosty", "Wild", "Steady", "Atomic", "Solar", "Shadow", "Turbo", "Cosmic"]
const NOUNS = ["Falcon", "Viper", "Comet", "Tiger", "Ranger", "Wolf", "Hawk", "Raven", "Bolt", "Fox", "Panther", "Rocket", "Striker", "Nova", "Badger", "Phoenix"]

const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)]

/** A fresh username like "SwiftFalcon42" */
export const randomUsername = () => `${pick(ADJECTIVES)}${pick(NOUNS)}${10 + Math.floor(Math.random() * 90)}`

/** 3 to 16 letters, numbers, _ or - */
export const cleanUsername = (name: string) => name.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 16)

export const isValidUsername = (name: string) => /^[A-Za-z0-9_-]{3,16}$/.test(name)

/** A steady color per username, for avatars */
export const usernameColor = (name: string) => {
  const colors = ["#fe7750", "#f9c74f", "#4cc9f0", "#43aa8b", "#9b5de5", "#ef476f", "#90be6d", "#f3722c"]
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return colors[h % colors.length]
}
