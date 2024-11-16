import "./app.sass"
import { gsap } from "gsap"
import { Velocity } from "./models"
const scoreBox = document.getElementById("score")
const modal = document.getElementById("modal")
const startGameBtn = document.getElementById("modal-cta")
const modalScore = document.getElementById("modal-score")

let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D
let score = 0

class Player {
  x = 0
  y = 0
  radius = 0
  color = ""

  constructor(x: number, y: number, radius: number, color: string) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
  }

  draw() {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false)
    ctx.fillStyle = this.color
    ctx.fill()
  }
}

class Projectile {
  x = 0
  y = 0
  radius = 0
  color = ""
  velocity = { x: 0, y: 0 }

  constructor(
    x: number,
    y: number,
    radius: number,
    color: string,
    velocity: Velocity
  ) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
  }

  draw() {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false)
    ctx.fillStyle = this.color
    ctx.fill()
  }

  update() {
    this.draw()
    this.x += this.velocity.x * 4
    this.y += this.velocity.y * 4
  }
}

class Particle {
  x = 0
  y = 0
  radius = 0
  color = ""
  velocity = { x: 0, y: 0 }
  opacity = 1

  constructor(
    x: number,
    y: number,
    radius: number,
    color: string,
    velocity: Velocity
  ) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
    this.opacity = 1
  }

  draw() {
    ctx.save()
    ctx.globalAlpha = this.opacity
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false)
    ctx.fillStyle = this.color
    ctx.fill()
    ctx.restore()
  }

  update() {
    this.draw()
    const friction = 0.995
    this.velocity.x *= friction
    this.velocity.y *= friction
    this.x += this.velocity.x
    this.y += this.velocity.y
    this.opacity -= 0.002
  }
}

class Enemy {
  x = 0
  y = 0
  radius = 0
  color = ""
  velocity = { x: 0, y: 0 }

  constructor(
    x: number,
    y: number,
    radius: number,
    color: string,
    velocity: Velocity
  ) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
  }

  draw() {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false)
    ctx.fillStyle = this.color
    ctx.fill()
  }

  update() {
    this.draw()
    this.x += this.velocity.x * 4
    this.y += this.velocity.y * 4
  }
}

canvas = document.getElementById("canvas") as HTMLCanvasElement
canvas.width = window.innerWidth
canvas.height = window.innerHeight
ctx = canvas.getContext("2d")!

const player = new Player(
  window.innerWidth / 2,
  window.innerHeight / 2,
  24,
  "#ecf0f1"
)

let projectiles: Array<Projectile> = []
let particles: Array<Particle> = []
let enemies: Array<Enemy> = []

const spawnEnemies = () => {
  setInterval(() => {
    const radius = 8 + Math.random() * 20
    const rand = Math.random()
    const x =
      rand < 0.5
        ? Math.random() * canvas.width
        : rand > 0.75
        ? -radius
        : canvas.width + radius
    const y =
      rand < 0.5
        ? rand < 0.25
          ? -radius
          : canvas.height + radius
        : Math.random() * canvas.height
    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x)

    enemies.push(
      new Enemy(x, y, radius, `hsl(${Math.random() * 360}, 50%, 50%)`, {
        x: Math.cos(angle) * 0.2,
        y: Math.sin(angle) * 0.2,
      })
    )
  }, 1000)
}

let animationId = 0

const animate = () => {
  animationId = requestAnimationFrame(animate)
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  player.draw()
  projectiles.forEach((p, i) => {
    if (
      p.x - p.radius < 0 ||
      p.x + p.radius > canvas.width ||
      p.y - p.radius < 0 ||
      p.y + p.radius > canvas.height
    ) {
      projectiles.splice(i, 1)
    } else {
      p.update()
    }
  })

  enemies.forEach((enemy, eIdx) => {
    const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y)
    if (distance - enemy.radius - player.radius < 1) {
      modalScore!.innerText = `${score}`
      startGameBtn!.innerText = "Try Again"
      modal!.style.display = "flex"
      cancelAnimationFrame(animationId)
    }
    particles.forEach((particle, idx) => {
      particle.opacity <= 0 ? particles.splice(idx, 1) : particle.update()
    })
    projectiles.forEach((projectile, pIdx) => {
      const distance = Math.hypot(
        projectile.x - enemy.x,
        projectile.y - enemy.y
      )
      if (distance - enemy.radius - projectile.radius < 1) {
        // Explosion effect
        for (let i = 0; i < enemy.radius; i++) {
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * 4,
              enemy.color,
              {
                x: Math.random() - 0.5,
                y: Math.random() - 0.5,
              }
            )
          )
        }
        // radius: 8 - 28
        if (enemy.radius > 16) {
          // reduce enmey radius
          score += 20
          gsap.to(enemy, {
            radius: Math.max(14, enemy.radius - 8),
            duration: 1,
          })

          // remove projectile
          setTimeout(() => {
            projectiles.splice(pIdx, 1)
          }, 0)
        } else {
          score += 10
          setTimeout(() => {
            enemies.splice(eIdx, 1)
            projectiles.splice(pIdx, 1)
          }, 0)
        }
        scoreBox!.innerText = `Score: ${score}`
      }
    })
    enemy.update()
  })
}

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  animate()
})

canvas.addEventListener("click", (e) => {
  const angle = Math.atan2(
    e.clientY - canvas.height / 2,
    e.clientX - canvas.width / 2
  )
  const velocity = { x: Math.cos(angle), y: Math.sin(angle) }
  projectiles.push(
    new Projectile(canvas.width / 2, canvas.height / 2, 5, "#ecf0f1", velocity)
  )
})

const handleStartGame = () => {
  score = 0
  enemies = []
  projectiles = []
  particles = []
  animate()
  spawnEnemies()
  modal!.style.display = "none"
}

startGameBtn!.addEventListener("click", handleStartGame)
