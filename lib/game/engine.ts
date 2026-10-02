import { BLITZ_SECONDS, COLORS, ENEMIES, GUNS, MAX_LIVES, MODES, POWERS, TIMED, type EnemyKind, type Mode, type PowerKind } from "./config"
import { draw } from "./draw"
import { GUN_SCALE, MUZZLE } from "./guns"

export type Enemy = {
  id: number
  kind: EnemyKind
  x: number
  y: number
  r: number
  baseR: number
  hp: number
  maxHp: number
  speed: number
  /** Knockback velocity, fades out */
  kx: number
  ky: number
  phase: number
  flash: number
  /** Boss: seconds until it launches drones, and how long it has circled */
  timer: number
  age: number
}
export type Bullet = { x: number; y: number; vx: number; vy: number; r: number; damage: number; pierce: boolean; hit: Set<number> }
export type Particle = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number; color: string }
export type Floater = { x: number; y: number; text: string; life: number; color: string }
export type Ring = { x: number; y: number; r: number; max: number; life: number; color: string }
export type Orb = { kind: PowerKind; x: number; y: number; vx: number; vy: number; life: number }

export type Sound = "shoot" | "hit" | "kill" | "hurt" | "power" | "wave" | "boss" | "nuke" | "over"

export type Settings = { shake: boolean; particles: "low" | "high" }

export type Hud = {
  score: number
  wave: number
  lives: number
  maxLives: number
  combo: number
  multiplier: number
  timeLeft: number | null
  powers: Array<{ kind: PowerKind; left: number }>
  shield: boolean
  gun: { level: number; name: string; progress: number }
  boss: { hp: number; max: number } | null
  banner: string | null
  paused: boolean
}

export type RunStats = {
  mode: Mode
  score: number
  wave: number
  kills: Record<EnemyKind, number>
  shots: number
  hits: number
  bestCombo: number
  seconds: number
  powerups: number
  livesLost: number
  bestNuke: number
  /** Waves cleared without getting hit */
  perfectWaves: number
  /** Highest gun level reached */
  bestGun: number
}

type Options = {
  mode: Mode
  settings: Settings
  /** The attract-mode demo on the home page: aims and fires by itself and never dies */
  autopilot?: boolean
  /** Where the turret sits across the canvas, 0 to 1 (the middle by default) */
  anchor?: number
  onHud?: (hud: Hud) => void
  onEnd?: (stats: RunStats) => void
  onSound?: (sound: Sound) => void
}

const PLAYER_R = 20
const BULLET_SPEED = 720
const COMBO_WINDOW = 2.2

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const pick = <T>(weights: Array<[T, number]>) => {
  let roll = Math.random() * weights.reduce((s, [, w]) => s + w, 0)
  for (const [v, w] of weights) if ((roll -= w) < 0) return v
  return weights[0][0]
}

/** Which enemies a wave sends, by weight */
const waveMix = (wave: number): Array<[EnemyKind, number]> => [
  ["drone", 10],
  ["runner", wave >= 2 ? 3 + wave * 0.4 : 0],
  ["weaver", wave >= 3 ? 2 + wave * 0.4 : 0],
  ["splitter", wave >= 4 ? 1.5 + wave * 0.3 : 0],
  ["brute", wave >= 6 ? 1 + wave * 0.25 : 0],
]

/**
 * Gunner: you're a turret in the middle of the screen and everything flies at you.
 * Runs its own requestAnimationFrame loop with frame-rate independent movement,
 * draws on a HiDPI canvas and reports to React through onHud / onEnd.
 */
export class Engine {
  readonly mode: Mode
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private opts: Options
  settings: Settings
  /** The page's font family, for text drawn on the canvas */
  font: string

  w = 0
  h = 0
  enemies: Enemy[] = []
  bullets: Bullet[] = []
  particles: Particle[] = []
  floaters: Floater[] = []
  rings: Ring[] = []
  orbs: Orb[] = []
  aim = { x: 1, y: 0 }
  pointer: { x: number; y: number } | null = null

  score = 0
  wave = 0
  lives: number
  combo = 0
  comboTimer = 0
  timeLeft: number | null
  powers: Partial<Record<PowerKind, number>> = {}
  shield = false
  gunLevel = 1
  gunXp = 0
  /** Seconds since the last shot is under this: drives recoil and the muzzle flash */
  muzzle = 0
  /** How far the minigun's barrels have turned */
  spin = 0
  invuln = 0
  shake = 0
  banner: { text: string; life: number } | null = null
  paused = false
  over = false
  dying = 0

  private firing = false
  private cooldown = 0
  private toSpawn = 0
  private spawnTimer = 0
  private breakTimer = 0
  private hitThisWave = false
  private nextId = 1
  private raf = 0
  private last = 0
  private hudAt = 0
  private hudKey = ""
  private stats: RunStats
  private cleanup: Array<() => void> = []

  constructor(canvas: HTMLCanvasElement, opts: Options) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")!
    this.opts = opts
    this.mode = opts.mode
    this.settings = opts.settings
    this.font = getComputedStyle(canvas).fontFamily || "sans-serif"
    this.lives = opts.autopilot ? Infinity : MODES[opts.mode].lives
    this.timeLeft = opts.mode === "blitz" && !opts.autopilot ? BLITZ_SECONDS : null
    this.stats = {
      mode: opts.mode,
      score: 0,
      wave: 0,
      kills: { drone: 0, runner: 0, weaver: 0, splitter: 0, brute: 0, boss: 0 },
      shots: 0,
      hits: 0,
      bestCombo: 0,
      seconds: 0,
      powerups: 0,
      livesLost: 0,
      bestNuke: 0,
      perfectWaves: 0,
      bestGun: 1,
    }
    this.resize()
    this.listen()
    if (this.mode === "blitz") this.toSpawn = Infinity
    else this.nextWave()
    // The demo starts mid-fight instead of on an empty screen
    if (opts.autopilot) {
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2
        const d = this.edgeDistance(a) * rand(0.45, 0.95)
        this.addEnemy(pick(waveMix(3)), this.center.x + Math.cos(a) * d, this.center.y + Math.sin(a) * d)
      }
    }
  }

  start() {
    // Lets you poke at a running game from the console while developing
    if (process.env.NODE_ENV === "development" && !this.opts.autopilot) (window as unknown as { gunner: Engine }).gunner = this
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.cleanup.forEach((fn) => fn())
  }

  setPaused(paused: boolean) {
    if (this.over || this.opts.autopilot) return
    this.paused = paused
    this.firing = false
    this.pushHud(true)
  }

  get center() {
    return { x: this.w * (this.opts.anchor ?? 0.5), y: this.h / 2 }
  }

  // ---------- Input ----------

  private listen() {
    const on = <K extends keyof WindowEventMap>(target: Window | HTMLElement, type: K, fn: (e: WindowEventMap[K]) => void) => {
      target.addEventListener(type, fn as EventListener)
      this.cleanup.push(() => target.removeEventListener(type, fn as EventListener))
    }
    on(window, "resize", () => this.resize())
    if (this.opts.autopilot) return
    const point = (e: PointerEvent) => {
      const box = this.canvas.getBoundingClientRect()
      this.pointer = { x: e.clientX - box.left, y: e.clientY - box.top }
    }
    on(this.canvas, "pointerdown", (e) => {
      point(e)
      this.firing = true
      this.cooldown = Math.min(this.cooldown, 0)
      this.canvas.setPointerCapture?.(e.pointerId)
    })
    on(this.canvas, "pointermove", point)
    on(window, "pointerup", () => (this.firing = false))
    on(window, "pointercancel", () => (this.firing = false))
    on(window, "blur", () => this.setPaused(true))
    on(window, "keydown", (e) => {
      if (e.key === "Escape" || e.key === "p" || e.key === "P") this.setPaused(!this.paused)
      if (e.key === " ") {
        e.preventDefault()
        this.firing = true
      }
    })
    on(window, "keyup", (e) => e.key === " " && (this.firing = false))
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const box = this.canvas.getBoundingClientRect()
    this.w = box.width || window.innerWidth
    this.h = box.height || window.innerHeight
    this.canvas.width = Math.round(this.w * dpr)
    this.canvas.height = Math.round(this.h * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  // ---------- Loop ----------

  private frame = (t: number) => {
    const dt = Math.min(0.05, (t - this.last) / 1000)
    this.last = t
    if (!this.paused) this.update(dt)
    draw(this.ctx, this)
    this.pushHud()
    if (!(this.over && this.dying <= 0)) this.raf = requestAnimationFrame(this.frame)
  }

  private update(dt: number) {
    const real = dt
    // Dramatic slow motion while the turret explodes
    if (this.over) dt *= 0.25
    const slow = this.powers.slow ? 0.4 : 1
    const c = this.center

    if (!this.over) this.stats.seconds += real
    this.shake = Math.max(0, this.shake - real * 30)
    this.invuln = Math.max(0, this.invuln - real)
    this.muzzle = Math.max(0, this.muzzle - real)
    if (this.firing && !this.over) this.spin += real * 18
    if (this.banner && (this.banner.life -= real) <= 0) this.banner = null
    for (const k of TIMED) if (this.powers[k] !== undefined && (this.powers[k]! -= real) <= 0) delete this.powers[k]
    if (this.combo && (this.comboTimer -= real) <= 0) this.combo = 0

    if (this.timeLeft !== null && !this.over) {
      this.timeLeft = Math.max(0, this.timeLeft - real)
      if (this.timeLeft === 0) return this.end()
    }

    // Aim and fire
    if (this.opts.autopilot) this.autopilot()
    else if (this.pointer) {
      const dx = this.pointer.x - c.x
      const dy = this.pointer.y - c.y
      const d = Math.hypot(dx, dy)
      if (d > 4) this.aim = { x: dx / d, y: dy / d }
    }
    this.cooldown -= real
    if (this.firing && !this.over && this.cooldown <= 0) {
      this.fire()
      this.cooldown = 1 / (this.gun.rate * (this.powers.rapid ? 2.2 : 1)) / (this.opts.autopilot ? 2.4 : 1)
    }

    this.spawn(real)

    // Bullets
    for (const b of this.bullets) {
      b.x += b.vx * dt
      b.y += b.vy * dt
    }
    this.bullets = this.bullets.filter((b) => b.x > -20 && b.x < this.w + 20 && b.y > -20 && b.y < this.h + 20)

    // Enemies
    for (const e of this.enemies) {
      e.age += dt
      e.flash = Math.max(0, e.flash - real)
      e.r += (e.baseR * (e.kind === "brute" ? 0.5 + 0.5 * (e.hp / e.maxHp) : 1) - e.r) * Math.min(1, dt * 8)
      const dx = c.x - e.x
      const dy = c.y - e.y
      const d = Math.hypot(dx, dy) || 1
      const ux = dx / d
      const uy = dy / d
      let vx = ux * e.speed
      let vy = uy * e.speed
      if (e.kind === "weaver") {
        e.phase += dt * 4
        vx += -uy * Math.cos(e.phase) * e.speed * 1.4
        vy += ux * Math.cos(e.phase) * e.speed * 1.4
      }
      if (e.kind === "boss") {
        // Hold an orbit, launch drones, and close in after a while
        const orbit = Math.min(this.w, this.h) * 0.36
        const closing = e.age > 28
        const radial = closing ? 1 : Math.max(-1, Math.min(1, (d - orbit) / 60))
        vx = ux * e.speed * radial - uy * e.speed * 1.1
        vy = uy * e.speed * radial + ux * e.speed * 1.1
        if (!this.over && (e.timer -= dt) <= 0) {
          e.timer = Math.max(1.4, 3 - this.wave * 0.08)
          for (let i = 0; i < 2; i++) this.addEnemy("drone", e.x + rand(-20, 20), e.y + rand(-20, 20))
        }
      }
      e.x += (vx * slow + e.kx) * dt
      e.y += (vy * slow + e.ky) * dt
      const fade = Math.exp(-dt * 4)
      e.kx *= fade
      e.ky *= fade
    }

    this.collide()

    // Power orbs drift and fade
    for (const o of this.orbs) {
      o.x += o.vx * dt
      o.y += o.vy * dt
      o.life -= real
    }
    this.orbs = this.orbs.filter((o) => o.life > 0)

    // Effects
    const friction = Math.exp(-dt * 2.2)
    for (const p of this.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx *= friction
      p.vy *= friction
      p.life -= real
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 36 * real
      f.life -= real
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    for (const r of this.rings) {
      r.life -= real
      r.r += (r.max - r.r) * Math.min(1, real * 6)
    }
    this.rings = this.rings.filter((r) => r.life > 0)

    if (this.over) this.dying -= real
    if (this.over && this.dying <= 0) this.opts.onEnd?.({ ...this.stats, score: this.score, wave: this.wave })
  }

  // ---------- Spawning ----------

  private nextWave() {
    this.wave++
    // The demo loops through the early waves instead of getting ever more crowded
    if (this.opts.autopilot && this.wave > 8) this.wave = 3
    this.stats.wave = this.wave
    const boss = this.wave % 5 === 0
    this.toSpawn = boss ? 4 + this.wave : 6 + this.wave * 3
    this.spawnTimer = 0
    this.breakTimer = this.wave === 1 ? 1.2 : 2.2
    this.hitThisWave = false
    if (this.opts.autopilot) return
    this.banner = { text: boss ? `Wave ${this.wave} · Boss` : `Wave ${this.wave}`, life: 2 }
    if (boss) {
      this.addEnemy("boss")
      this.opts.onSound?.("boss")
    } else if (this.wave > 1) this.opts.onSound?.("wave")
  }

  private spawn(dt: number) {
    if (this.over) return
    if (this.mode === "blitz") {
      const elapsed = this.stats.seconds
      if ((this.spawnTimer -= dt) <= 0) {
        this.spawnTimer = Math.max(0.22, 0.8 - elapsed * 0.006)
        this.addEnemy(pick(waveMix(2 + Math.floor(elapsed / 12))))
      }
      return
    }
    // The demo skips the breaks and keeps the screen busy
    const demo = !!this.opts.autopilot
    if (this.breakTimer > 0 && !demo) {
      this.breakTimer -= dt
      return
    }
    if (this.toSpawn > 0) {
      if ((this.spawnTimer -= dt) <= 0) {
        this.spawnTimer = demo ? (this.enemies.length < 7 ? 0.15 : 0.5) : Math.max(0.3, 1.15 - this.wave * 0.06) * rand(0.6, 1.3)
        this.toSpawn--
        this.addEnemy(pick(waveMix(this.wave)))
      }
    } else if (this.enemies.length === 0) {
      // Wave cleared
      if (!this.opts.autopilot) {
        const bonus = 50 * this.wave * (this.mode === "hardcore" ? 2 : 1)
        this.score += bonus
        this.floaters.push({ x: this.center.x, y: this.center.y - 50, text: `Wave clear +${bonus}`, life: 1.6, color: COLORS.player })
        if (!this.hitThisWave) {
          this.stats.perfectWaves++
          const perfect = 100 * this.wave
          this.score += perfect
          this.floaters.push({ x: this.center.x, y: this.center.y - 76, text: `Perfect +${perfect}`, life: 1.8, color: COLORS.primary })
        }
      }
      this.nextWave()
    }
  }

  addEnemy(kind: EnemyKind, x?: number, y?: number) {
    const def = ENEMIES[kind]
    const c = this.center
    if (x === undefined || y === undefined) {
      const a = Math.random() * Math.PI * 2
      const d = this.edgeDistance(a) + def.radius + 10
      x = c.x + Math.cos(a) * d
      y = c.y + Math.sin(a) * d
    }
    const level = this.mode === "blitz" ? 1 + this.stats.seconds / 30 : this.wave
    const speedUp = (1 + Math.min(level, 25) * 0.035) * (this.mode === "hardcore" ? 1.25 : 1)
    // Phones have less room to react, so enemies there fly slower
    const room = Math.min(1, Math.max(0.6, Math.min(this.w, this.h) / 720))
    const hp = kind === "boss" ? def.hp + this.wave * 6 : def.hp
    const r = kind === "drone" ? def.radius * rand(0.8, 1.2) : def.radius
    this.enemies.push({ id: this.nextId++, kind, x, y, r, baseR: r, hp, maxHp: hp, speed: def.speed * speedUp * room * rand(0.9, 1.1), kx: 0, ky: 0, phase: Math.random() * 6, flash: 0, timer: 2, age: 0 })
  }

  /** How far the screen edge is from the turret in a direction */
  private edgeDistance(a: number) {
    const c = this.center
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    const tx = cos > 0 ? (this.w - c.x) / cos : cos < 0 ? -c.x / cos : Infinity
    const ty = sin > 0 ? (this.h - c.y) / sin : sin < 0 ? -c.y / sin : Infinity
    return Math.min(tx, ty)
  }

  // ---------- Combat ----------

  get gun() {
    return GUNS[this.gunLevel - 1]
  }

  private fire() {
    const gun = this.gun
    // The spread shot power-up adds a bullet on each side of whatever the gun fires
    const angles = this.powers.spread ? [gun.spread[0] - 0.16, ...gun.spread, gun.spread[gun.spread.length - 1] + 0.16] : gun.spread
    const base = Math.atan2(this.aim.y, this.aim.x)
    const c = this.center
    let fired = 0
    this.muzzle = 0.06
    for (const off of angles) {
      const a = base + off
      for (const side of gun.offsets) {
        const sx = -Math.sin(base) * side
        const sy = Math.cos(base) * side
        const out = MUZZLE[this.gunLevel - 1] * GUN_SCALE
        this.bullets.push({ x: c.x + sx + Math.cos(a) * out, y: c.y + sy + Math.sin(a) * out, vx: Math.cos(a) * BULLET_SPEED, vy: Math.sin(a) * BULLET_SPEED, r: gun.size, damage: gun.damage, pierce: !!this.powers.pierce, hit: new Set() })
        fired++
      }
    }
    if (!this.opts.autopilot) {
      this.stats.shots += fired
      this.opts.onSound?.("shoot")
    }
  }

  /** Kills fill the gun bar; a full bar upgrades the gun */
  private gainXp(amount: number) {
    if (this.gunLevel >= GUNS.length) return
    this.gunXp += amount
    if (this.gunXp < this.gun.next) return
    this.gunLevel++
    this.gunXp = 0
    this.stats.bestGun = Math.max(this.stats.bestGun, this.gunLevel)
    const c = this.center
    this.rings.push({ x: c.x, y: c.y, r: PLAYER_R, max: 120, life: 0.6, color: COLORS.primary })
    if (!this.opts.autopilot) {
      this.floaters.push({ x: c.x, y: c.y - 46, text: `Gun up: ${this.gun.name}`, life: 1.6, color: COLORS.primary })
      this.opts.onSound?.("power")
    }
  }

  private collide() {
    const c = this.center
    // Bullets against power orbs: shoot one to collect it
    for (const o of this.orbs) {
      if (this.bullets.some((b) => Math.hypot(b.x - o.x, b.y - o.y) < 16)) {
        o.life = 0
        this.collect(o)
      }
    }

    // Bullets against enemies
    for (const b of this.bullets) {
      for (const e of this.enemies) {
        if (e.hp <= 0 || b.hit.has(e.id)) continue
        if (Math.hypot(b.x - e.x, b.y - e.y) > e.r + b.r) continue
        b.hit.add(e.id)
        if (!this.opts.autopilot) this.stats.hits++
        this.damage(e, b.damage, b)
        if (!b.pierce) {
          b.x = -999
          break
        }
      }
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0)

    // Enemies against the turret
    if (this.over) return
    for (const e of this.enemies) {
      if (Math.hypot(e.x - c.x, e.y - c.y) > e.r + PLAYER_R) continue
      if (e.kind === "boss") {
        this.hurt()
        const d = Math.hypot(e.x - c.x, e.y - c.y) || 1
        e.kx = ((e.x - c.x) / d) * 900
        e.ky = ((e.y - c.y) / d) * 900
        e.age = 0
      } else {
        e.hp = 0
        this.explode(e.x, e.y, ENEMIES[e.kind].color, e.r)
        this.hurt()
      }
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0)
  }

  private damage(e: Enemy, amount: number, b?: Bullet) {
    e.hp -= amount
    e.flash = 0.08
    if (b) {
      const k = e.kind === "boss" ? 20 : e.kind === "brute" ? 60 : 0
      e.kx += (b.vx / BULLET_SPEED) * k
      e.ky += (b.vy / BULLET_SPEED) * k
    }
    if (e.hp > 0) {
      this.sparks(b?.x ?? e.x, b?.y ?? e.y, ENEMIES[e.kind].color, 5)
      if (!this.opts.autopilot) this.opts.onSound?.("hit")
      return
    }
    this.kill(e)
  }

  private kill(e: Enemy) {
    const def = ENEMIES[e.kind]
    this.explode(e.x, e.y, def.color, e.r)
    if (e.kind === "splitter") for (let i = 0; i < 3; i++) this.addSplit(e, i)
    this.gainXp(e.kind === "boss" ? Infinity : e.kind === "brute" ? 3 : 1)
    if (this.opts.autopilot) {
      if (Math.random() < 0.06) this.drop(e.x, e.y)
      return
    }
    this.stats.kills[e.kind]++
    this.combo++
    this.comboTimer = COMBO_WINDOW
    this.stats.bestCombo = Math.max(this.stats.bestCombo, this.combo)
    const points = def.points * this.multiplier * (this.mode === "hardcore" ? 2 : 1)
    this.score += points
    this.floaters.push({ x: e.x, y: e.y - e.r, text: `+${points}`, life: 0.9, color: this.multiplier > 1 ? COLORS.primary : COLORS.player })
    if (e.kind === "boss") {
      this.shake = Math.max(this.shake, 18)
      this.rings.push({ x: e.x, y: e.y, r: e.r, max: 260, life: 0.8, color: def.color })
      for (let i = 0; i < 3; i++) this.drop(e.x + rand(-40, 40), e.y + rand(-40, 40))
    } else if (Math.random() < (this.mode === "blitz" ? 0.1 : 0.07)) this.drop(e.x, e.y)
    this.opts.onSound?.("kill")
  }

  private addSplit(parent: Enemy, i: number) {
    const a = (i / 3) * Math.PI * 2 + Math.random()
    this.addEnemy("runner", parent.x + Math.cos(a) * 14, parent.y + Math.sin(a) * 14)
    const child = this.enemies[this.enemies.length - 1]
    child.r = child.baseR = 7
    child.kx = Math.cos(a) * 220
    child.ky = Math.sin(a) * 220
  }

  get multiplier() {
    return Math.min(5, 1 + Math.floor(this.combo / 8))
  }

  private hurt() {
    if (this.invuln > 0 || this.opts.autopilot) return
    const c = this.center
    this.combo = 0
    this.hitThisWave = true
    if (this.settings.shake) this.shake = 14
    this.rings.push({ x: c.x, y: c.y, r: PLAYER_R, max: 220, life: 0.6, color: this.shield ? COLORS.shield : COLORS.primary })
    // Push everything nearby back
    for (const e of this.enemies) {
      const d = Math.hypot(e.x - c.x, e.y - c.y) || 1
      if (d < 260 && e.kind !== "boss") {
        e.kx += ((e.x - c.x) / d) * (500 - d)
        e.ky += ((e.y - c.y) / d) * (500 - d)
      }
    }
    if (this.shield) {
      this.shield = false
      this.invuln = 0.8
      this.opts.onSound?.("hit")
      return
    }
    this.invuln = 1.6
    this.stats.livesLost++
    if (this.gunLevel > 1) {
      this.gunLevel--
      this.floaters.push({ x: c.x, y: c.y + 46, text: `Gun down: ${this.gun.name}`, life: 1.4, color: COLORS.player })
    }
    this.gunXp = 0
    this.opts.onSound?.("hurt")
    if (this.timeLeft !== null) {
      this.timeLeft = Math.max(0, this.timeLeft - 5)
      this.floaters.push({ x: c.x, y: c.y - 40, text: "-5s", life: 1.2, color: COLORS.primary })
      return
    }
    this.lives--
    if (this.lives <= 0) this.end()
  }

  private end() {
    if (this.over) return
    this.over = true
    this.dying = 0.6
    this.firing = false
    const c = this.center
    this.explode(c.x, c.y, COLORS.player, 40)
    this.rings.push({ x: c.x, y: c.y, r: PLAYER_R, max: Math.max(this.w, this.h), life: 1.2, color: COLORS.player })
    if (this.settings.shake) this.shake = 24
    this.opts.onSound?.("over")
  }

  // ---------- Power-ups ----------

  private drop(x: number, y: number) {
    const kind = pick<PowerKind>([
      ["rapid", 5],
      ["spread", 5],
      ["pierce", 4],
      ["slow", 3],
      ["shield", 3],
      ["nuke", 1.4],
      ["heal", this.mode === "hardcore" ? 0 : 1.2],
    ])
    const a = Math.random() * Math.PI * 2
    this.orbs.push({ kind, x, y, vx: Math.cos(a) * 14, vy: Math.sin(a) * 14, life: 9 })
  }

  private collect(o: Orb) {
    const def = POWERS[o.kind]
    if (!this.opts.autopilot) {
      this.stats.powerups++
      this.opts.onSound?.(o.kind === "nuke" ? "nuke" : "power")
    }
    this.floaters.push({ x: o.x, y: o.y - 18, text: def.name, life: 1.2, color: def.color })
    this.rings.push({ x: o.x, y: o.y, r: 10, max: 46, life: 0.4, color: def.color })
    if (def.duration) this.powers[o.kind] = def.duration
    if (o.kind === "shield") this.shield = true
    if (o.kind === "heal") {
      if (this.timeLeft !== null) this.timeLeft += 5
      else if (Number.isFinite(this.lives)) this.lives = Math.min(MAX_LIVES, this.lives + 1)
    }
    if (o.kind === "nuke") {
      const c = this.center
      this.rings.push({ x: c.x, y: c.y, r: 30, max: Math.hypot(this.w, this.h), life: 0.9, color: def.color })
      if (this.settings.shake) this.shake = 16
      let killed = 0
      for (const e of [...this.enemies]) {
        if (e.kind === "boss") this.damage(e, 10)
        else {
          e.hp = 0
          this.kill(e)
          killed++
        }
      }
      this.enemies = this.enemies.filter((e) => e.hp > 0)
      this.stats.bestNuke = Math.max(this.stats.bestNuke, killed)
    }
  }

  // ---------- Effects ----------

  private explode(x: number, y: number, color: string, r: number) {
    const n = Math.round(r * (this.settings.particles === "high" ? 1.4 : 0.5))
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = rand(40, 260)
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: rand(1, 3.5), life: rand(0.4, 1.1), max: 1.1, color })
    }
    if (r > 15 && this.settings.shake && !this.opts.autopilot) this.shake = Math.max(this.shake, r / 4)
  }

  private sparks(x: number, y: number, color: string, n: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = rand(60, 200)
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: rand(1, 2), life: rand(0.15, 0.35), max: 0.35, color })
    }
  }

  // ---------- Demo mode ----------

  private autopilot() {
    const c = this.center
    // Aim at the closest enemy (or orb), leading moving targets
    let best: { x: number; y: number; d: number } | null = null
    for (const e of this.enemies) {
      const d = Math.hypot(e.x - c.x, e.y - c.y)
      if (e.x < 0 || e.x > this.w || e.y < 0 || e.y > this.h) continue
      if (!best || d < best.d) {
        const t = d / BULLET_SPEED
        best = { x: e.x + ((c.x - e.x) / d) * e.speed * t, y: e.y + ((c.y - e.y) / d) * e.speed * t, d }
      }
    }
    for (const o of this.orbs) {
      const d = Math.hypot(o.x - c.x, o.y - c.y)
      if (!best || d < best.d * 0.8) best = { x: o.x, y: o.y, d }
    }
    this.firing = !!best
    if (!best) return
    const want = Math.atan2(best.y - c.y, best.x - c.x)
    const now = Math.atan2(this.aim.y, this.aim.x)
    let diff = want - now
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    const a = now + diff * 0.2
    this.aim = { x: Math.cos(a), y: Math.sin(a) }
  }

  // ---------- HUD ----------

  private pushHud(force = false) {
    if (!this.opts.onHud) return
    const now = performance.now()
    if (!force && now - this.hudAt < 100) return
    this.hudAt = now
    const boss = this.enemies.find((e) => e.kind === "boss")
    const hud: Hud = {
      score: this.score,
      wave: this.wave,
      lives: this.lives,
      maxLives: Math.max(MODES[this.mode].lives === Infinity ? 0 : MODES[this.mode].lives, Number.isFinite(this.lives) ? this.lives : 0),
      combo: this.combo,
      multiplier: this.multiplier,
      timeLeft: this.timeLeft === null ? null : Math.ceil(this.timeLeft),
      powers: TIMED.filter((k) => this.powers[k] !== undefined).map((k) => ({ kind: k, left: Math.ceil(this.powers[k]!) })),
      shield: this.shield,
      gun: { level: this.gunLevel, name: this.gun.name, progress: Number.isFinite(this.gun.next) ? Math.round((this.gunXp / this.gun.next) * 20) / 20 : 1 },
      boss: boss ? { hp: boss.hp, max: boss.maxHp } : null,
      banner: this.banner?.text ?? null,
      paused: this.paused,
    }
    const key = JSON.stringify(hud)
    if (key === this.hudKey) return
    this.hudKey = key
    this.opts.onHud(hud)
  }
}
