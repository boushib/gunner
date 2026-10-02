# Gunner

An arcade shooter for the browser. You're a turret in the middle of the screen and everything flies at you: aim, hold to fire, grab power-ups and survive as long as you can.

Built with Next.js, TypeScript and a hand-written canvas engine. No backend: scores, stats and achievements are saved in your browser.

![A game in progress: wave 5 with the Mothership](docs/screenshots/game.png)

| Home | How to play | Stats |
| --- | --- | --- |
| ![Home page with the game playing itself](docs/screenshots/home.png) | ![Enemies and power-ups](docs/screenshots/how-to-play.png) | ![Lifetime stats](docs/screenshots/stats.png) |

## Features

### The game
- **Three modes:** Classic (endless waves, three lives, a boss every fifth wave), Blitz (90 seconds of nonstop enemies) and Hardcore (one life, faster enemies, double points)
- **Six enemies:** drones, fast runners, zigzagging weavers, splitters that burst into runners, tough brutes that shrink as you hit them, and the Mothership boss, which circles you and launches drones
- **Seven power-ups**, dropped by enemies and collected by shooting them: rapid fire, spread shot, piercing rounds, slow time, shield, nuke and extra life
- **Scoring** with combos (up to ×5), wave-clear bonuses and perfect-wave bonuses
- Hit effects: particles, screen shake, shockwaves that push enemies back, and floating points
- **Sound effects** synthesized with the Web Audio API, so there are no audio files
- Mouse, touch and keyboard: hold to fire, P or Esc to pause, and the game pauses when you switch tabs
- Frame-rate independent movement, sharp on high-DPI screens, and slower enemies on small screens so phones stay fair

### The site
- **Home** with the game playing itself in the background, your best scores and the three modes
- **How to play:** controls, every enemy and power-up, and the scoring rules
- **Leaderboard:** your top ten games in each mode
- **Stats:** games, time played, accuracy, best combo, highest wave and kills by enemy type
- **Achievements:** 16 goals across all modes, announced on the results screen when you unlock them
- **Settings:** player name, sound and volume, screen shake and particle amount, and clearing your data

## Getting started

Requires Node.js 20.9+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Route types and TypeScript, no emit |
| `pnpm dev:agent` / `pnpm build:agent` | The same on port 3500 with their own build folders, so a second server doesn't clash with yours |

In development the running game is available in the browser console as `window.gunner`.

## Project structure

```
app/(site)/        Home, how to play, leaderboard, stats, achievements and settings
app/play/          The full-screen game (?mode=classic | blitz | hardcore)
components/game/   The game screen: menu, HUD, pause and results
lib/game/          The engine (loop, spawning, combat), drawing and the enemy and power-up definitions
lib/save.ts        Settings, scores, lifetime stats and achievements, saved in localStorage
lib/sound.ts       Synthesized sound effects
```
