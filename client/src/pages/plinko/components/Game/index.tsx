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
import { useTranslation } from 'react-i18next'
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
  if (val === 110) return '#ef4444' // Red (Jackpot)
  if (val === 41) return '#f97316' // Orange
  if (val === 10) return '#f59e0b' // Amber
  if (val === 5) return '#eab308' // Yellow
  if (val === 3) return '#a3e635' // Lime
  if (val === 1.5) return '#84cc16' // Greenish-Yellow
  if (val === 1.0) return '#22c55e' // Green
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

export function mapSlotIndexToPhysicalSlot(slotIndex: number): number {
  const left = Math.random() > 0.5
  switch (slotIndex) {
    case 6: // 1000
      return left ? 0 : 16
    case 5: // 750
      return left ? 1 : 15
    case 4: // 500 (left)
    case 7: // 500 (right)
      return left ? 2 : 14
    case 3: // 300
      return left ? 3 : 13
    case 2: // 200 (left)
    case 8: // 200 (right)
      return left ? 4 : 12
    case 1: // 150
      return left ? 5 : 11
    case 0: // 100
    default:
      return left ? 6 : (Math.random() > 0.5 ? 7 : (Math.random() > 0.5 ? 8 : (Math.random() > 0.5 ? 9 : 10)))
  }
}

export function Game() {
  const { t } = useTranslation()
  const { user, syncProfile } = useAuth()
  const engineRef = useRef<Engine>(Engine.create())
  const audioContextRef = useRef<AudioContext | null>(null)
  const pulsesRef = useRef<{ row: number; col: number; intensity: number }[]>([])

  const lines: LinesType = 16
  const [ballsToDrop, setBallsToDrop] = useState(1)
  const inGameBallsCount = useGameStore((state: any) => state.gamesRunning)

  const [jackpotAmount, setJackpotAmount] = useState(1000)
  const [targetJackpot, setTargetJackpot] = useState(5000)

  const [localPlays, setLocalPlays] = useState<number | null>(null)
  const [localBalance, setLocalBalance] = useState<number | null>(null)

  useEffect(() => {
    if (user && inGameBallsCount === 0) {
      setLocalPlays(user.plinkoPlays)
      setLocalBalance(user.aqeBalance)
    }
  }, [user, inGameBallsCount])

  const playsRemaining = localPlays !== null ? localPlays : (user?.plinkoPlays || 0)
  const balanceDisplay = localBalance !== null ? localBalance : (user?.aqeBalance || 0)

  const fetchJackpotInfo = useCallback(async () => {
    try {
      const res = await apiClient.get('/plinko/info')
      if (res.data && res.data.settings) {
        setJackpotAmount(res.data.settings.currentJackpot || res.data.settings.initialJackpot || 1000)
        setTargetJackpot(res.data.settings.targetJackpot || 5000)
      }
    } catch (e) {
      console.warn("Failed to fetch Plinko Jackpot info:", e)
    }
  }, [])

  useEffect(() => {
    fetchJackpotInfo()
  }, [fetchJackpotInfo])

  const maxDropLimit = Math.max(1, Math.min(15 - inGameBallsCount, playsRemaining))
  useEffect(() => {
    if (ballsToDrop > maxDropLimit) {
      setBallsToDrop(maxDropLimit)
    }
  }, [maxDropLimit, ballsToDrop])

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
        background: '#ffffff',
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
            fillStyle: '#000000'
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
        ctx.fillStyle = `rgba(0, 0, 0, ${intensity * 0.15})`
        ctx.fill()

        ctx.beginPath()
        ctx.arc(px, py, pinsConfig.pinSize + intensity * 1.5, 0, Math.PI * 2)
        ctx.fillStyle = '#000000'
        ctx.fill()
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
        frictionAir: 0.03,
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

    // Extract reward amount from ball label
    const parts = ball.label.split('-')
    const rewardAmount = parseFloat(parts[1]) || 0
    setLocalBalance(prev => (prev !== null ? prev : (user?.aqeBalance || 0)) + rewardAmount)

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

          const vx = (direction === 1 ? 1 : -1) * (0.8 + Math.random() * 0.2)
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
    const maxDrop = Math.min(15 - inGameBallsCount, playsRemaining)
    const countToDrop = Math.min(ballsToDrop, maxDrop)

    if (isLoading || countToDrop <= 0) return
    setIsLoading(true)

    const promises = Array.from({ length: countToDrop }).map(async (_, index) => {
      try {
        const res = await apiClient.post('/plinko/play')
        if (res.data.success) {
          const { rewardAmount, slotIndex, currentJackpot, isJackpotWon, newPlays } = res.data
          if (newPlays !== undefined) {
            setLocalPlays(newPlays)
          }
          if (currentJackpot !== undefined) {
            setJackpotAmount(currentJackpot)
          }
          if (isJackpotWon) {
            toast.success(
              t('plinko.jackpot_win_congrats', {
                reward: rewardAmount,
                defaultValue: `🎉 CONGRATULATIONS! You hit the Jackpot and received ${rewardAmount} AQE!`
              })
            );
          }
          const targetSlot = slotIndex !== undefined ? mapSlotIndexToPhysicalSlot(slotIndex) : mapRewardToSlot(rewardAmount, lines)
          setTimeout(() => {
            addBall(rewardAmount, targetSlot)
          }, index * 200)
        }
      } catch (e: any) {
        const errMsg = e.response?.data?.message || t('plinko.play_error')
        toast.error(errMsg)
      }
    })

    try {
      await Promise.all(promises)
      // Profile sync is deferred until the ball hits the bottom
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const hasNoPlays = playsRemaining <= 0
  const jackpotProgress = targetJackpot > 0 ? (jackpotAmount / targetJackpot) * 100 : 0

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6 bg-white text-gray-800 border border-gray-100 shadow-xl rounded-3xl max-w-4xl mx-auto w-full">
      {/* Plinko Jackpot Widget */}
      <div className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 p-[2px] rounded-[24px] shadow-lg shadow-amber-500/10">
        <div className="bg-slate-900 rounded-[22px] p-5 text-white flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
          {/* Decorative glow background */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">🏆</span>
            <div>
              <h2 className="text-xs uppercase tracking-wider text-amber-400 font-extrabold">{t('plinko.jackpot_pool')}</h2>
              <p className="text-2xl font-black text-white">{jackpotAmount.toFixed(4)} AQE</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end w-full md:w-auto min-w-[220px]">
            <div className="flex justify-between w-full text-xs font-semibold text-gray-300 mb-1">
              <span>{t('plinko.progress_to_target')}</span>
              <span>{jackpotProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden border border-slate-700 relative">
              <div 
                className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, jackpotProgress)}%` }}
              />
            </div>
            {jackpotProgress >= 100 && (
              <span className="mt-1.5 text-[9px] uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse tracking-wide text-center">
                {t('plinko.jackpot_ready')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Top Header: Balance and Plays */}
      <div className="flex justify-between items-center w-full px-5 py-3 bg-gray-50 border border-gray-100/80 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm font-semibold">{t('plinko.wallet_balance')}</span>
          <span className="text-emerald-700 font-extrabold text-lg">{balanceDisplay.toFixed(2)} AQE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm font-semibold">{t('plinko.play_turns')}</span>
          <span className="text-purple-700 font-extrabold text-lg">{playsRemaining} {t('plinko.turn')}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full">
        {/* Game Board Column */}
        <div className="flex flex-col items-center bg-white rounded-2xl border border-gray-100 shadow-sm p-4 relative min-h-[400px]">
          <PlinkoGameBody />
          
          {/* Legend Table */}
          <div className="w-full mt-4 bg-gray-50 border border-gray-100 rounded-xl p-3 max-w-[390px]">
            <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center mb-2.5">
              {t('plinko.jackpot_legend_title')}
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-[10.5px]">
              <div className="flex flex-col items-center gap-1 p-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                <span className="font-extrabold text-gray-800">100% JP</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f97316' }} />
                <span className="font-extrabold text-gray-800">0.01%</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                <span className="font-extrabold text-gray-800">0.008%</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#eab308' }} />
                <span className="font-extrabold text-gray-800">0.006%</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#a3e635' }} />
                <span className="font-extrabold text-gray-800">0.004%</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#84cc16' }} />
                <span className="font-extrabold text-gray-800">0.002%</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-1 bg-white border border-gray-100 rounded-lg shadow-sm col-span-2">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10b981' }} />
                </div>
                <span className="font-extrabold text-gray-800">0.001%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel Column */}
        <div className="flex flex-col items-stretch gap-4 w-full md:w-64 bg-gray-50 p-5 rounded-2xl border border-gray-100/80">
          {/* Balls Slider Option */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="balls-slider" className="text-xs font-semibold text-gray-500">
                {t('plinko.balls_to_drop')}
              </label>
              <span className="text-sm font-extrabold text-[#276152] bg-[#276152]/10 px-2.5 py-0.5 rounded-full">
                {ballsToDrop} {t('plinko.balls')}
              </span>
            </div>
            <input
              id="balls-slider"
              type="range"
              min={1}
              max={Math.max(1, Math.min(15 - inGameBallsCount, playsRemaining))}
              value={ballsToDrop}
              onChange={(e) => setBallsToDrop(Number(e.target.value))}
              disabled={isLoading || hasNoPlays || inGameBallsCount >= 15}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#276152] disabled:opacity-50"
            />
            <div className="flex justify-between text-[10px] text-gray-400 px-1 font-semibold">
              <span>1</span>
              <span>{Math.max(1, Math.min(15 - inGameBallsCount, playsRemaining))}</span>
            </div>
          </div>

          <span className="text-xs text-gray-400 text-center font-medium mt-1">
            {t('plinko.balls_in_board', { count: inGameBallsCount })}
          </span>

          {/* The Big Drop Button */}
          <button
            onClick={handleBet}
            disabled={isLoading || hasNoPlays || inGameBallsCount >= 15}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#276152] to-emerald-600 hover:from-[#1e4d41] hover:to-emerald-700 active:scale-[0.98] text-white font-extrabold text-lg shadow-lg hover:shadow-emerald-600/10 transition-all focus:outline-none disabled:from-gray-100 disabled:to-gray-100 disabled:text-gray-300 disabled:shadow-none disabled:border disabled:border-gray-200"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('plinko.processing')}
              </span>
            ) : hasNoPlays ? (
              t('plinko.no_plays_remaining')
            ) : (
              t('plinko.drop_ball')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
