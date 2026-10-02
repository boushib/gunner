import { COLORS } from "./config"

const STEEL = "#dfe3ea"
const DARK = "#3a4360"
const VEST = "#4b5573"
const GLOVE = "#262d42"
const WOOD = "#9a6a48"
const HELMET = "#8d99b8"
const ACCENT = COLORS.primary
const FLASH = "#ffd166"

type Ctx = CanvasRenderingContext2D
type Pt = [number, number]

const box = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number, color: string) => {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}

const shape = (ctx: Ctx, points: Pt[], color: string) => {
  ctx.fillStyle = color
  ctx.beginPath()
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
  ctx.fill()
}

const dot = (ctx: Ctx, x: number, y: number, r: number, color: string) => {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

const limb = (ctx: Ctx, from: Pt, to: Pt, width: number, color: string) => {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = "round"
  ctx.beginPath()
  ctx.moveTo(...from)
  ctx.lineTo(...to)
  ctx.stroke()
}

/** A star-shaped flash in front of a muzzle */
const flash = (ctx: Ctx, x: number, y: number, size: number) => {
  shape(ctx, [[x + size * 1.8, y], [x + size * 0.4, y + size * 0.5], [x + size * 0.2, y + size], [x, y + size * 0.3], [x - size * 0.2, y], [x, y - size * 0.3], [x + size * 0.2, y - size], [x + size * 0.4, y - size * 0.5]], FLASH)
}

/** Guns are drawn this much bigger in the game than their drawing units */
export const GUN_SCALE = 1.2

/** How far in front of the gunner each muzzle is, so bullets leave from the barrel */
export const MUZZLE = [36, 44, 54, 60, 64, 66]

/** Where the hands hold each gun: trigger hand and support hand, along the gun */
const HANDS: Array<[number, number]> = [
  [16, 20],
  [14, 28],
  [16, 30],
  [16, 34],
  [16, 36],
  [12, 30],
]

/** A gun seen from above, pointing along +x */
const drawGun = (ctx: Ctx, level: number, spin: number, firing: boolean) => {
  const m = MUZZLE[level - 1]
  switch (level) {
    case 1: {
      // Pistol: slide with rear and front sights
      box(ctx, 14, -3, 22, 6, 2, STEEL)
      box(ctx, 15, -1.5, 3, 3, 1, DARK)
      box(ctx, 20, -1, 10, 2, 1, DARK)
      dot(ctx, 34, 0, 1.2, DARK)
      if (firing) flash(ctx, m + 2, 0, 4.5)
      break
    }
    case 2: {
      // SMG: folded wire stock, body with a top rail, short barrel
      ctx.strokeStyle = STEEL
      ctx.lineWidth = 1.5
      ctx.strokeRect(2, -3.5, 10, 7)
      box(ctx, 10, -4, 24, 8, 2.5, STEEL)
      for (let i = 0; i < 5; i++) box(ctx, 13 + i * 3.6, -1.5, 2, 3, 0.8, DARK)
      box(ctx, 34, -2, 10, 4, 1, STEEL)
      box(ctx, 41, -2.8, 3, 5.6, 1, DARK)
      if (firing) flash(ctx, m + 2, 0, 5.5)
      break
    }
    case 3: {
      // Double barrel: wooden stock and fore-end, two barrels side by side
      shape(ctx, [[-2, -5], [10, -4], [10, 4], [-2, 5]], WOOD)
      box(ctx, 10, -5, 9, 10, 2, DARK)
      box(ctx, 19, -5.2, 35, 4.4, 2, STEEL)
      box(ctx, 19, 0.8, 35, 4.4, 2, STEEL)
      box(ctx, 24, -5.5, 12, 11, 2, WOOD)
      box(ctx, 52, -5.6, 2.5, 11.2, 1, DARK)
      if (firing) {
        flash(ctx, m + 2, -3, 4.5)
        flash(ctx, m + 2, 3, 4.5)
      }
      break
    }
    case 4: {
      // Assault rifle: stock, receiver with a scope, vented handguard, muzzle brake
      shape(ctx, [[-4, -5], [10, -3.5], [10, 3.5], [-4, 5]], DARK)
      box(ctx, 10, -4, 18, 8, 2, STEEL)
      box(ctx, 12, -3, 13, 6, 2.5, DARK)
      dot(ctx, 25, 0, 2.2, ACCENT)
      box(ctx, 28, -4.5, 15, 9, 2, DARK)
      for (let i = 0; i < 3; i++) box(ctx, 30 + i * 4.5, -3, 2.5, 6, 1, STEEL)
      box(ctx, 43, -1.6, 13, 3.2, 1, STEEL)
      box(ctx, 55, -2.8, 5, 5.6, 1, DARK)
      if (firing) flash(ctx, m + 2, 0, 6)
      break
    }
    case 5: {
      // Machine gun: side-mounted ammo box, perforated shroud, folded bipod
      shape(ctx, [[-4, -6], [10, -5], [10, 5], [-4, 6]], DARK)
      box(ctx, 13, 5, 12, 9, 2, DARK)
      box(ctx, 13, 8, 12, 2.5, 0, ACCENT)
      box(ctx, 10, -5.5, 20, 11, 2.5, STEEL)
      box(ctx, 13, -3.5, 12, 7, 2, DARK)
      box(ctx, 30, -5, 22, 10, 2.5, DARK)
      for (let i = 0; i < 4; i++) {
        dot(ctx, 34 + i * 5, -2.2, 1.2, STEEL)
        dot(ctx, 34 + i * 5, 2.2, 1.2, STEEL)
      }
      box(ctx, 34, -6.8, 14, 1.6, 0.8, STEEL)
      box(ctx, 34, 5.2, 14, 1.6, 0.8, STEEL)
      box(ctx, 52, -2, 7, 4, 1, STEEL)
      box(ctx, 58, -3.5, 6, 7, 1.5, ACCENT)
      if (firing) flash(ctx, m + 2, 0, 7)
      break
    }
    default: {
      // Minigun: motor housing, a cluster of spinning barrels held by clamps
      box(ctx, 4, -8, 14, 16, 4, DARK)
      box(ctx, 16, -7, 10, 14, 3, STEEL)
      // The barrel cluster seen from above: the shaded one moves as they spin
      const lit = Math.floor(spin) % 4
      for (let i = 0; i < 4; i++) box(ctx, 26, -5.6 + i * 3, 37, 2.4, 1, i === lit ? VEST : STEEL)
      box(ctx, 36, -7, 3.5, 14, 1.5, DARK)
      box(ctx, 52, -7, 3.5, 14, 1.5, DARK)
      box(ctx, 62, -7, 4, 14, 1.5, ACCENT)
      if (firing) flash(ctx, m + 2, 0, 8)
    }
  }
}

/**
 * The gunner seen from above, facing +x and holding the gun for `level` (1–6).
 * `spin` turns the minigun's barrels; `firing` shows a muzzle flash.
 */
export const drawGunner = (ctx: Ctx, level: number, { spin = 0, firing = false } = {}) => {
  const lv = Math.max(1, Math.min(6, level))
  const [grip, fore] = HANDS[lv - 1]

  // The minigun's ammo backpack and belt
  if (lv === 6) {
    box(ctx, -19, -10, 9, 20, 3, DARK)
    ctx.strokeStyle = ACCENT
    ctx.lineWidth = 3
    ctx.setLineDash([2.5, 1.5])
    ctx.beginPath()
    ctx.moveTo(-15, 9)
    ctx.quadraticCurveTo(-4, 20, 10, 8)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Shoulders, and arms reaching forward to the gun (under it, so the gun stays visible)
  ctx.fillStyle = VEST
  ctx.beginPath()
  ctx.ellipse(-3, 0, 6.5, 14.5, 0, 0, Math.PI * 2)
  ctx.fill()
  limb(ctx, [0, 11], [grip, 4.5], 4, VEST)
  limb(ctx, [0, -11], [fore, -4.5], 4, VEST)

  drawGun(ctx, lv, spin, firing)

  // Gloved hands gripping the sides of the gun
  dot(ctx, grip, 4.5, 2.6, GLOVE)
  dot(ctx, fore, -4.5, 2.6, GLOVE)

  // Helmet
  dot(ctx, -3, 0, 7.5, HELMET)
  box(ctx, 1.5, -3.5, 2.5, 7, 1.2, DARK)
}
