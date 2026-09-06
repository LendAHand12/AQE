import ballAudio from '@sounds/ball.wav'
import {
  Bodies,
  Body,
  Composite,
  Engine,
  Events,
  Render,
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
import { Coins, ArrowRightLeft, Sparkles, RefreshCw, X, CircleDollarSign } from 'lucide-react'

import type { LinesType, MultiplierValues } from './@types'
import confetti from 'canvas-confetti'
import { PlinkoGameBody } from './components/GameBody'
import { config } from './config'
import {
  getMultiplierByLinesQnt,
  getMultiplierSound
} from './config/multipliers'

export function formatDropTime(date: Date, t: any): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const diffTime = today.getTime() - itemDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  } else if (diffDays === 1) {
    return t('plinko.yesterday', '1 day ago')
  } else {
    return t('plinko.days_ago', { count: diffDays, defaultValue: `${diffDays} days ago` })
  }
}



export function Game() {
  const { t } = useTranslation()
  const { user, syncProfile } = useAuth()

  const engineRef = useRef<Engine>(Engine.create())
  const renderRef = useRef<Render | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const pulsesRef = useRef<{ row: number; col: number; intensity: number }[]>([])
  const multipliersBodiesRef = useRef<Body[]>([])
  const isLaunchingRef = useRef(false)

  const lines: LinesType = 16
  const inGameBallsCount = useGameStore((state: any) => state.gamesRunning)

  const [ballCount, setBallCount] = useState<number>(1)
  const [plinkoBaseReward, setPlinkoBaseReward] = useState<number>(1)

  const [localBalls, setLocalBalls] = useState<number | null>(null)
  const [localPendingReward, setLocalPendingReward] = useState<number | null>(null)
  const [localBalance, setLocalBalance] = useState<number | null>(null)
  const [dropHistory, setDropHistory] = useState<{ id: string; reward: number; multiplier: number; timestamp: Date }[]>([])
  const [latestReward, setLatestReward] = useState<{ amount: number; multiplier: number; key: number } | null>(null)

  // Claim modal state
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)

  useEffect(() => {
    if (user && localBalls === null) {
      setLocalBalls(user.plinkoBalls || 0)
      setLocalPendingReward(user.plinkoAqeReward || 0)
      setLocalBalance(user.aqeBalance || 0)
    }
  }, [user, localBalls])

  const ballsDisplay = localBalls !== null ? localBalls : (user?.plinkoBalls || 0)
  const pendingRewardDisplay = localPendingReward !== null ? localPendingReward : (user?.plinkoAqeReward || 0)
  const balanceDisplay = localBalance !== null ? localBalance : (user?.aqeBalance || 0)

  const fetchPlinkoInfo = useCallback(async () => {
    try {
      const res = await apiClient.get('/plinko/info')
      if (res.data) {
        if (res.data.plinkoBalls !== undefined) {
          setLocalBalls(res.data.plinkoBalls)
        }
        if (res.data.plinkoAqeReward !== undefined) {
          setLocalPendingReward(res.data.plinkoAqeReward)
        }
        if (res.data.settings) {
          setPlinkoBaseReward(res.data.settings.plinkoBaseReward !== undefined ? res.data.settings.plinkoBaseReward : 1)
        }
        if (res.data.history) {
          const historyMapped = res.data.history.map((item: any) => ({
            id: item._id,
            reward: item.rewardAmount,
            multiplier: item.multiplier || 1,
            timestamp: new Date(item.playedAt || item.createdAt)
          }))
          setDropHistory(historyMapped)
        }
      }
    } catch (e) {
      console.warn("Failed to fetch Plinko info:", e)
    }
  }, [])

  useEffect(() => {
    fetchPlinkoInfo()
  }, [fetchPlinkoInfo])

  const incrementInGameBallsCount = useGameStore(
    (state: any) => state.incrementGamesRunning
  )
  const decrementInGameBallsCount = useGameStore(
    (state: any) => state.decrementGamesRunning
  )
  const [isLoading, setIsLoading] = useState(false)

  const {
    pins: pinsConfig,
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
      element: element!,
      bounds: {
        max: { y: worldHeight, x: worldWidth },
        min: { y: 0, x: 0 }
      },
      options: {
        background: '#090d16', // Deep space dark navy background
        hasBounds: true,
        width: worldWidth,
        height: worldHeight,
        wireframes: false
      },
      engine
    })
    renderRef.current = render

    let animationFrameId: number
    let lastTime = performance.now()
    const timeStep = 1000 / 60 // 16.666ms
    let accumulator = 0

    const gameLoop = (time: number) => {
      let deltaTime = time - lastTime
      lastTime = time

      if (deltaTime > 100) {
        deltaTime = 100
      }

      accumulator += deltaTime

      while (accumulator >= timeStep) {
        Engine.update(engine, timeStep)
        accumulator -= timeStep
      }

      animationFrameId = requestAnimationFrame(gameLoop)
    }

    Render.run(render)
    animationFrameId = requestAnimationFrame(gameLoop)

    // Generate static pins (Glowing Indigo Pins)
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
            fillStyle: '#a5b4fc' // Glowing Indigo
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
      label: 'floor',
      render: { visible: false },
      isStatic: true
    })

    // Multipliers buckets (Cosmic glass boxes)
    const multipliers = getMultiplierByLinesQnt(lines)
    const multipliersBodies: Body[] = []
    let lastMultiplierX = worldWidth / 2 - (pinsConfig.pinGap / 2) * lines - pinsConfig.pinGap

    multipliers.forEach((multiplier, index) => {
      const valNum = +multiplier.label.split('-')[1]
      const multiplierBody = Bodies.rectangle(
        lastMultiplierX + pinsConfig.pinGap,
        worldWidth / lines + lines * pinsConfig.pinGap + pinsConfig.pinGap + 1,
        pinsConfig.pinGap - 1.5,
        26,
        {
          label: `block-${index}-${valNum}`,
          isStatic: true,
          isSensor: true,
          render: {
            fillStyle: 'rgba(15, 23, 42, 0.8)',
            strokeStyle: 'rgba(99, 102, 241, 0.4)',
            lineWidth: 1
          }
        }
      )
      lastMultiplierX = multiplierBody.position.x
      multipliersBodies.push(multiplierBody)
    })
    multipliersBodiesRef.current = multipliersBodies

    Composite.add(engine.world, [
      ...pins,
      ...multipliersBodies,
      leftWall,
      rightWall,
      floor
    ])

    // Draw cosmic collision pulses & glowing neon multiplier text under board
    const afterRenderHandler = () => {
      const ctx = render.context
      if (!ctx) return

      pulsesRef.current = pulsesRef.current
        .map(p => ({ ...p, intensity: p.intensity - 0.05 }))
        .filter(p => p.intensity > 0)

      pulsesRef.current.forEach(pulse => {
        const { row, col, intensity } = pulse
        const linePins = pinsConfig.startPins + row
        const lineWidth = linePins * pinsConfig.pinGap
        const px = worldWidth / 2 - lineWidth / 2 + col * pinsConfig.pinGap + pinsConfig.pinGap / 2
        const py = worldWidth / lines + row * pinsConfig.pinGap + pinsConfig.pinGap

        // Cosmic indigo aura
        ctx.beginPath()
        ctx.arc(px, py, pinsConfig.pinSize + intensity * 8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99, 102, 241, ${intensity * 0.45})`
        ctx.fill()

        // Bright star core
        ctx.beginPath()
        ctx.arc(px, py, pinsConfig.pinSize + intensity * 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(224, 231, 255, ${intensity * 0.95})`
        ctx.fill()
      })

      // Draw glowing neon text numbers (e.g. 110x, 41x, 10x, 5x, 3x, 2x, 1x, 0.5x, 0.2x)
      multipliersBodies.forEach(mb => {
        const parts = mb.label.split('-')
        const valNum = parseFloat(parts[2]) || parseFloat(parts[1]) || 1
        const labelText = `${valNum}x`
        ctx.save()
        ctx.font = 'bold 9px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = '#818cf8'
        ctx.shadowBlur = 5
        ctx.fillStyle = '#38bdf8' // Glowing Cyan
        ctx.fillText(labelText, mb.position.x, mb.position.y)
        ctx.restore()
      })

      // Anti-stuck watchdog: Auto-resolve balls stuck for more than 15 seconds or completely stopped at bottom
      const now = Date.now()
      const allBodies = Composite.allBodies(engine.world)
      const bottomBucketY = worldWidth / lines + lines * pinsConfig.pinGap

      allBodies.forEach(b => {
        const ballBody = b as any
        if (ballBody.label && ballBody.label.includes('ball') && !ballBody.isHandled) {
          const spawnTime = ballBody.spawnTime || now
          const elapsed = now - spawnTime
          
          // Only trigger if ball is physically AT the bottom bucket Y AND stopped, OR if stuck for > 15s
          const isAtBottomAndStopped = ballBody.position.y >= (bottomBucketY - 10) && 
            Math.abs(ballBody.velocity.y) < 0.05 && 
            Math.abs(ballBody.velocity.x) < 0.05

          if (elapsed > 15000 || isAtBottomAndStopped) {
            let closestBucket = multipliersBodiesRef.current[8]
            let minDistance = Infinity
            multipliersBodiesRef.current.forEach(mb => {
              const dist = Math.abs(ballBody.position.x - mb.position.x)
              if (dist < minDistance) {
                minDistance = dist
                closestBucket = mb
              }
            })
            if (closestBucket) {
              onCollideWithMultiplier(ballBody, closestBucket)
            }
          }
        }
      })
    }

    Events.on(render, 'afterRender', afterRenderHandler)

    return () => {
      Events.off(render, 'afterRender', afterRenderHandler)
      cancelAnimationFrame(animationFrameId)
      World.clear(engine.world, true)
      Engine.clear(engine)
      render.canvas.remove()
      render.textures = {}
    }
  }, [lines])

  const addBall = useCallback(
    () => {
      incrementInGameBallsCount()
      const ballSound = new Audio(ballAudio)
      ballSound.volume = 0.2
      ballSound.currentTime = 0
      ballSound.play().catch(e => console.warn(e))

      const minBallX = worldWidth / 2 - pinsConfig.pinSize * 3 + pinsConfig.pinGap
      const maxBallX = worldWidth / 2 - pinsConfig.pinSize * 3 - pinsConfig.pinGap + pinsConfig.pinGap / 2
      const ballX = random(minBallX, maxBallX)
      const ballColor = '#ec4899' // Bright Pink Cosmic Energy Orb

      const restitutionEnv = import.meta.env.VITE_PLINKO_RESTITUTION
      const frictionEnv = import.meta.env.VITE_PLINKO_FRICTION
      const frictionAirEnv = import.meta.env.VITE_PLINKO_FRICTION_AIR

      const ballRestitution = restitutionEnv !== undefined && restitutionEnv !== '' ? parseFloat(restitutionEnv) : 1.0
      const ballFriction = frictionEnv !== undefined && frictionEnv !== '' ? parseFloat(frictionEnv) : 0.6
      const ballFrictionAir = frictionAirEnv !== undefined && frictionAirEnv !== '' ? parseFloat(frictionAirEnv) : 0.03

      const ball = Bodies.circle(ballX, 20, ballConfig.ballSize, {
        restitution: ballRestitution,
        friction: ballFriction,
        label: `ball-${new Date().getTime()}-${Math.random()}`,
        id: new Date().getTime() + Math.random(),
        frictionAir: ballFrictionAir,
        collisionFilter: {
          group: -1
        },
        render: {
          fillStyle: ballColor
        },
        isStatic: false
      }) as any

      ball.isHandled = false
      ball.spawnTime = Date.now()
      ball.lastHitRow = -1

      Composite.add(engineRef.current.world, ball)
    },
    [lines]
  )

  async function onCollideWithMultiplier(ball: any, multiplier: Body) {
    if (ball.isHandled) return
    ball.isHandled = true

    ball.collisionFilter.group = 2
    World.remove(engineRef.current.world, ball)
    decrementInGameBallsCount()

    // Trigger canvas-confetti fireworks right at the bucket collision coordinates
    if (renderRef.current && renderRef.current.canvas) {
      try {
        const canvasEl = renderRef.current.canvas
        const rect = canvasEl.getBoundingClientRect()
        const hitX = rect.left + (multiplier.position.x / worldWidth) * rect.width
        const hitY = rect.top + (multiplier.position.y / worldHeight) * rect.height

        const originX = Math.min(1, Math.max(0, hitX / window.innerWidth))
        const originY = Math.min(1, Math.max(0, hitY / window.innerHeight))

        confetti({
          particleCount: 30,
          spread: 65,
          startVelocity: 20,
          origin: { x: originX, y: originY },
          colors: ['#38bdf8', '#c084fc', '#f472b6', '#fbbf24', '#34d399', '#f43f5e'],
          ticks: 80,
          gravity: 1.2,
          scalar: 0.7,
          zIndex: 9999
        })
      } catch (e) {
        console.warn("Confetti error:", e)
      }
    }

    const blockParts = multiplier.label.split('-')
    const parsedSlot = parseInt(blockParts[1], 10)
    const slotIndex = !isNaN(parsedSlot) && parsedSlot >= 0 ? parsedSlot : 8

    try {
      const res = await apiClient.post('/plinko/play', {
        slotIndex
      })

      if (res.data && res.data.success) {
        const { rewardAmount, multiplier: multiplierVal, newBalls, newPendingReward } = res.data

        const multiplierSong = new Audio(getMultiplierSound(multiplierVal as MultiplierValues))
        multiplierSong.currentTime = 0
        multiplierSong.volume = 0.2
        multiplierSong.play().catch(e => console.warn(e))

        if (newBalls !== undefined) {
          setLocalBalls(newBalls)
        }
        if (newPendingReward !== undefined) {
          setLocalPendingReward(newPendingReward)
        } else {
          setLocalPendingReward(prev => (prev !== null ? prev : (user?.plinkoAqeReward || 0)) + rewardAmount)
        }

        setDropHistory(prev => [
          {
            id: Math.random().toString(),
            reward: rewardAmount,
            multiplier: multiplierVal,
            timestamp: new Date()
          },
          ...prev
        ].slice(0, 30))

        setLatestReward({
          amount: rewardAmount,
          multiplier: multiplierVal,
          key: Math.random()
        })
      }
    } catch (e: any) {
      console.warn("Error finalizing Plinko drop:", e)
      syncProfile()
    }
  }

  async function onBodyCollision(event: IEventCollision<Engine>) {
    const pairs = event.pairs
    for (const pair of pairs) {
      const { bodyA, bodyB } = pair
      const ball = bodyB.label.includes('ball') ? bodyB : (bodyA.label.includes('ball') ? bodyA : null)
      const pin = bodyA.label.includes('pin') ? bodyA : (bodyB.label.includes('pin') ? bodyB : null)
      const block = bodyA.label.includes('block') ? bodyA : (bodyB.label.includes('block') ? bodyB : null)

      if (ball && pin) {
        const parts = pin.label.split('-')
        const r = parseInt(parts[1], 10)
        const c = parseInt(parts[2], 10)

        const ballBody = ball as any
        if (r > (ballBody.lastHitRow || -1)) {
          ballBody.lastHitRow = r
          playBeep(320 + r * 20, 0.05, "sine")
          pulsesRef.current.push({ row: r, col: c, intensity: 1.0 })
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

  const handleDrop = async () => {
    if (isLaunchingRef.current || isLoading || inGameBallsCount + ballCount > 15) return
    if (ballCount <= 0 || ballsDisplay < ballCount) {
      toast.error(t('plinko.insufficient_balls', 'Số lượt thả bóng của bạn không đủ'))
      return
    }

    isLaunchingRef.current = true
    setIsLoading(true)

    // Deduct balls immediately on client UI
    setLocalBalls(prev => Math.max(0, (prev !== null ? prev : (user?.plinkoBalls || 0)) - ballCount))

    try {
      for (let i = 0; i < ballCount; i++) {
        setTimeout(() => {
          addBall()
        }, i * 150)
      }
    } catch (e: any) {
      console.warn("Error launching balls:", e)
      toast.error(t('plinko.play_error', 'Lỗi khi thả banh'))
      setLocalBalls(user?.plinkoBalls || 0)
    }

    const lockDuration = Math.max(500, (ballCount - 1) * 150 + 500)
    setTimeout(() => {
      isLaunchingRef.current = false
      setIsLoading(false)
    }, lockDuration)
  }

  const handleClaimReward = async () => {
    if (pendingRewardDisplay <= 0) return

    setIsClaiming(true)
    try {
      const res = await apiClient.post('/plinko/claim')
      if (res.data.success) {
        toast.success(
          t('plinko.claim_success', {
            aqe: res.data.claimedAmount,
            defaultValue: `Claim thành công ${res.data.claimedAmount} AQE!`
          })
        )
        setLocalPendingReward(res.data.newPendingReward)
        setLocalBalance(res.data.newAqeBalance)
        setIsClaimModalOpen(false)
        syncProfile()
      }
    } catch (e: any) {
      const errMsg = e.response?.data?.message || t('plinko.claim_error', 'Claim thất bại')
      toast.error(errMsg)
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6 bg-slate-950/90 text-slate-100 border border-indigo-500/20 shadow-[0_0_60px_rgba(79,70,229,0.15)] rounded-3xl max-w-4xl mx-auto w-full relative overflow-hidden backdrop-blur-xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950">
      {/* Background stardust glow accents */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar: Plinko Balls, Pending AQE Reward & AQE Balance */}
      <div className="flex flex-col sm:flex-row justify-between items-center w-full px-6 py-4 bg-slate-900/80 border border-indigo-500/30 text-white rounded-2xl gap-4 shadow-[0_0_25px_rgba(99,102,241,0.12)] backdrop-blur-md z-10">

        {/* Plinko Balls Available */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="text-emerald-300/80 text-xs font-semibold uppercase tracking-wider block">{t('plinko.plinko_balls', 'Plinko Balls')}</span>
            <span className="text-emerald-400 font-black text-2xl tracking-tight drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{ballsDisplay} {t('plinko.balls', 'bóng')}</span>
          </div>
        </div>

        {/* Pending AQE Reward */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <CircleDollarSign size={20} />
          </div>
          <div>
            <span className="text-cyan-300/80 text-xs font-semibold uppercase tracking-wider block">{t('plinko.pending_reward', 'AQE chờ Claim')}</span>
            <span className="text-cyan-400 font-black text-2xl tracking-tight drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">{pendingRewardDisplay.toFixed(4)} AQE</span>
          </div>
        </div>

        {/* Action Button: Claim Pending AQE Reward */}
        <button
          onClick={() => setIsClaimModalOpen(true)}
          disabled={pendingRewardDisplay <= 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          <ArrowRightLeft size={16} />
          <span>{t('plinko.claim_aqe', 'Claim AQE')}</span>
        </button>

        {/* AQE Wallet Balance */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
            <Coins size={20} />
          </div>
          <div className="text-right">
            <span className="text-amber-300/80 text-xs font-semibold uppercase tracking-wider block">{t('plinko.aqe_balance', 'AQE Balance')}</span>
            <span className="text-amber-400 font-black text-xl tracking-tight drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">{balanceDisplay.toFixed(2)} AQE</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start justify-center gap-6 w-full z-10">
        {/* Game Board Column */}
        <div className="flex flex-col items-center bg-slate-900/80 border border-indigo-500/30 shadow-[0_0_30px_rgba(15,23,42,0.8)] p-4 rounded-2xl relative min-h-[400px] w-full md:w-auto flex-1 backdrop-blur-md overflow-hidden">
          <PlinkoGameBody />
          
          {/* Floating Reward in top-right */}
          {latestReward && (
            <div
              key={`board-${latestReward.key}`}
              className="absolute top-6 right-6 text-cyan-400 font-black text-2xl pointer-events-none select-none z-10 animate-fade-out-3s flex flex-col items-end drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]"
            >
              <span>+{latestReward.amount.toFixed(4)} AQE</span>
              <span className="text-xs bg-indigo-950/80 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">x{latestReward.multiplier}</span>
            </div>
          )}
        </div>

        {/* Betting Panel Column */}
        <div className="flex flex-col items-stretch gap-5 w-full md:w-80 bg-slate-900/60 p-5 rounded-2xl border border-indigo-500/20 backdrop-blur-md shadow-lg">

          {/* Info banner */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
              {t('plinko.rate_info', '10 USDT = 1 Bóng')}
            </span>
            <span className="text-xs font-semibold text-indigo-300 bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              {t('plinko.base_reward_info', { rate: plinkoBaseReward, defaultValue: `AQE = ${plinkoBaseReward} × Multiplier` })}
            </span>
          </div>

          {/* Balls to Drop Selection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {t('plinko.balls_to_drop', 'Số bóng thả:')}
              </label>
              <span className="text-xs font-bold text-indigo-300">
                {t('plinko.balls_available', { count: ballsDisplay, defaultValue: `Khả dụng: ${ballsDisplay} bóng` })}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 5, 10].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setBallCount(count)}
                  className={`py-1.5 rounded-lg text-xs font-extrabold transition-all border ${
                    ballCount === count
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {count} {t('plinko.balls', 'bóng')}
                </button>
              ))}
            </div>
          </div>

          {/* Drop Ball Button */}
          <button
            onClick={handleDrop}
            disabled={isLoading || isLaunchingRef.current || ballsDisplay < ballCount || inGameBallsCount + ballCount > 15}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 active:scale-[0.98] text-white font-black text-lg shadow-[0_0_25px_rgba(129,140,248,0.35)] transition-all focus:outline-none disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none disabled:border disabled:border-slate-700 pointer-events-auto disabled:pointer-events-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="animate-spin h-5 w-5" />
                {t('plinko.processing', 'Đang thả banh...')}
              </span>
            ) : ballsDisplay < ballCount ? (
              t('plinko.no_balls', 'Không đủ bóng Plinko')
            ) : (
              t('plinko.drop_balls_btn', {
                count: ballCount,
                defaultValue: `Thả ${ballCount} Bóng`
              })
            )}
          </button>

          {/* Drop History */}
          <div className="mt-1 flex flex-col gap-2 border-t border-slate-800/80 pt-4">
            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
              {t('plinko.drop_history', 'Lịch sử thả banh')}
            </div>
            <div className="flex flex-col gap-1.5 max-h-[190px] overflow-y-auto pr-1 custom-scrollbar-dark">
              {dropHistory.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-5 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                  {t('plinko.no_history', 'Chưa có lịch sử')}
                </div>
              ) : (
                dropHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl shadow-xs hover:border-indigo-500/30 transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {formatDropTime(item.timestamp, t)}
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {t('plinko.bet_history_ball', 'Thả 1 bóng')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] bg-slate-800 font-black text-cyan-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        x{item.multiplier}
                      </span>
                      <span className="text-xs font-black text-emerald-400">
                        +{item.reward.toFixed(4)} AQE
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Claim Reward Modal */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(79,70,229,0.25)] text-white space-y-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsClaimModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <CircleDollarSign className="w-6 h-6 text-emerald-400" />
                {t('plinko.claim_modal_title', 'Claim thưởng AQE')}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {t('plinko.claim_modal_desc', 'Chuyển toàn bộ AQE thưởng từ Plinko vào số dư AQE chính thức của bạn.')}
              </p>
            </div>

            <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-cyan-300 font-bold">
                <span>{t('plinko.available_reward', 'AQE chờ Claim:')}</span>
                <span className="font-black text-lg text-cyan-400">{pendingRewardDisplay.toFixed(4)} AQE</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-400 font-medium">
                <span>{t('plinko.current_aqe_balance', 'Số dư AQE hiện tại:')}</span>
                <span className="font-bold">{balanceDisplay.toFixed(2)} AQE</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(false)}
                className="flex-1 py-3.5 rounded-xl border border-slate-800 text-slate-300 font-bold hover:bg-slate-800 transition-colors text-sm"
              >
                {t('plinko.cancel', 'Hủy bỏ')}
              </button>
              <button
                type="button"
                onClick={handleClaimReward}
                disabled={isClaiming || pendingRewardDisplay <= 0}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
              >
                {isClaiming ? <RefreshCw className="animate-spin w-4 h-4" /> : null}
                {t('plinko.claim_now', 'Claim ngay')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
