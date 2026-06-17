import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Gamepad2, Coins, Clock, Sparkles, Volume2, VolumeX, History as HistoryIcon, HelpCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import { useAuth } from "@/providers/AuthProvider"
import dayjs from "dayjs"
import plinkoBg from "@/assets/plinko_bg.png"

// Define translation local map
const LOCALES = {
  vi: {
    title: "Trò Chơi Plinko",
    desc: "Nhận ngay 10 lượt chơi cho mỗi 100 USDT nạp thành công! Thả bóng để nhận ngay từ 100 đến 1,000 AQE.",
    playsRemaining: "Lượt chơi khả dụng",
    playNow: "Thả Bóng Ngay",
    noPlays: "Hết lượt chơi! Hãy nạp tiền để thêm lượt",
    history: "Lịch Sử Trúng Thưởng",
    recentWins: "Lịch sử quay thưởng gần đây",
    noHistory: "Chưa có lượt chơi nào. Hãy thử vận may của bạn!",
    rules: "Luật Chơi & Tỷ Lệ",
    rulesDesc: "Mỗi khi bạn nạp 100 USDT, hệ thống sẽ tự động tặng 10 lượt chơi Plinko. AQE trúng thưởng sẽ được cộng trực tiếp vào số dư khả dụng.",
    jackpotNote: "Giải thưởng được chọn ngẫu nhiên theo tỷ lệ xác thực công bằng. Cơ hội nhận giải Jackpot 1,000 AQE cực cao!",
    sound: "Âm thanh",
    wins: "Nhận được",
    aqeBalance: "Số dư AQE",
    loading: "Đang tải dữ liệu...",
    winMessage: "Chúc mừng! Bạn đã trúng {{amount}} AQE!",
    jackpotMessage: "XUẤT SẮC! Bạn đã trúng giải Jackpot {{amount}} AQE!",
    playing: "Đang thả..."
  },
  en: {
    title: "Plinko Game",
    desc: "Get 10 plays for every 100 USDT deposited! Drop a ball to win between 100 and 1,000 AQE.",
    playsRemaining: "Available Plays",
    playNow: "Drop Ball",
    noPlays: "No plays left! Deposit to get more",
    history: "Win History",
    recentWins: "Recent Plinko wins",
    noHistory: "No history found. Try your luck!",
    rules: "Rules & Probabilities",
    rulesDesc: "Every 100 USDT deposit automatically grants 10 Plinko plays. Won AQE is credited immediately to your available balance.",
    jackpotNote: "Rewards are selected randomly according to fair weights. Anyone can hit the 1,000 AQE Jackpot!",
    sound: "Sound",
    wins: "Won",
    aqeBalance: "AQE Balance",
    loading: "Loading data...",
    winMessage: "Congratulations! You won {{amount}} AQE!",
    jackpotMessage: "AMAZING! You hit the {{amount}} AQE Jackpot!",
    playing: "Dropping..."
  }
}

interface PlinkoHistoryItem {
  _id: string
  rewardAmount: number
  playedAt: string
}

interface ActiveBall {
  id: number
  x: number
  y: number
  path: { x: number; y: number }[]
  currentStep: number
  progress: number
  speed: number
  targetSlot: number
  rewardAmount: number
  color: string
}

interface PegPulse {
  row: number
  col: number
  intensity: number
}

// 9 Slots prizes
const SLOT_PRIZES = [100, 150, 200, 300, 500, 750, 1000, 500, 200]

export default function PlinkoPage() {
  const { i18n } = useTranslation()
  const { user, syncProfile } = useAuth()
  const currentLang = i18n.language === "vi" ? "vi" : "en"
  const tLocal = LOCALES[currentLang]

  const [plays, setPlays] = useState<number>(0)
  const [history, setHistory] = useState<PlinkoHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ballsRef = useRef<ActiveBall[]>([])
  const pulsesRef = useRef<PegPulse[]>([])
  const animationFrameId = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const bgImageRef = useRef<HTMLImageElement | null>(null)

  // Fetch Plinko play states
  const fetchPlinkoData = async () => {
    try {
      const res = await apiClient.get("/plinko/info")
      setPlays(res.data.plinkoPlays)
      setHistory(res.data.history || [])
    } catch (err) {
      console.error("Failed to fetch Plinko data:", err)
      toast.error(currentLang === "vi" ? "Không thể tải dữ liệu Plinko" : "Could not load Plinko data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlinkoData()
    
    // Load background image
    const img = new Image()
    img.src = plinkoBg
    img.onload = () => {
      bgImageRef.current = img
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [])

  // Web Audio Synth Beep Helper
  const playBeep = (freq: number, duration: number, type: OscillatorType = "sine") => {
    if (!soundEnabled) return
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
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch (e) {
      console.warn("Audio Context beep failed:", e)
    }
  }

  // Define board layout variables
  const W = 600
  const H = 600
  const dx = 42
  const dy = 44
  const startY = 80
  const pegRadius = 6
  const ballRadius = 11
  const rows = 8

  // Generate target peg hit path for a target slot index
  const generatePath = (slotIndex: number) => {
    // Row 0 has 3 pegs (indices 0, 1, 2). Starting peg is index 1.
    let currentPeg = 1
    const pathPegs: number[] = [currentPeg]
    
    // Target peg index at bottom row (row 7) should land ball in slotIndex
    // Slot s is between peg s and peg s+1.
    // For s = 0, last peg must be 1. For s = 8, last peg must be 8.
    // Otherwise, last peg can be s or s+1.
    let targetPeg = slotIndex
    if (slotIndex === 0) {
      targetPeg = 1
    } else if (slotIndex === 8) {
      targetPeg = 8
    } else {
      targetPeg = Math.random() > 0.5 ? slotIndex : slotIndex + 1
    }

    // Number of transitions is 7 (from row 0 to 7)
    const requiredSum = targetPeg - 1 // since currentPeg starts at 1
    // increments can be 0 or 1
    const increments: number[] = []
    for (let i = 0; i < requiredSum; i++) increments.push(1)
    for (let i = 0; i < 7 - requiredSum; i++) increments.push(0)

    // Shuffle increments
    for (let i = increments.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [increments[i], increments[j]] = [increments[j], increments[i]]
    }

    // Build path of pegs
    for (let r = 1; r < 8; r++) {
      currentPeg += increments[r - 1]
      pathPegs.push(currentPeg)
    }

    // Convert peg indices to coordinates
    const coords: { x: number; y: number }[] = []
    
    // Starting position above row 0 (top center with slight random offset)
    coords.push({ x: W / 2 + (Math.random() * 10 - 5), y: 30 })

    // Peg positions
    for (let r = 0; r < rows; r++) {
      const col = pathPegs[r]
      const px = W / 2 + (col - (r + 2) / 2) * dx
      const py = startY + r * dy
      coords.push({ x: px, y: py })
    }

    // Slot position (midpoint between peg slotIndex and slotIndex + 1 of row 7)
    const lastRowIndex = 7
    const pegLeftX = W / 2 + (slotIndex - (lastRowIndex + 2) / 2) * dx
    const pegRightX = W / 2 + ((slotIndex + 1) - (lastRowIndex + 2) / 2) * dx
    const slotX = (pegLeftX + pegRightX) / 2
    const slotY = startY + 8 * dy + 35

    coords.push({ x: slotX, y: slotY })

    return { path: coords, targetPeg }
  }

  // Handle Plinko Roll
  const handlePlay = async () => {
    if (plays <= 0 || playing) return

    setPlaying(true)
    playBeep(260, 0.1, "triangle")

    try {
      const res = await apiClient.post("/plinko/play")
      if (res.data.success) {
        const { rewardAmount, slotIndex, newPlays } = res.data

        // Subtract plays locally for snappy response
        setPlays(newPlays)

        // Generate animation path starting from top center
        const { path } = generatePath(slotIndex)

        // Create new active ball
        const colors = [
          "#eab308", // gold
          "#10b981", // emerald
          "#3b82f6", // blue
          "#ec4899", // pink
          "#f97316"  // orange
        ]
        const randomColor = colors[Math.floor(Math.random() * colors.length)]

        const newBall: ActiveBall = {
          id: Date.now() + Math.random(),
          x: path[0].x,
          y: path[0].y,
          path,
          currentStep: 0,
          progress: 0,
          speed: 0.033, // controls how fast ball drops
          targetSlot: slotIndex,
          rewardAmount,
          color: randomColor
        }

        ballsRef.current.push(newBall)

        // Sync user profile in context after short delay
        setTimeout(() => {
          syncProfile()
        }, 1500)

      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || (currentLang === "vi" ? "Có lỗi xảy ra" : "An error occurred"))
    } finally {
      setPlaying(false)
    }
  }

  // Canvas Drawing & Animating Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Fit canvas resolution for crisp display on high DPI screens
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const draw = () => {
      // 1. Clear Canvas & Draw Cartoon Image Background
      ctx.clearRect(0, 0, W, H)
      if (bgImageRef.current) {
        ctx.drawImage(bgImageRef.current, 0, 0, W, H)
        // Draw linear gradient overlay (darker at top for yellow peg contrast)
        const overlayGrad = ctx.createLinearGradient(0, 0, 0, H)
        overlayGrad.addColorStop(0, "rgba(8, 5, 20, 0.7)") // 70% dark at top
        overlayGrad.addColorStop(1, "rgba(10, 6, 22, 0.35)") // 35% dark at bottom
        ctx.fillStyle = overlayGrad
        ctx.fillRect(0, 0, W, H)
      } else {
        // Fallback to cartoon gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
        bgGrad.addColorStop(0, "#1a1230")
        bgGrad.addColorStop(1, "#0a0616")
        ctx.fillStyle = bgGrad
        ctx.fillRect(0, 0, W, H)
      }

      // 2. Draw peg grid lines / background geometry for playful cartoon style
      ctx.strokeStyle = "rgba(124, 58, 237, 0.07)"
      ctx.lineWidth = 2
      for (let r = 0; r < rows; r++) {
        ctx.beginPath()
        const leftPegX = W / 2 + (0 - (r + 2) / 2) * dx
        const rightPegX = W / 2 + ((r + 2) - (r + 2) / 2) * dx
        const py = startY + r * dy
        ctx.moveTo(leftPegX, py)
        ctx.lineTo(rightPegX, py)
        ctx.stroke()
      }

      // 3. Update & Draw Pulses
      pulsesRef.current = pulsesRef.current
        .map(p => ({ ...p, intensity: p.intensity - 0.05 }))
        .filter(p => p.intensity > 0)

      // 4. Draw Pegs (Cartoon Button style)
      for (let r = 0; r < rows; r++) {
        const pegsCount = r + 3
        for (let c = 0; c < pegsCount; c++) {
          const px = W / 2 + (c - (r + 2) / 2) * dx
          const py = startY + r * dy

          // Check if peg has active pulse
          const pulse = pulsesRef.current.find(p => p.row === r && p.col === c)
          const pulseIntensity = pulse ? pulse.intensity : 0

          // Elastic peg expansion on bounce impact
          const rPeg = pegRadius + pulseIntensity * 4.5

          // 1. Drop shadow of peg
          ctx.beginPath()
          ctx.arc(px, py + 2, rPeg, 0, Math.PI * 2)
          ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
          ctx.fill()

          // 2. Thick Outer Border
          ctx.beginPath()
          ctx.arc(px, py, rPeg, 0, Math.PI * 2)
          ctx.fillStyle = "#0c0714"
          ctx.fill()

          // 3. Inner Peg Body
          ctx.beginPath()
          ctx.arc(px, py, rPeg - 2, 0, Math.PI * 2)
          ctx.fillStyle = pulse ? "#10b981" : "#f59e0b" // green on bounce, amber default
          ctx.fill()

          // 4. Shiny Glossy reflection dot
          ctx.beginPath()
          ctx.arc(px - rPeg * 0.25, py - rPeg * 0.25, rPeg * 0.2, 0, Math.PI * 2)
          ctx.fillStyle = "rgba(255, 255, 255, 0.75)"
          ctx.fill()
        }
      }

      // 5. Draw Slots (buckets) at bottom
      const lastRowIndex = 7
      const slotY = startY + 8 * dy + 35
      const slotH = 50

      for (let s = 0; s < SLOT_PRIZES.length; s++) {
        const prize = SLOT_PRIZES[s]
        const pegLeftX = W / 2 + (s - (lastRowIndex + 2) / 2) * dx
        const pegRightX = W / 2 + ((s + 1) - (lastRowIndex + 2) / 2) * dx
        const slotX = (pegLeftX + pegRightX) / 2
        const slotW = dx - 4

        // Playful cartoon slot colors
        let themeColor = "#38bdf8" // sky blue
        let bgColor = "#0284c7" // dark blue
        
        if (prize >= 1000) { // Jackpot
          themeColor = "#fbbf24" // Amber/Gold
          bgColor = "#b45309"
        } else if (prize >= 500) {
          themeColor = "#fb923c" // Orange
          bgColor = "#c2410c"
        } else if (prize >= 300) {
          themeColor = "#f472b6" // Pink
          bgColor = "#be185d"
        } else if (prize >= 200) {
          themeColor = "#c084fc" // Purple
          bgColor = "#7e22ce"
        }

        // Draw Slot Container with thick black outline
        ctx.fillStyle = "#0c0714"
        ctx.beginPath()
        const rx = slotX - slotW / 2
        const ry = slotY
        const rw = slotW
        const rh = slotH
        const radius = 8
        if (ctx.roundRect) {
          ctx.roundRect(rx - 2.5, ry - 2.5, rw + 5, rh + 5, radius + 2)
        } else {
          ctx.rect(rx - 2.5, ry - 2.5, rw + 5, rh + 5)
        }
        ctx.fill()

        ctx.fillStyle = bgColor
        ctx.beginPath()
        if (ctx.roundRect) {
          ctx.roundRect(rx, ry, rw, rh, radius)
        } else {
          ctx.rect(rx, ry, rw, rh)
        }
        ctx.fill()

        // Draw inner bright highlight line
        ctx.strokeStyle = themeColor
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw prize text with thick cartoon outline
        ctx.textAlign = "center"
        ctx.font = "900 13px 'Arial Black', sans-serif"
        
        ctx.strokeStyle = "#0c0714"
        ctx.lineWidth = 4
        ctx.strokeText(prize.toString(), slotX, slotY + 22)
        
        ctx.fillStyle = "#ffffff"
        ctx.fillText(prize.toString(), slotX, slotY + 22)

        // Draw AQE label
        ctx.font = "bold 8px sans-serif"
        ctx.strokeStyle = "#0c0714"
        ctx.lineWidth = 3
        ctx.strokeText("AQE", slotX, slotY + 36)
        
        ctx.fillStyle = themeColor
        ctx.fillText("AQE", slotX, slotY + 36)
      }

      // 6. Update & Draw Balls
      ballsRef.current.forEach((ball, bIdx) => {
        const { path, currentStep, progress, speed, color, targetSlot, rewardAmount } = ball
        const pCurrent = path[currentStep]
        const pNext = path[currentStep + 1]

        if (!pNext) {
          // Ball completed route
          // Calculate screen-relative coordinates for confetti origin
          let fx = 0.5
          let fy = 0.75
          if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect()
            fx = (rect.left + (ball.x / W) * rect.width) / window.innerWidth
            fy = (rect.top + (ball.y / H) * rect.height) / window.innerHeight
            fx = Math.max(0, Math.min(1, fx))
            fy = Math.max(0, Math.min(1, fy))
          }

          // Trigger confetti from the landing point
          if (rewardAmount >= 500) {
            confetti({
              particleCount: 85,
              spread: 65,
              origin: { x: fx, y: fy },
              colors: [color, "#fbbf24", "#ffffff"]
            })
            toast.success(
              tLocal.jackpotMessage.replace("{{amount}}", rewardAmount.toString()),
              { style: { background: "#11201b", border: "1px solid #fbbf24", color: "#fbbf24" } }
            )
          } else {
            confetti({
              particleCount: 30,
              spread: 35,
              origin: { x: fx, y: fy }
            })
            toast.success(tLocal.winMessage.replace("{{amount}}", rewardAmount.toString()))
          }

          playBeep(480, 0.15, "triangle")
          setTimeout(() => playBeep(640, 0.25, "sine"), 80)

          // Add to local history instantly
          setHistory(prev => [
            {
              _id: Math.random().toString(),
              rewardAmount,
              playedAt: new Date().toISOString()
            },
            ...prev
          ].slice(0, 20))

          // Remove ball
          ballsRef.current.splice(bIdx, 1)
          return
        }

        // Increment progress
        const nextProgress = progress + speed
        ball.progress = nextProgress

        // Interpolate position
        const dxVal = pNext.x - pCurrent.x
        const dyVal = pNext.y - pCurrent.y

        ball.y = pCurrent.y + dyVal * nextProgress

        // Calculate X bounce bulge
        if (currentStep === 0 || currentStep === path.length - 2) {
          // Linear transition at beginning and end
          ball.x = pCurrent.x + dxVal * nextProgress
        } else {
          // Sinusoidal bounce term
          const bounceMagnitude = 11 // bounce height offset
          // Determine if bouncing left or right based on destination x
          const dir = dxVal > 0 ? 1 : -1
          // Add sine offset to create dynamic projectile arc
          ball.x = pCurrent.x + dxVal * nextProgress + dir * bounceMagnitude * Math.sin(Math.PI * nextProgress)
        }

        // If transition to next peg is complete
        if (nextProgress >= 1) {
          ball.currentStep += 1
          ball.progress = 0

          // Spawn pulse at the peg that was hit
          if (ball.currentStep >= 1 && ball.currentStep <= 8) {
            const hitPegRow = ball.currentStep - 1
            const hitX = pNext.x
            const rowPegsCount = hitPegRow + 3
            let matchedCol = 0
            let minDist = 9999
            for (let c = 0; c < rowPegsCount; c++) {
              const px = W / 2 + (c - (hitPegRow + 2) / 2) * dx
              const dist = Math.abs(px - hitX)
              if (dist < minDist) {
                minDist = dist
                matchedCol = c
              }
            }

            // Create pulse
            pulsesRef.current.push({
              row: hitPegRow,
              col: matchedCol,
              intensity: 1.0
            })

            // Play peg impact sound
            playBeep(450 + hitPegRow * 45, 0.05, "sine")
          }
        }

        // 1. Draw Ball Drop Shadow
        ctx.beginPath()
        ctx.arc(ball.x, ball.y + 3, ballRadius, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
        ctx.fill()

        // 2. Thick Outer Outline
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2)
        ctx.fillStyle = "#0c0714"
        ctx.fill()

        // 3. Colored Core Fills
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, ballRadius - 2, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()

        // 4. Glossy Highlight Reflect dot
        ctx.beginPath()
        ctx.arc(ball.x - ballRadius * 0.28, ball.y - ballRadius * 0.28, ballRadius * 0.22, 0, Math.PI * 2)
        ctx.fillStyle = "#ffffff"
        ctx.fill()
      })

      // Loop
      animationFrameId.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [soundEnabled, currentLang])

  return (
    <div className="mx-auto max-w-[1240px] space-y-8 pb-16 font-['SVN-Gilroy',sans-serif]">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#16362e] to-[#276152] p-8 md:p-12 text-white shadow-xl shadow-emerald-950/10">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10">
          <Gamepad2 size={300} className="text-white" />
        </div>
        <div className="relative max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles size={14} className="text-yellow-400" />
            <span>Mini Game Reward</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            AQE Plinko
          </h1>
          <p className="text-sm md:text-base text-emerald-100 font-medium leading-relaxed">
            {tLocal.desc}
          </p>
        </div>
      </div>

      {/* Info Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#276152]">
            <Gamepad2 size={28} />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
              {tLocal.playsRemaining}
            </p>
            <h3 className="text-2xl font-black text-[#111827]">
              {plays}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Coins size={28} />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
              {tLocal.aqeBalance}
            </p>
            <h3 className="text-2xl font-black text-amber-600">
              {user?.aqeBalance?.toLocaleString() || 0} <span className="text-xs font-bold">AQE</span>
            </h3>
          </div>
        </div>

        {/* Sound toggle card */}
        <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`flex size-14 items-center justify-center rounded-2xl transition-colors ${soundEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
              {soundEnabled ? <Volume2 size={28} /> : <VolumeX size={28} />}
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                FX Option
              </p>
              <h3 className="text-md font-bold text-gray-800">
                {tLocal.sound}
              </h3>
            </div>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex h-8 w-14 items-center rounded-full px-1 transition-colors outline-none ${soundEnabled ? 'bg-[#276152]' : 'bg-gray-200'}`}
          >
            <div className={`size-6 rounded-full bg-white shadow-sm transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Main layout body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Plinko board column */}
        <div className="lg:col-span-7 flex flex-col items-center gap-6">
          <div className="relative w-full max-w-[600px] overflow-hidden rounded-[24px] shadow-xl">
            <canvas
              ref={canvasRef}
              style={{ width: "100%", height: "auto" }}
              className="block rounded-[24px]"
            />
          </div>

          <button
            onClick={handlePlay}
            disabled={plays <= 0 || playing}
            className={`w-full max-w-[400px] h-[60px] rounded-full font-black text-[18px] tracking-wide shadow-lg transition-all duration-300 ${
              plays <= 0 
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-emerald-500 to-[#276152] text-white hover:brightness-105 active:scale-98 shadow-emerald-500/20'
            }`}
          >
            {playing ? tLocal.playing : plays <= 0 ? tLocal.noPlays : tLocal.playNow}
          </button>
        </div>

        {/* Win History & Rules column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recent History */}
          <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-[17px] font-bold text-gray-800">
              <HistoryIcon size={18} className="text-[#276152]" />
              {tLocal.history}
            </h3>
            
            <div className="custom-scrollbar max-h-[220px] overflow-y-auto pr-1 space-y-3">
              {loading ? (
                <p className="text-center py-6 text-sm text-gray-400">{tLocal.loading}</p>
              ) : history.length > 0 ? (
                history.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between rounded-xl bg-gray-50/70 p-3.5 border border-gray-100/50 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex size-9 items-center justify-center rounded-lg font-bold text-xs ${
                        item.rewardAmount >= 1000 
                          ? 'bg-amber-100 text-amber-700' 
                          : item.rewardAmount >= 500 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {item.rewardAmount >= 1000 ? "JP" : "AQE"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-700">
                          {tLocal.wins} +{item.rewardAmount.toLocaleString()} AQE
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {dayjs(item.playedAt).format("DD/MM/YYYY HH:mm:ss")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-sm text-gray-400 italic">
                  {tLocal.noHistory}
                </p>
              )}
            </div>
          </div>

          {/* Rules info */}
          <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="flex items-center gap-2 text-[17px] font-bold text-gray-800">
              <HelpCircle size={18} className="text-amber-600" />
              {tLocal.rules}
            </h3>
            <div className="space-y-3 text-xs leading-relaxed text-gray-500 font-medium">
              <p className="border-l-2 border-emerald-500 pl-3">
                {tLocal.rulesDesc}
              </p>
              <p className="border-l-2 border-amber-500 pl-3">
                {tLocal.jackpotNote}
              </p>
              
              {/* Prize Slots distribution table */}
              <div className="mt-4 pt-3 border-t border-gray-50">
                <p className="font-bold text-gray-700 mb-2 uppercase text-[10px] tracking-wider">
                  Plinko Prize Weights
                </p>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-center font-bold">
                  <div className="rounded bg-gray-50 p-1.5 border border-gray-100">
                    <span className="text-gray-400 block">100 AQE</span>
                    <span className="text-emerald-700">25.0%</span>
                  </div>
                  <div className="rounded bg-gray-50 p-1.5 border border-gray-100">
                    <span className="text-gray-400 block">150 AQE</span>
                    <span className="text-emerald-700">20.0%</span>
                  </div>
                  <div className="rounded bg-gray-50 p-1.5 border border-gray-100">
                    <span className="text-gray-400 block">200 AQE</span>
                    <span className="text-emerald-700">30.0%</span>
                  </div>
                  <div className="rounded bg-gray-50 p-1.5 border border-gray-100">
                    <span className="text-gray-400 block">300 AQE</span>
                    <span className="text-orange-700">12.0%</span>
                  </div>
                  <div className="rounded bg-gray-50 p-1.5 border border-gray-100">
                    <span className="text-gray-400 block">500 AQE</span>
                    <span className="text-orange-700">16.0%</span>
                  </div>
                  <div className="rounded bg-amber-50/50 p-1.5 border border-amber-100/50">
                    <span className="text-amber-800 block">1000 AQE</span>
                    <span className="text-amber-700">1.0%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
