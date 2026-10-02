import { COLORS, ENEMIES, POWERS, type EnemyKind, type PowerKind } from "@/lib/game/config"

/** An enemy drawn the way it looks in the game */
export const EnemyIcon = ({ kind, size = 48 }: { kind: EnemyKind; size?: number }) => {
  const color = ENEMIES[kind].color
  const bg = COLORS.bg
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      {kind === "drone" && <circle cx="24" cy="24" r="12" fill={color} />}
      {kind === "runner" && <circle cx="24" cy="24" r="8" fill={color} />}
      {kind === "weaver" && (
        <>
          <circle cx="24" cy="24" r="11" fill="none" stroke={color} strokeWidth="3" />
          <circle cx="24" cy="24" r="4.5" fill={color} />
        </>
      )}
      {kind === "splitter" && (
        <>
          <circle cx="24" cy="24" r="16" fill={color} />
          {[0, 1, 2].map((i) => {
            const a = (i / 3) * Math.PI * 2 - Math.PI / 2
            return <circle key={i} cx={24 + Math.cos(a) * 7} cy={24 + Math.sin(a) * 7} r="3" fill={bg} />
          })}
        </>
      )}
      {kind === "brute" && (
        <>
          <circle cx="24" cy="24" r="20" fill={color} />
          <circle cx="24" cy="24" r="11" fill={bg} />
          <circle cx="24" cy="24" r="7" fill={color} />
        </>
      )}
      {kind === "boss" && (
        <>
          <circle cx="24" cy="24" r="22" fill={color} />
          <circle cx="24" cy="24" r="13.5" fill={bg} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2
            const b = a + 0.6
            const r = 9
            return <path key={i} d={`M${24 + Math.cos(a) * r} ${24 + Math.sin(a) * r} A${r} ${r} 0 0 1 ${24 + Math.cos(b) * r} ${24 + Math.sin(b) * r}`} stroke={color} strokeWidth="3" fill="none" />
          })}
        </>
      )}
    </svg>
  )
}

/** A power-up orb as it floats in the game */
export const PowerIcon = ({ kind, size = 40 }: { kind: PowerKind; size?: number }) => {
  const def = POWERS[kind]
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="16" fill={COLORS.surface} stroke={def.color} strokeWidth="3" />
      <text x="20" y="21" textAnchor="middle" dominantBaseline="middle" fill={def.color} fontSize="15" fontWeight="700" fontFamily="var(--font-display), sans-serif">
        {def.glyph}
      </text>
    </svg>
  )
}

export const Logo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
    <rect x="15" y="4" width="6" height="12" rx="2.5" fill={COLORS.player} transform="rotate(35 16 16)" />
    <circle cx="16" cy="16" r="10" fill={COLORS.player} />
    <circle cx="16" cy="16" r="3.5" fill={COLORS.primary} />
  </svg>
)
