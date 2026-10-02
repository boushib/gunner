import { COLORS, ENEMIES, POWERS } from "./config"
import type { Engine, Enemy } from "./engine"

const TAU = Math.PI * 2

const circle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  ctx.beginPath()
  ctx.arc(x, y, Math.max(0, r), 0, TAU)
}

const drawEnemy = (ctx: CanvasRenderingContext2D, e: Enemy) => {
  const def = ENEMIES[e.kind]
  const color = e.flash > 0 ? "#ffffff" : def.color
  ctx.fillStyle = color
  ctx.strokeStyle = color
  switch (e.kind) {
    case "weaver":
      // A ring with a core
      ctx.lineWidth = 3
      circle(ctx, e.x, e.y, e.r - 1.5)
      ctx.stroke()
      circle(ctx, e.x, e.y, e.r * 0.35)
      ctx.fill()
      break
    case "splitter":
      circle(ctx, e.x, e.y, e.r)
      ctx.fill()
      ctx.fillStyle = COLORS.bg
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU + e.age * 1.5
        circle(ctx, e.x + Math.cos(a) * e.r * 0.45, e.y + Math.sin(a) * e.r * 0.45, e.r * 0.18)
        ctx.fill()
      }
      break
    case "brute":
      circle(ctx, e.x, e.y, e.r)
      ctx.fill()
      ctx.fillStyle = COLORS.bg
      circle(ctx, e.x, e.y, e.r * 0.55)
      ctx.fill()
      ctx.fillStyle = color
      circle(ctx, e.x, e.y, e.r * 0.55 * (e.hp / e.maxHp))
      ctx.fill()
      break
    case "boss": {
      circle(ctx, e.x, e.y, e.r)
      ctx.fill()
      ctx.fillStyle = COLORS.bg
      circle(ctx, e.x, e.y, e.r * 0.62)
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = 4
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + e.age * 0.8
        ctx.beginPath()
        ctx.arc(e.x, e.y, e.r * 0.42, a, a + 0.6)
        ctx.stroke()
      }
      // Health bar
      const w = e.r * 2
      ctx.fillStyle = COLORS.line
      ctx.fillRect(e.x - w / 2, e.y - e.r - 16, w, 5)
      ctx.fillStyle = def.color
      ctx.fillRect(e.x - w / 2, e.y - e.r - 16, w * (e.hp / e.maxHp), 5)
      break
    }
    default:
      circle(ctx, e.x, e.y, e.r)
      ctx.fill()
  }
}

/** Draws one frame from scratch */
export const draw = (ctx: CanvasRenderingContext2D, g: Engine) => {
  const { w, h } = g
  const c = g.center
  ctx.save()
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, w, h)

  if (g.shake > 0) ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake)

  // The arena: two faint rings around the turret
  ctx.strokeStyle = COLORS.line
  ctx.lineWidth = 1
  for (const r of [90, Math.min(w, h) * 0.36]) {
    circle(ctx, c.x, c.y, r)
    ctx.stroke()
  }

  for (const r of g.rings) {
    ctx.globalAlpha = Math.max(0, r.life * 1.4)
    ctx.strokeStyle = r.color
    ctx.lineWidth = 3
    circle(ctx, r.x, r.y, r.r)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  for (const p of g.particles) {
    ctx.globalAlpha = Math.min(1, p.life / (p.max * 0.6))
    ctx.fillStyle = p.color
    circle(ctx, p.x, p.y, p.r)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // Power orbs blink when they're about to vanish
  ctx.font = `700 13px ${g.font}`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  for (const o of g.orbs) {
    if (o.life < 2 && Math.floor(o.life * 8) % 2 === 0) continue
    const def = POWERS[o.kind]
    const pulse = 13 + Math.sin(o.life * 6) * 1.5
    ctx.fillStyle = COLORS.surface
    circle(ctx, o.x, o.y, pulse)
    ctx.fill()
    ctx.strokeStyle = def.color
    ctx.lineWidth = 2.5
    circle(ctx, o.x, o.y, pulse)
    ctx.stroke()
    ctx.fillStyle = def.color
    ctx.fillText(def.glyph, o.x, o.y + 1)
  }

  for (const e of g.enemies) drawEnemy(ctx, e)

  // Bullets with a short tail behind them
  ctx.lineCap = "round"
  ctx.lineWidth = 5
  for (const b of g.bullets) {
    const color = b.pierce ? POWERS.pierce.color : COLORS.player
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.35
    ctx.beginPath()
    ctx.moveTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.fillStyle = color
    circle(ctx, b.x, b.y, b.r)
    ctx.fill()
  }

  // The turret, blinking while it can't be hit
  if (!g.over && !(g.invuln > 0 && Math.floor(g.invuln * 10) % 2 === 0)) {
    const a = Math.atan2(g.aim.y, g.aim.x)
    ctx.save()
    ctx.translate(c.x, c.y)
    ctx.rotate(a)
    // One barrel per bullet direction, wider for heavier rounds
    const gun = g.gun
    ctx.fillStyle = COLORS.player
    const width = gun.damage > 1 ? 12 : 10
    for (const off of gun.spread.length > 1 ? gun.spread : [0]) {
      for (const side of gun.offsets) {
        ctx.save()
        ctx.rotate(off)
        ctx.beginPath()
        ctx.roundRect(8, side - width / 2, gun.spread.length > 3 ? 24 : 28, width, 4)
        ctx.fill()
        ctx.restore()
      }
    }
    ctx.restore()
    ctx.fillStyle = COLORS.player
    circle(ctx, c.x, c.y, 20)
    ctx.fill()
    ctx.fillStyle = COLORS.bg
    circle(ctx, c.x, c.y, 7)
    ctx.fill()
    if (g.shield) {
      ctx.strokeStyle = COLORS.shield
      ctx.lineWidth = 3
      circle(ctx, c.x, c.y, 30)
      ctx.stroke()
    }
    if (g.powers.slow) {
      ctx.strokeStyle = POWERS.slow.color
      ctx.globalAlpha = 0.35
      ctx.lineWidth = 2
      circle(ctx, c.x, c.y, 38)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }

  ctx.font = `700 14px ${g.font}`
  for (const f of g.floaters) {
    ctx.globalAlpha = Math.min(1, f.life * 2)
    ctx.fillStyle = f.color
    ctx.fillText(f.text, f.x, f.y)
  }
  ctx.restore()
}
