import { gsap } from "gsap"

type Velocity = { x: number; y: number }
type Callbacks = { onScore: (score: number) => void; onGameOver: (score: number) => void }

class Circle {
  constructor(public x: number, public y: number, public radius: number, public color: string, public velocity: Velocity = { x: 0, y: 0 }) {}

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false)
    ctx.fillStyle = this.color
    ctx.fill()
  }
}

class Mover extends Circle {
  update(ctx: CanvasRenderingContext2D) {
    this.draw(ctx)
    this.x += this.velocity.x * 4
    this.y += this.velocity.y * 4
  }
}

class Particle extends Circle {
  opacity = 1

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.globalAlpha = this.opacity
    super.draw(ctx)
    ctx.restore()
  }

  update(ctx: CanvasRenderingContext2D) {
    this.draw(ctx)
    const friction = 0.995
    this.velocity.x *= friction
    this.velocity.y *= friction
    this.x += this.velocity.x
    this.y += this.velocity.y
    this.opacity -= 0.002
  }
}

/** The original Gunner game on a canvas; returns start() and a cleanup */
export const createGame = (canvas: HTMLCanvasElement, { onScore, onGameOver }: Callbacks) => {
  const ctx = canvas.getContext("2d")!
  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()

  let score = 0
  let projectiles: Mover[] = []
  let particles: Particle[] = []
  let enemies: Mover[] = []
  let animationId = 0
  let spawner: ReturnType<typeof setInterval> | undefined
  const player = () => new Circle(canvas.width / 2, canvas.height / 2, 24, "#ecf0f1")

  const spawnEnemies = () => {
    clearInterval(spawner)
    spawner = setInterval(() => {
      const radius = 8 + Math.random() * 20
      const rand = Math.random()
      const x = rand < 0.5 ? Math.random() * canvas.width : rand > 0.75 ? -radius : canvas.width + radius
      const y = rand < 0.5 ? (rand < 0.25 ? -radius : canvas.height + radius) : Math.random() * canvas.height
      const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x)
      enemies.push(new Mover(x, y, radius, `hsl(${Math.random() * 360}, 50%, 50%)`, { x: Math.cos(angle) * 0.2, y: Math.sin(angle) * 0.2 }))
    }, 1000)
  }

  const animate = () => {
    animationId = requestAnimationFrame(animate)
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const p = player()
    p.draw(ctx)
    projectiles = projectiles.filter((pr) => pr.x - pr.radius >= 0 && pr.x + pr.radius <= canvas.width && pr.y - pr.radius >= 0 && pr.y + pr.radius <= canvas.height)
    projectiles.forEach((pr) => pr.update(ctx))
    particles = particles.filter((pa) => pa.opacity > 0)
    particles.forEach((pa) => pa.update(ctx))

    for (const enemy of [...enemies]) {
      if (Math.hypot(p.x - enemy.x, p.y - enemy.y) - enemy.radius - p.radius < 1) {
        cancelAnimationFrame(animationId)
        clearInterval(spawner)
        onGameOver(score)
        return
      }
      for (const projectile of [...projectiles]) {
        if (Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y) - enemy.radius - projectile.radius >= 1) continue
        // Explosion effect
        for (let i = 0; i < enemy.radius; i++) {
          particles.push(new Particle(projectile.x, projectile.y, Math.random() * 4, enemy.color, { x: Math.random() - 0.5, y: Math.random() - 0.5 }))
        }
        projectiles = projectiles.filter((x) => x !== projectile)
        if (enemy.radius > 16) {
          score += 20
          gsap.to(enemy, { radius: Math.max(14, enemy.radius - 8), duration: 1 })
        } else {
          score += 10
          enemies = enemies.filter((x) => x !== enemy)
        }
        onScore(score)
        break
      }
      enemy.update(ctx)
    }
  }

  const shoot = (e: MouseEvent) => {
    const angle = Math.atan2(e.clientY - canvas.height / 2, e.clientX - canvas.width / 2)
    projectiles.push(new Mover(canvas.width / 2, canvas.height / 2, 5, "#ecf0f1", { x: Math.cos(angle), y: Math.sin(angle) }))
  }

  window.addEventListener("resize", resize)
  canvas.addEventListener("click", shoot)

  return {
    start: () => {
      score = 0
      enemies = []
      projectiles = []
      particles = []
      onScore(0)
      cancelAnimationFrame(animationId)
      animate()
      spawnEnemies()
    },
    destroy: () => {
      cancelAnimationFrame(animationId)
      clearInterval(spawner)
      window.removeEventListener("resize", resize)
      canvas.removeEventListener("click", shoot)
    },
  }
}
