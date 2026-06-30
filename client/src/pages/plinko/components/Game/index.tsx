import ballAudio from '@sounds/ball.wav'
import {
  Bodies,
  Body,
  Composite,
  Engine,
  Events,
  Render,
  Runner,
  World
} from 'matter-js'
import type { IEventCollision } from 'matter-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useGameStore } from '../../store/game'
import { random } from '../../utils/random'
import apiClient from '@/lib/axios'
import { toast } from 'sonner'

import type { LinesType, MultiplierValues } from './@types'
import { PlinkoGameBody } from './components/GameBody'
import { MultiplierHistory } from './components/MultiplierHistory'
import { config } from './config'
import {
  getMultiplierByLinesQnt,
  getMultiplierSound
} from './config/multipliers'

// Helper to determine background colors for multiplier boxes
function getMultiplierColor(val: number): string {
  if (val >= 25) return '#ef4444' // Red
  if (val >= 10) return '#f97316' // Orange
  if (val >= 5) return '#f59e0b' // Yellow-orange
  if (val >= 2) return '#eab308' // Yellow
  if (val >= 1.5) return '#84cc16' // Lime
  if (val >= 1.0) return '#22c55e' // Green
  return '#10b981' // Emerald
}

// Map backend reward amounts to a target slot index symmetrically
export function mapRewardToSlot(rewardAmount: number, lines: LinesType): number {
  const left = Math.random() > 0.5
  switch (lines) {
    case 16:
      if (rewardAmount >= 1000) return left ? 0 : 16
      if (rewardAmount >= 750) return left ? 1 : 15
      if (rewardAmount >= 500) return left ? 2 : 14
      if (rewardAmount >= 300) return left ? 3 : 13
      if (rewardAmount >= 200) return left ? 4 : 12
      if (rewardAmount >= 150) return left ? 5 : 11
      return left ? 6 : (Math.random() > 0.5 ? 7 : (Math.random() > 0.5 ? 8 : (Math.random() > 0.5 ? 9 : 10)))
    case 15:
      if (rewardAmount >= 1000) return left ? 0 : 15
      if (rewardAmount >= 750) return left ? 1 : 14
      if (rewardAmount >= 500) return left ? 2 : 13
      if (rewardAmount >= 300) return left ? 3 : 12
      if (rewardAmount >= 200) return left ? 4 : 11
      if (rewardAmount >= 150) return left ? 5 : 10
      return left ? 6 : (Math.random() > 0.5 ? 7 : (Math.random() > 0.5 ? 8 : 9))
    case 14:
      if (rewardAmount >= 1000) return left ? 0 : 14
      if (rewardAmount >= 750) return left ? 1 : 13
      if (rewardAmount >= 500) return left ? 2 : 12
      if (rewardAmount >= 300) return left ? 3 : 11
      if (rewardAmount >= 200) return left ? 4 : 10
      if (rewardAmount >= 150) return left ? 5 : 9
      return left ? 6 : (Math.random() > 0.5 ? 7 : 8)
    case 13:
      if (rewardAmount >= 1000) return left ? 0 : 13
      if (rewardAmount >= 750) return left ? 1 : 12
      if (rewardAmount >= 500) return left ? 2 : 11
      if (rewardAmount >= 300) return left ? 3 : 10
      if (rewardAmount >= 200) return left ? 4 : 9
      if (rewardAmount >= 150) return left ? 5 : 8
      return left ? 6 : 7
    case 12:
      if (rewardAmount >= 1000) return left ? 0 : 12
      if (rewardAmount >= 750) return left ? 1 : 11
      if (rewardAmount >= 500) return left ? 2 : 10
      if (rewardAmount >= 300) return left ? 3 : 9
      if (rewardAmount >= 200) return left ? 4 : 8
      if (rewardAmount >= 150) return left ? 5 : 7
      return 6
    case 11:
      if (rewardAmount >= 1000) return left ? 0 : 11
      if (rewardAmount >= 750) return left ? 1 : 10
      if (rewardAmount >= 500) return left ? 2 : 9
      if (rewardAmount >= 300) return left ? 3 : 8
      if (rewardAmount >= 200) return left ? 4 : 7
      return left ? 5 : 6
    case 10:
      if (rewardAmount >= 1000) return left ? 0 : 10
      if (rewardAmount >= 750) return left ? 1 : 9
      if (rewardAmount >= 500) return left ? 2 : 8
      if (rewardAmount >= 300) return left ? 3 : 7
      if (rewardAmount >= 150) return left ? 4 : 6
      return 5
    case 9:
      if (rewardAmount >= 1000) return left ? 0 : 9
      if (rewardAmount >= 750) return left ? 1 : 8
      if (rewardAmount >= 500) return left ? 2 : 7
      if (rewardAmount >= 300) return left ? 3 : 6
      return left ? 4 : 5
    case 8:
    default:
      if (rewardAmount >= 1000) return left ? 0 : 8
      if (rewardAmount >= 750) return left ? 1 : 7
      if (rewardAmount >= 500) return left ? 2 : 6
      if (rewardAmount >= 300) return left ? 3 : 5
      return 4
  }
}

export function Game() {
  const { user, syncProfile } = useAuth()
  const engineRef = useRef<Engine>(Engine.create())
  const audioContextRef = useRef<AudioContext | null>(null)
  const pulsesRef = useRef<{ row: number; col: number; intensity: number }[]>([])

  const [lines, setLines] = useState<LinesType>(16)
  const inGameBallsCount = useGameStore((state: any) => state.gamesRunning)
  const incrementInGameBallsCount = useGameStore(
    (state: any) => state.incrementGamesRunning
  )
  const decrementInGameBallsCount = useGameStore(
    (state: any) => state.decrementGamesRunning
  )
  const [lastMultipliers, setLastMultipliers] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const {
    pins: pinsConfig,
    colors,
    ball: ballConfig,
    engine: engineConfig,
    world: worldConfig
  } = config

  const worldWidth: number = worldConfig.width
  const worldHeight: number = worldConfig.height

  // Setup pin synth beeps
  const playBeep = useCallback((freq: number, duration: number, type: OscillatorType = "sine") => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      if (ctx.state === "suspended") {
        ctx.resume()
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)

      gain.gain.setValueAtTime(0.04, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch (e) {
      console.warn("Audio Context beep failed:", e)
    }
  }, [])

  useEffect(() => {
    const engine = engineRef.current
    engine.gravity.y = engineConfig.engineGravity
    const element = document.getElementById('plinko')
    
    const render = Render.create({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      element: element!,
      bounds: {
        max: { y: worldHeight, x: worldWidth },
        min: { y: 0, x: 0 }
      },
      options: {
        background: colors.background,
        hasBounds: true,
        width: worldWidth,
        height: worldHeight,
        wireframes: false
      },
      engine
    })

    const runner = Runner.create()
    Runner.run(runner, engine)
    Render.run(render)

    // Generate static pins
    const pins: Body[] = []
    for (let l = 0; l < lines; l++) {
      const linePins = pinsConfig.startPins + l
      const lineWidth = linePins * pinsConfig.pinGap
      for (let i = 0; i < linePins; i++) {
        const pinX = worldWidth / 2 - lineWidth / 2 + i * pinsConfig.pinGap + pinsConfig.pinGap / 2
        const pinY = worldWidth / lines + l * pinsConfig.pinGap + pinsConfig.pinGap

        const pin = Bodies.circle(pinX, pinY, pinsConfig.pinSize, {
          label: `pin-${l}-${i}`,
          render: {
            fillStyle: '#F5DCFF'
          },
          isStatic: true
        })
        pins.push(pin)
      }
    }

    // Walls & Floor
    const leftWall = Bodies.rectangle(
      worldWidth / 3 - pinsConfig.pinSize * pinsConfig.pinGap - pinsConfig.pinGap,
      worldWidth / 2 - pinsConfig.pinSize,
      worldWidth * 2,
      40,
      { angle: 90, render: { visible: false }, isStatic: true }
    )
    const rightWall = Bodies.rectangle(
      worldWidth - pinsConfig.pinSize * pinsConfig.pinGap - pinsConfig.pinGap - pinsConfig.pinGap / 2,
      worldWidth / 2 - pinsConfig.pinSize,
      worldWidth * 2,
      40,
      { angle: -90, render: { visible: false }, isStatic: true }
    )
    const floor = Bodies.rectangle(0, worldWidth + 10, worldWidth * 10, 40, {
      label: 'block-1',
      render: { visible: false },
      isStatic: true
    })

    // Multipliers buckets
    const multipliers = getMultiplierByLinesQnt(lines)
    const multipliersBodies: Body[] = []
    let lastMultiplierX = worldWidth / 2 - (pinsConfig.pinGap / 2) * lines - pinsConfig.pinGap

    multipliers.forEach(multiplier => {
      const valNum = +multiplier.label.split('-')[1]
      const multiplierBody = Bodies.rectangle(
        lastMultiplierX + pinsConfig.pinGap,
        worldWidth / lines + lines * pinsConfig.pinGap + pinsConfig.pinGap + 1,
        pinsConfig.pinGap - 1.5,
        20,
        {
          label: multiplier.label,
          isStatic: true,
          render: {
            fillStyle: getMultiplierColor(valNum)
          }
        }
      )
      lastMultiplierX = multiplierBody.position.x
      multipliersBodies.push(multiplierBody)
    })

    Composite.add(engine.world, [
      ...pins,
      ...multipliersBodies,
      leftWall,
      rightWall,
      floor
    ])

    // Draw multipliers text & collision pulses on canvas
    const afterRenderHandler = () => {
      const ctx = render.context
      if (!ctx) return

      // Update & Draw Pulses
      pulsesRef.current = pulsesRef.current
        .map(p => ({ ...p, intensity: p.intensity - 0.05 }))
        .filter(p => p.intensity > 0)

      pulsesRef.current.forEach(pulse => {
        const { row, col, intensity } = pulse
        const linePins = pinsConfig.startPins + row
        const lineWidth = linePins * pinsConfig.pinGap
        const px = worldWidth / 2 - lineWidth / 2 + col * pinsConfig.pinGap + pinsConfig.pinGap / 2
        const py = worldWidth / lines + row * pinsConfig.pinGap + pinsConfig.pinGap

        ctx.beginPath()
        ctx.arc(px, py, pinsConfig.pinSize + intensity * 7, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.35})`
        ctx.fill()

        ctx.beginPath()
        ctx.arc(px, py, pinsConfig.pinSize + intensity * 1.5, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
      })

      // Draw Multiplier Value Text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '900 8.5px "SVN-Gilroy", Arial Black, sans-serif'

      multipliersBodies.forEach(body => {
        const val = body.label.split('-')[1]
        const x = body.position.x
        const y = body.position.y

        ctx.strokeStyle = '#020617'
        ctx.lineWidth = 2
        ctx.strokeText(`${val}x`, x, y)

        ctx.fillStyle = '#ffffff'
        ctx.fillText(`${val}x`, x, y)
      })
    }

    Events.on(render, 'afterRender', afterRenderHandler)

    return () => {
      Events.off(render, 'afterRender', afterRenderHandler)
      World.clear(engine.world, true)
      Engine.clear(engine)
      render.canvas.remove()
      render.textures = {}
    }
  }, [lines])

  const addBall = useCallback(
    (ballValue: number, targetSlot: number) => {
      incrementInGameBallsCount()
      const ballSound = new Audio(ballAudio)
      ballSound.volume = 0.2
      ballSound.currentTime = 0
      ballSound.play().catch(e => console.warn(e))

      const minBallX = worldWidth / 2 - pinsConfig.pinSize * 3 + pinsConfig.pinGap
      const maxBallX = worldWidth / 2 - pinsConfig.pinSize * 3 - pinsConfig.pinGap + pinsConfig.pinGap / 2
      const ballX = random(minBallX, maxBallX)
      const ballColor = colors.purple

      const ball = Bodies.circle(ballX, 20, ballConfig.ballSize, {
        restitution: 1, // bouncy
        friction: 0.6,
        label: `ball-${ballValue}`,
        id: new Date().getTime(),
        frictionAir: 0.05,
        collisionFilter: {
          group: -1
        },
        render: {
          fillStyle: ballColor
        },
        isStatic: false
      }) as any

      ball.targetSlot = targetSlot
      ball.lastGuidedRow = -1

      Composite.add(engineRef.current.world, ball)
    },
    [lines]
  )

  async function onCollideWithMultiplier(ball: any, multiplier: Body) {
    ball.collisionFilter.group = 2
    World.remove(engineRef.current.world, ball)
    decrementInGameBallsCount()
    
    const multiplierValue = +multiplier.label.split('-')[1] as MultiplierValues

    const multiplierSong = new Audio(getMultiplierSound(multiplierValue))
    multiplierSong.currentTime = 0
    multiplierSong.volume = 0.2
    multiplierSong.play().catch(e => console.warn(e))
    setLastMultipliers(prev => [multiplierValue, prev[0], prev[1], prev[2]])

    // Sync profile directly to get the updated database balance
    setTimeout(() => {
      syncProfile()
    }, 600)
  }

  async function onBodyCollision(event: IEventCollision<Engine>) {
    const pairs = event.pairs
    for (const pair of pairs) {
      const { bodyA, bodyB } = pair
      const ball = bodyB.label.includes('ball') ? bodyB : (bodyA.label.includes('ball') ? bodyA : null)
      const pin = bodyA.label.includes('pin') ? bodyA : (bodyB.label.includes('pin') ? bodyB : null)
      const block = bodyA.label.includes('block') ? bodyA : (bodyB.label.includes('block') ? bodyB : null)

      // Apply dynamic steering on pin collisions to direct the physical ball to the server target slot
      if (ball && pin) {
        const parts = pin.label.split('-')
        const r = parseInt(parts[1], 10)
        const c = parseInt(parts[2], 10)

        const ballBody = ball as any
        if (r > ballBody.lastGuidedRow) {
          ballBody.lastGuidedRow = r

          const remRows = lines - r
          const reqRights = ballBody.targetSlot - c
          const probRight = remRows > 0 ? reqRights / remRows : 0

          let direction = 0
          if (reqRights >= remRows) {
            direction = 1
          } else if (reqRights <= 0) {
            direction = 0
          } else {
            direction = Math.random() < probRight ? 1 : 0
          }

          playBeep(320 + r * 20, 0.05, "sine")
          pulsesRef.current.push({ row: r, col: c, intensity: 1.0 })

          const vx = (direction === 1 ? 1 : -1) * (1.15 + Math.random() * 0.3)
          Body.setVelocity(ballBody, { x: vx, y: ballBody.velocity.y })
        }
      }

      if (ball && block) {
        await onCollideWithMultiplier(ball, block)
      }
    }
  }

  useEffect(() => {
    const engine = engineRef.current
    Events.on(engine, 'collisionStart', onBodyCollision)
    return () => {
      Events.off(engine, 'collisionStart', onBodyCollision)
    }
  }, [lines])

  const handleBet = async () => {
    if (isLoading || inGameBallsCount >= 15) return
    setIsLoading(true)

    try {
      const res = await apiClient.post('/plinko/play')
      if (res.data.success) {
        const { rewardAmount } = res.data
        const targetSlot = mapRewardToSlot(rewardAmount, lines)
        addBall(1, targetSlot)
        
        // Sync immediately to show deducted play count
        syncProfile()
      }
    } catch (e: any) {
      const errMsg = e.response?.data?.message || 'Có lỗi xảy ra khi bắt đầu chơi'
      toast.error(errMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const playsRemaining = user?.plinkoPlays || 0
  const hasNoPlays = playsRemaining <= 0

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl max-w-4xl mx-auto w-full text-slate-200">
      {/* Top Header: Balance and Plays */}
      <div className="flex justify-between items-center w-full px-5 py-3 bg-slate-950/60 rounded-2xl border border-slate-800/40">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm font-semibold">Số dư ví:</span>
          <span className="text-emerald-400 font-extrabold text-lg">{user?.aqeBalance?.toFixed(2) || '0.00'} AQE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm font-semibold">Lượt chơi:</span>
          <span className="text-purple-400 font-extrabold text-lg">{playsRemaining} Lượt</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full">
        {/* Game Board Column */}
        <div className="flex flex-col items-center bg-slate-950 rounded-2xl border border-slate-800 shadow-inner p-4 relative min-h-[400px]">
          <PlinkoGameBody />
          <MultiplierHistory multiplierHistory={lastMultipliers} />
        </div>

        {/* Action Panel Column */}
        <div className="flex flex-col items-stretch gap-4 w-full md:w-64 bg-slate-950/40 p-5 rounded-2xl border border-slate-800/30">
          {/* Lines Option */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lines-select" className="text-xs font-semibold text-slate-400 px-1">
              Số hàng chốt:
            </label>
            <select
              id="lines-select"
              value={lines}
              disabled={inGameBallsCount > 0}
              onChange={(e) => setLines(Number(e.target.value) as LinesType)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 py-3 px-4 rounded-xl font-bold transition-all focus:border-purple-500 focus:outline-none disabled:opacity-50"
            >
              {[8, 9, 10, 11, 12, 13, 14, 15, 16].map((l) => (
                <option key={l} value={l}>
                  {l} Hàng
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-500 text-center font-medium mt-1">
            Bóng trong bảng: {inGameBallsCount}/15
          </span>

          {/* The Big Drop Button */}
          <button
            onClick={handleBet}
            disabled={isLoading || hasNoPlays || inGameBallsCount >= 15}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 active:scale-[0.98] text-white font-extrabold text-lg shadow-lg hover:shadow-purple-500/25 transition-all focus:outline-none disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang xử lý...
              </span>
            ) : hasNoPlays ? (
              'HẾT LƯỢT CHƠI'
            ) : (
              'THẢ BÓNG'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
