import { useState, useEffect, useRef } from "react"
import {
  Coins,
  Loader2,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles,
  UserCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { BlockchainPaymentModal } from "@/components/BlockchainPaymentModal"
import { PackageDetailModal } from "@/components/PackageDetailModal"
import { PendingPaymentDialog } from "@/components/PendingPaymentDialog"
import { useSocket } from "@/providers/SocketProvider"
import { useTranslation } from "react-i18next"
import { useExchangeRate } from "@/hooks/useExchangeRate"

const getImageUrl = (url?: string) => {
  if (!url) return ''
  return url.startsWith('/uploads') ? import.meta.env.VITE_API_URL.replace('/api', '') + url : url
}



interface Package {
  _id: string
  title: string
  price: number
  description: string
  bonusPercent: number
  segment: "Cơ bản" | "Nâng cao" | "Cao cấp"
  aqeAmount: number
  aqeRequired: number
  f1CommissionPercent: number
  f2CommissionPercent: number
  isActive: boolean
  color?: string
  // Resort benefits properties
  stayDays?: string
  roomType?: string
  vipLounge?: boolean
  guests?: string
  roomService?: boolean
  transportation?: boolean
  savings?: string
  wellness?: boolean
  priority?: boolean
  concierge?: boolean
  // Package Image
  imageUrl?: string
}

const getPackageColors = (hexColor?: string) => {
  const baseColor = hexColor || '#276152';
  let hex = baseColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  return {
    primary: `#${hex}`,
    bgCard: `#${hex}06`,  // ~2.5% opacity for soft full card background
    bgBox: `#${hex}14`,   // ~8% opacity for inner pricing box
    border: `#${hex}22`,  // ~13% opacity for soft borders
    badgeBg: `#${hex}1a`  // ~10% opacity for badge backgrounds
  };
};

const getPackageBenefits = (price: number, t: any) => {
  if (price <= 1000) {
    return {
      stayDays: t("packages.benefits.stay_2", { defaultValue: "2 ngày / năm" }),
      roomType: "Oasis Room",
      vipLounge: true,
      guests: t("packages.benefits.guests_none", { defaultValue: "Không" }),
      roomService: true,
      transport: true,
      savings: "30%",
      wellness: false,
      priority: false,
      concierge: false
    };
  } else if (price <= 5000) {
    return {
      stayDays: t("packages.benefits.stay_5", { defaultValue: "5 ngày / năm" }),
      roomType: "Oasis Room",
      vipLounge: true,
      guests: t("packages.benefits.guests_none", { defaultValue: "Không" }),
      roomService: true,
      transport: true,
      savings: "30%",
      wellness: false,
      priority: false,
      concierge: false
    };
  } else if (price <= 10000) {
    return {
      stayDays: t("packages.benefits.stay_7", { defaultValue: "7 ngày / năm" }),
      roomType: "Horizon Room",
      vipLounge: true,
      guests: "+1",
      roomService: true,
      transport: true,
      savings: "50%",
      wellness: false,
      priority: false,
      concierge: false
    };
  } else if (price <= 20000) {
    return {
      stayDays: t("packages.benefits.stay_7", { defaultValue: "7 ngày / năm" }),
      roomType: "Horizon Room",
      vipLounge: true,
      guests: "+1",
      roomService: true,
      transport: true,
      savings: "50%",
      wellness: false,
      priority: false,
      concierge: false
    };
  } else if (price <= 100000) {
    return {
      stayDays: t("packages.benefits.stay_7", { defaultValue: "7 ngày / năm" }),
      roomType: "Prestige Room",
      vipLounge: true,
      guests: "+2",
      roomService: true,
      transport: true,
      savings: "50%+",
      wellness: true,
      priority: true,
      concierge: false
    };
  } else {
    return {
      stayDays: t("packages.benefits.stay_14", { defaultValue: "14 ngày / năm" }),
      roomType: "Presidential Suite",
      vipLounge: true,
      guests: "+3",
      roomService: true,
      transport: true,
      savings: t("packages.benefits.savings_unlimited", { defaultValue: "Không giới hạn" }),
      wellness: true,
      priority: true,
      concierge: true
    };
  }
};

export default function InvestmentPackagesPage() {
  const { t } = useTranslation()
  const { socket } = useSocket()
  const { rate: aqeRate } = useExchangeRate()
  
  const [packages, setPackages] = useState<Package[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isComparisonOpen, setIsComparisonOpen] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState<string>("Tất cả")
  
  // Checkout Modal States
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [modalStatus, setModalStatus] = useState<'idle' | 'success'>('idle')
  
  // Detail Modal States
  const [detailPackage, setDetailPackage] = useState<Package | null>(null)

  // Buy AQE (lẻ) states
  const [purchaseAmount, setPurchaseAmount] = useState<number>(0)
  const [awaitingPayment, setAwaitingPayment] = useState<any>(null)
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false)
  const [buyModalStatus, setBuyModalStatus] = useState<'idle' | 'success'>('idle')

  // Packages carousel scroll
  const packagesScrollRef = useRef<HTMLDivElement>(null)
  const scrollPackages = (direction: 'left' | 'right') => {
    const container = packagesScrollRef.current
    if (!container) return
    const amount = container.clientWidth * 0.8
    container.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleNotification = (notification: any) => {
      if (notification.type === 'PAYMENT') {
        console.log("Payment detected via socket, refreshing profile...")
        fetchInitialData()
        setModalStatus('success')
      }
    }

    socket.on('new_notification', handleNotification)
    return () => {
      socket.off('new_notification', handleNotification)
    }
  }, [socket])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [profileRes, packagesRes, pledgeRes] = await Promise.all([
        apiClient.get("/auth/profile"),
        apiClient.get("/payments/packages"),
        apiClient.get("/payments/pledge")
      ])
      setUserProfile(profileRes.data)
      setPackages(packagesRes.data)
      setAwaitingPayment(pledgeRes.data)
    } catch (err) {
      console.error("Fetch Partnership Packages error:", err)
      toast.error(t("packages.fetch_error", { defaultValue: "Không thể tải thông tin gói đầu tư" }))
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseClick = (pkg: Package) => {
    if (awaitingPayment?.pendingTransaction) {
      toast.error(t("buy.pending_warning"))
      return
    }
    if (userProfile?.kycStatus !== 'verified' && userProfile?.kycStatus !== 'pending') {
      toast.error(t("kyc.errors.step_locked", { defaultValue: "Vui lòng hoàn tất xác minh KYC trước khi tham gia đầu tư" }))
      return
    }

    setSelectedPackage(pkg)
    setModalStatus('idle')
    setIsPaymentModalOpen(true)
  }

  const handleBuyAqe = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (awaitingPayment?.pendingTransaction) {
      toast.error(t("buy.pending_warning"))
      return
    }
    if (userProfile?.kycStatus !== 'verified' && userProfile?.kycStatus !== 'pending') {
      toast.error(t("pre_register.kyc_verified_required"))
      return
    }
    if (purchaseAmount < 10) {
      toast.error(t("buy.min_warning"))
      return
    }
    setIsBuyModalOpen(true)
  }

  const segments = ["Tất cả", "Cơ bản", "Nâng cao", "Cao cấp"]
  
  const getSegmentLabel = (seg: string) => {
    if (seg === "Tất cả") return t("packages.filter_all");
    if (seg === "Cơ bản") return t("packages.filter_basic");
    if (seg === "Nâng cao") return t("packages.filter_advanced");
    if (seg === "Cao cấp") return t("packages.filter_premium");
    return seg;
  }

  const filteredPackages = selectedSegment === "Tất cả" 
    ? packages 
    : packages.filter(p => p.segment === selectedSegment)

  const sortedPackages = [...packages].sort((a, b) => a.price - b.price)

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#276152]" />
    </div>
  )

  // Stats calculation
  const totalPackages = packages.length
  const minPrice = packages.length > 0 ? Math.min(...packages.map(p => p.price)) : 0
  const maxAqe = packages.length > 0 ? Math.max(...packages.map(p => p.aqeAmount * (1 + p.bonusPercent/100))) : 0

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20 px-4 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Main Header Card with Figma styling */}
      <div className="pt-2">
        <h1 className="text-3xl font-black text-[#0d1f1d] leading-none tracking-tight">
          {t("packages.title")}
        </h1>
        <p className="text-sm text-gray-500 font-medium max-w-xl mt-1">
          {t("packages.subtitle")}
        </p>
      </div>

      {/* ===== BUY AQE SECTION ===== */}
      {(() => {
        const nowChicagoStr = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })
        const now = new Date(nowChicagoStr)
        const isJune = now.getMonth() === 5 && now.getFullYear() === 2026
        const expectedAqe = aqeRate > 0 ? purchaseAmount / aqeRate : 0
        const bonusAqe = isJune ? expectedAqe * 0.05 : 0
        const totalReceived = expectedAqe + bonusAqe
        const isKycVerified = userProfile?.kycStatus === 'verified' || userProfile?.kycStatus === 'pending'

        return (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header strip */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 bg-[#d9ede8] rounded-xl flex items-center justify-center text-[#276152]">
                  <Coins size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#0d1f1d]">{t("buy.title")}</h2>
                  <p className="text-xs text-gray-400 font-medium">{t("buy.subtitle")}</p>
                </div>
              </div>
              <Link to="/payment-history">
                <Button variant="outline" className="border-[#276152] text-[#276152] hover:bg-[#d9ede8]/20 font-bold rounded-xl text-xs gap-1.5 h-8">
                  <Clock size={13} />
                  <span>{t("packages.view_history")}</span>
                </Button>
              </Link>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Input form */}
              <div className="space-y-4">
                {/* June promo */}
                {isJune && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-start gap-2.5">
                    <div className="size-7 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-800">{t("buy.june_promo_banner")}</p>
                      <p className="text-xs text-emerald-600 mt-0.5">{t("buy.june_promo_desc")}</p>
                    </div>
                  </div>
                )}

                {/* Amount input */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("buy.amount_label")}</p>
                  <div className="relative">
                    <Input
                      type="number"
                      min={10}
                      value={purchaseAmount === 0 ? "" : purchaseAmount}
                      placeholder={t("buy.amount_placeholder")}
                      onChange={(e) => setPurchaseAmount(e.target.value === "" ? 0 : Number(e.target.value))}
                      className="h-11 pl-4 pr-16 border-gray-200 rounded-xl focus:ring-1 focus:ring-[#276152] focus:border-[#276152] font-semibold text-sm text-[#0d1f1d] placeholder:text-gray-300"
                    />
                    <div className="absolute right-3 top-2.5 px-2 py-0.5 bg-gray-100 rounded-md text-[11px] font-bold text-gray-500">
                      USDT
                    </div>
                  </div>
                  {purchaseAmount > 0 && purchaseAmount < 10 && (
                    <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                      <ShieldAlert size={12} />
                      {t("buy.min_warning")}
                    </p>
                  )}
                </div>

                {/* Presets */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t("buy.select_amount")}</p>
                  <div className="flex gap-2">
                    {[50, 100, 500, 1000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setPurchaseAmount(amount)}
                        className={cn(
                          "flex-1 py-1.5 h-8 rounded-xl font-bold text-xs border transition-all active:scale-[0.97]",
                          purchaseAmount === amount
                            ? "bg-[#276152] border-[#276152] text-white"
                            : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300"
                        )}
                      >
                        {amount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Summary + CTA */}
              <div className="space-y-4 flex flex-col justify-between">
                {/* Calculation card */}
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Summary</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center text-gray-500">
                      <span>{t("buy.expected_label")}</span>
                      <span className="font-bold text-gray-800">
                        {purchaseAmount > 0
                          ? expectedAqe.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })
                          : "—"} AQE
                      </span>
                    </div>
                    {isJune && purchaseAmount > 0 && (
                      <div className="flex justify-between items-center text-emerald-600">
                        <span>{t("buy.bonus_label")}</span>
                        <span className="font-bold">
                          +{bonusAqe.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} AQE
                        </span>
                      </div>
                    )}
                    <div className="h-px bg-gray-200" />
                    <div className="flex justify-between items-center font-extrabold text-[#0d1f1d]">
                      <span>{t("buy.total_received")}</span>
                      <span className="text-[#276152] text-base">
                        {purchaseAmount > 0
                          ? totalReceived.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })
                          : "—"} AQE
                      </span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                {isKycVerified ? (
                  <Button
                    type="button"
                    onClick={handleBuyAqe}
                    disabled={purchaseAmount < 10 || !!awaitingPayment?.pendingTransaction}
                    className="w-full h-11 bg-[#276152] hover:bg-[#1e4d41] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
                  >
                    <span>{t("buy.buy_btn")}</span>
                    <ArrowRight size={16} />
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                      <ShieldAlert size={15} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                        {t("pre_register.kyc_verified_required")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 h-11 bg-gray-100 text-gray-400 rounded-xl" disabled>
                        {t("buy.buy_btn")}
                      </Button>
                      <Link to="/settings?tab=kyc" className="shrink-0">
                        <Button variant="outline" className="h-11 border-[#276152] text-[#276152] hover:bg-[#276152]/5 rounded-xl font-bold px-4 text-xs">
                          KYC
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Special Promotional Banner (Figma Linear Gradient style) */}
      <div className="relative rounded-[24px] overflow-hidden p-8 text-white shadow-lg shadow-emerald-950/10 flex flex-col justify-between min-h-[200px]"
           style={{ backgroundImage: "linear-gradient(165deg, rgb(30, 77, 64) 0%, rgb(39, 97, 82) 55%, rgb(58, 122, 104) 100%)" }}>
        <div className="space-y-3 z-10 max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] uppercase font-bold tracking-wider">
            <Sparkles size={12} className="text-amber-300" />
            <span>{t("packages.promo_partner")}</span>
          </div>
          <h2 className="text-2xl font-black">{t("packages.partner_title")}</h2>
          <p className="text-sm text-white/80 leading-relaxed font-medium">
            {t("packages.partner_desc")}
          </p>
        </div>

        <div className="flex items-center gap-6 pt-6 z-10 border-t border-white/10 text-xs font-bold text-white/90">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-emerald-300" />
            <span>{t("packages.dates_label")}</span>
          </div>
        </div>
        
        {/* Subtle decorative background circle */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial-gradient opacity-10 pointer-events-none" />
      </div>

      {/* Quick stats grid (Figma-inspired cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-emerald-50 text-[#276152] rounded-xl flex items-center justify-center">
              <Layers size={16} />
            </div>
            <span className="text-xs text-gray-400 font-bold uppercase">{t("packages.stats.total_packages")}</span>
          </div>
          <p className="text-2xl font-black text-[#0d1f1d]">{totalPackages} {t("packages.package_unit")}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Coins size={16} />
            </div>
            <span className="text-xs text-gray-400 font-bold uppercase">{t("packages.stats.min_price")}</span>
          </div>
          <p className="text-2xl font-black text-[#0d1f1d]">${minPrice.toLocaleString()} USDT</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <span className="text-xs text-gray-400 font-bold uppercase">{t("packages.stats.max_aqe")}</span>
          </div>
          <p className="text-2xl font-black text-[#0d1f1d]">{maxAqe.toLocaleString()} AQE</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
            <span className="text-xs text-gray-400 font-bold uppercase">{t("packages.stats.service_saving")}</span>
          </div>
          <p className="text-2xl font-black text-[#0d1f1d]">{t("packages.up_to_50")}</p>
        </div>
      </div>

      {/* Segment filter pills */}
      <div className="flex items-center gap-2 pb-2">
        {segments.map((seg) => (
          <button
            key={seg}
            onClick={() => setSelectedSegment(seg)}
            className={cn(
              "px-6 py-2 rounded-[12px] text-sm font-medium transition-all duration-300 border",
              selectedSegment === seg
                ? "bg-[#276152] text-white border-[#276152] shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:text-[#276152] hover:border-[#276152]"
            )}
          >
            {getSegmentLabel(seg)}
          </button>
        ))}
      </div>

      {/* Packages Grid */}
      <div className="relative">
        {filteredPackages.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => scrollPackages('left')}
              aria-label={t("packages.scroll_left")}
              className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-[#276152] hover:bg-[#276152] hover:text-white transition-all active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => scrollPackages('right')}
              aria-label={t("packages.scroll_right")}
              className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-[#276152] hover:bg-[#276152] hover:text-white transition-all active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        <div ref={packagesScrollRef} className="flex flex-nowrap overflow-x-auto gap-4 pb-8 pt-2 snap-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filteredPackages.length === 0 ? (
          <div className="w-full py-12 text-center text-gray-400 font-bold bg-white rounded-3xl border border-gray-150 shadow-sm">
            {t("packages.empty_packages")}
          </div>
        ) : (
          filteredPackages.map((pkg) => {
            const finalAqe = pkg.aqeAmount * (1 + pkg.bonusPercent / 100)
            const colors = getPackageColors(pkg.color)
            return (
              <div key={pkg._id} className="snap-start shrink-0 w-[260px] rounded-[24px] border border-gray-150 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all duration-300 flex flex-col p-3 relative group">
                
                {/* Title */}
                <div className="py-2 text-center">
                  <h3 className="text-[11px] font-black text-[#111827] uppercase tracking-wider">{pkg.title}</h3>
                </div>

                {/* Cover Image */}
                <div className="w-full aspect-[2/3.2] relative overflow-hidden rounded-[16px] shrink-0 mt-1">
                  {pkg.imageUrl ? (
                    <img src={getImageUrl(pkg.imageUrl)} alt={pkg.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-sm font-bold opacity-50" style={{ color: colors.primary }}>{pkg.title}</span>
                    </div>
                  )}
                  {pkg.bonusPercent > 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full text-[9px] font-bold shadow-sm">
                        +{pkg.bonusPercent}% Bonus
                      </span>
                    </div>
                  )}
                </div>

                {/* Pricing Details */}
                <div className="pt-5 pb-4 text-center space-y-1">
                  <p className="text-[11px] text-gray-500 font-medium">Participation Amount</p>
                  <p className="text-xl font-black text-[#111827]">${pkg.price.toLocaleString()} USDT</p>
                  <p className="text-[11px] text-gray-400 font-medium">Receive {finalAqe.toLocaleString()} AQE</p>
                </div>

                {/* Actions */}
                <div className="mt-auto space-y-2">
                  <Button
                    onClick={() => handlePurchaseClick(pkg)}
                    className="w-full h-10 bg-[#276152] hover:bg-[#1e4d41] text-white rounded-[10px] font-bold text-[13px] transition-all"
                  >
                    Join Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDetailPackage(pkg)}
                    className="w-full h-10 rounded-[10px] font-bold transition-all border border-[#276152] text-[#276152] hover:bg-[#276152]/5 text-[13px]"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            )
          })
        )}
        </div>
      </div>

      {/* Benefit Comparison Section */}
      {packages.length > 0 && (
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6 overflow-hidden transition-all duration-300">
          <div 
            onClick={() => setIsComparisonOpen(!isComparisonOpen)}
            className="flex items-center justify-between cursor-pointer select-none group"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-black text-[#0d1f1d] group-hover:text-[#276152] transition-colors flex items-center gap-2">
                <span>{t("packages.comparison.title", { defaultValue: "So sánh quyền lợi các gói" })}</span>
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                {t("packages.comparison.subtitle", { defaultValue: "Xem chi tiết các đặc quyền nghỉ dưỡng đi kèm với từng cấp độ đầu tư." })}
              </p>
            </div>
            
            <div className="size-10 rounded-2xl bg-gray-50 text-[#0d1f1d] flex items-center justify-center group-hover:bg-[#d9ede8]/30 group-hover:text-[#276152] transition-all shrink-0">
              {isComparisonOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>

          {isComparisonOpen && (
            <div className="overflow-x-auto pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 font-bold text-xs text-gray-500 uppercase tracking-wider pl-4 w-[200px]">
                      {t("packages.comparison.benefit", { defaultValue: "Quyền lợi" })}
                    </th>
                    {sortedPackages.map((pkg) => {
                      const colors = getPackageColors(pkg.color);
                      return (
                        <th key={pkg._id} className="pb-4 text-center font-extrabold text-xs text-gray-900 min-w-[120px]">
                          <div className="flex flex-col items-center">
                            <span>{pkg.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full mt-1 font-bold animate-pulse" style={{ color: colors.primary, backgroundColor: colors.badgeBg }}>
                              ${pkg.price.toLocaleString()} USDT
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {/* Stay Days */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-4 font-bold text-gray-700">{t("packages.comparison.stay_days", { defaultValue: "Số ngày lưu trú" })}</td>
                    {sortedPackages.map((pkg) => (
                      <td key={pkg._id} className="py-4 text-center font-semibold text-gray-900">
                        {pkg.stayDays || getPackageBenefits(pkg.price, t).stayDays}
                      </td>
                    ))}
                  </tr>

                  {/* Room Type */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-4 font-bold text-gray-700">{t("packages.comparison.room_type", { defaultValue: "Loại phòng" })}</td>
                    {sortedPackages.map((pkg) => (
                      <td key={pkg._id} className="py-4 text-center font-semibold text-gray-900">
                        {pkg.roomType || getPackageBenefits(pkg.price, t).roomType}
                      </td>
                    ))}
                  </tr>

                  {/* VIP Lounge */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-4 font-bold text-gray-700">{t("packages.comparison.vip_lounge", { defaultValue: "VIP Lounge" })}</td>
                    {sortedPackages.map((pkg) => {
                      const hasVip = pkg.vipLounge !== undefined ? pkg.vipLounge : getPackageBenefits(pkg.price, t).vipLounge;
                      return (
                        <td key={pkg._id} className="py-4">
                          <div className="flex justify-center">
                            {hasVip ? (
                              <span className="size-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Accompanying guests */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-4 font-bold text-gray-700">{t("packages.comparison.guests", { defaultValue: "Số khách đi kèm" })}</td>
                    {sortedPackages.map((pkg) => (
                      <td key={pkg._id} className="py-4 text-center font-semibold text-gray-900">
                        {pkg.guests || getPackageBenefits(pkg.price, t).guests}
                      </td>
                    ))}
                  </tr>

                  {/* Room Service */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-4 font-bold text-gray-700">{t("packages.comparison.room_service", { defaultValue: "Room Service" })}</td>
                    {sortedPackages.map((pkg) => {
                      const hasService = pkg.roomService !== undefined ? pkg.roomService : getPackageBenefits(pkg.price, t).roomService;
                      return (
                        <td key={pkg._id} className="py-4">
                          <div className="flex justify-center">
                            {hasService ? (
                              <span className="size-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Transportation */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-4 font-bold text-gray-700">{t("packages.comparison.transportation", { defaultValue: "Transportation" })}</td>
                    {sortedPackages.map((pkg) => {
                      const hasTrans = pkg.transportation !== undefined ? pkg.transportation : getPackageBenefits(pkg.price, t).transport;
                      return (
                        <td key={pkg._id} className="py-4">
                          <div className="flex justify-center">
                            {hasTrans ? (
                              <span className="size-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Service Savings */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-4 font-bold text-gray-700">{t("packages.comparison.savings", { defaultValue: "Mức tiết kiệm" })}</td>
                    {sortedPackages.map((pkg) => (
                      <td key={pkg._id} className="py-4 text-center font-semibold text-gray-900">
                        {pkg.savings || getPackageBenefits(pkg.price, t).savings}
                      </td>
                    ))}
                  </tr>

                  {/* Wellness & Fitness */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-4 font-bold text-gray-700">{t("packages.comparison.wellness", { defaultValue: "Wellness & Fitness" })}</td>
                    {sortedPackages.map((pkg) => {
                      const hasWell = pkg.wellness !== undefined ? pkg.wellness : getPackageBenefits(pkg.price, t).wellness;
                      return (
                        <td key={pkg._id} className="py-4">
                          <div className="flex justify-center">
                            {hasWell ? (
                              <span className="size-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Booking priority */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-4 font-bold text-gray-700">{t("packages.comparison.priority", { defaultValue: "Ưu tiên đặt chỗ" })}</td>
                    {sortedPackages.map((pkg) => {
                      const hasPrio = pkg.priority !== undefined ? pkg.priority : getPackageBenefits(pkg.price, t).priority;
                      return (
                        <td key={pkg._id} className="py-4">
                          <div className="flex justify-center">
                            {hasPrio ? (
                              <span className="size-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Personal Concierge */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-4 font-bold text-gray-700">{t("packages.comparison.concierge", { defaultValue: "Concierge cá nhân" })}</td>
                    {sortedPackages.map((pkg) => {
                      const hasConcierge = pkg.concierge !== undefined ? pkg.concierge : getPackageBenefits(pkg.price, t).concierge;
                      return (
                        <td key={pkg._id} className="py-4">
                          <div className="flex justify-center">
                            {hasConcierge ? (
                              <span className="size-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* CTA Row */}
                  <tr className="bg-gray-50/30">
                    <td className="py-4 pl-4 border-t border-gray-100" />
                    {sortedPackages.map((pkg) => {
                      const colors = getPackageColors(pkg.color);
                      return (
                        <td key={pkg._id} className="py-4 px-2 border-t border-gray-100">
                          <div className="flex justify-center">
                            <Button
                              onClick={() => handlePurchaseClick(pkg)}
                              className="text-white text-xs font-bold py-1 px-3 h-9 rounded-xl shadow-sm hover:opacity-90 active:scale-95 transition-all w-full max-w-[120px]"
                              style={{ backgroundColor: colors.primary }}
                            >
                              {t("packages.comparison.invest_now", { defaultValue: "Đầu tư ngay" })}
                            </Button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Investment Process */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black text-[#0d1f1d]">
            {t("packages.process.title", { defaultValue: "Quy trình đầu tư" })}
          </h3>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-4">
          {/* Step 1 */}
          <div className="flex-1 flex flex-col items-center text-center space-y-3 w-full">
            <div className="size-10 rounded-full bg-[#276152] text-white flex items-center justify-center font-bold text-sm shadow-md">
              1
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#111827]">
                {t("packages.process.step_1_title", { defaultValue: "Chọn gói đầu tư" })}
              </h4>
              <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed mx-auto">
                {t("packages.process.step_1_desc", { defaultValue: "Xem và so sánh quyền lợi của từng gói." })}
              </p>
            </div>
          </div>

          {/* Connector Line 1 */}
          <div className="hidden md:block w-16 h-[2px] bg-[#d9ede8] translate-y-5" />

          {/* Step 2 */}
          <div className="flex-1 flex flex-col items-center text-center space-y-3 w-full">
            <div className="size-10 rounded-full bg-[#276152] text-white flex items-center justify-center font-bold text-sm shadow-md">
              2
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#111827]">
                {t("packages.process.step_2_title", { defaultValue: "Xác nhận thông tin" })}
              </h4>
              <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed mx-auto">
                {t("packages.process.step_2_desc", { defaultValue: "Kiểm tra số tiền tham gia và số AQE dự kiến nhận được." })}
              </p>
            </div>
          </div>

          {/* Connector Line 2 */}
          <div className="hidden md:block w-16 h-[2px] bg-[#d9ede8] translate-y-5" />

          {/* Step 3 */}
          <div className="flex-1 flex flex-col items-center text-center space-y-3 w-full">
            <div className="size-10 rounded-full bg-[#276152] text-white flex items-center justify-center font-bold text-sm shadow-md">
              3
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#111827]">
                {t("packages.process.step_3_title", { defaultValue: "Thực hiện thanh toán" })}
              </h4>
              <p className="text-xs text-gray-500 max-w-[240px] leading-relaxed mx-auto">
                {t("packages.process.step_3_desc", { defaultValue: "Hoàn tất chuyển khoản USDT qua Blockchain hoặc quét mã QR Zelle." })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes Section */}
      <div className="bg-[#d9ede8]/40 border border-[#276152]/20 p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-[#1e4d40]">
          <ShieldCheck size={18} className="text-[#276152]" />
          <h4 className="font-bold text-sm">
            {t("packages.notes.title", { defaultValue: "Thông tin cần lưu ý" })}
          </h4>
        </div>
        
        <ul className="space-y-2.5 text-xs text-gray-700 font-medium">
          <li className="flex items-start gap-2">
            <span className="size-1.5 rounded-full bg-[#276152] mt-1.5 shrink-0" />
            <span>{t("packages.notes.item_1", { defaultValue: "Chương trình áp dụng từ 01/07 đến 30/09/2026." })}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="size-1.5 rounded-full bg-[#276152] mt-1.5 shrink-0" />
            <span>{t("packages.notes.item_3", { defaultValue: "Quyền lợi nghỉ dưỡng áp dụng theo điều khoản của từng gói." })}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="size-1.5 rounded-full bg-[#276152] mt-1.5 shrink-0" />
            <span>{t("packages.notes.item_4", { defaultValue: "Người dùng cần hoàn tất xác minh tài khoản trước khi đầu tư." })}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="size-1.5 rounded-full bg-[#276152] mt-1.5 shrink-0" />
            <span>{t("packages.notes.item_5", { defaultValue: "Các quyền lợi có thể phụ thuộc vào tình trạng phòng và lịch đặt chỗ." })}</span>
          </li>
        </ul>

        <div className="pt-2 border-t border-[#276152]/10">
          <a href="#" className="text-xs font-bold text-[#276152] hover:underline inline-flex items-center gap-1">
            {t("packages.notes.view_terms", { defaultValue: "Xem điều khoản và điều kiện →" })}
          </a>
        </div>
      </div>

      {/* KYC Block warning card if not verified */}
      {userProfile?.kycStatus !== 'verified' && (
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="size-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md">
              <UserCheck size={20} />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-amber-900">{t("packages.kyc_warning_title")}</p>
              <p className="text-xs text-amber-700 font-medium">
                {t("packages.kyc_warning_desc")}
              </p>
            </div>
          </div>
          <Link to="/settings?tab=kyc" className="w-full md:w-auto">
            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-6 shadow-sm">
              {t("packages.kyc_verify_btn")}
            </Button>
          </Link>
        </div>
      )}

      {/* Package Detail Modal */}
      {detailPackage && (() => {
        const benefits = getPackageBenefits(detailPackage.price, t)
        const displayStayDays = detailPackage.stayDays || benefits.stayDays
        const displayRoomType = detailPackage.roomType || benefits.roomType
        const displayGuests = detailPackage.guests || benefits.guests
        const displaySavings = detailPackage.savings || benefits.savings
        const hasWellness = detailPackage.wellness !== undefined ? detailPackage.wellness : benefits.wellness
        const benefitLabels = [
          { flag: detailPackage.vipLounge !== undefined ? detailPackage.vipLounge : benefits.vipLounge, label: t("packages.comparison.vip_lounge_desc") },
          { flag: detailPackage.roomService !== undefined ? detailPackage.roomService : benefits.roomService, label: t("packages.comparison.room_service_desc") },
          { flag: detailPackage.transportation !== undefined ? detailPackage.transportation : benefits.transport, label: t("packages.comparison.transportation_desc") },
          { flag: !!displaySavings, label: t("packages.comparison.savings_desc", { value: displaySavings }) },
          { flag: detailPackage.priority !== undefined ? detailPackage.priority : benefits.priority, label: t("packages.comparison.priority") },
          { flag: detailPackage.concierge !== undefined ? detailPackage.concierge : benefits.concierge, label: t("packages.comparison.concierge") },
        ].filter((b) => b.flag).map((b) => b.label)

        return (
          <PackageDetailModal
            title={detailPackage.title}
            imageUrl={detailPackage.imageUrl}
            badgeLabel={getSegmentLabel(detailPackage.segment)}
            investment={{ label: t("packages.invested_amount"), value: `$${detailPackage.price.toLocaleString()} USDT` }}
            aqeReceived={{ label: t("packages.aqe_received_label"), value: `${(detailPackage.aqeAmount * (1 + detailPackage.bonusPercent / 100)).toLocaleString()} AQE` }}
            aqeRequired={detailPackage.aqeRequired > 0 ? { label: t("packages.aqe_required_label"), value: `${detailPackage.aqeRequired.toLocaleString()} AQE` } : undefined}
            stay={{ label: t("packages.comparison.stay_days"), value: displayStayDays || "—" }}
            roomType={{ label: t("packages.comparison.room_type"), value: displayRoomType || "—" }}
            benefitsTitle={t("packages.included_benefits")}
            benefits={benefitLabels}
            guests={{ label: t("packages.comparison.guests"), value: displayGuests || "—" }}
            savings={{ label: t("packages.comparison.savings"), value: displaySavings || "—" }}
            wellness={{ label: t("packages.comparison.wellness"), value: hasWellness ? t("packages.included") : t("packages.not_included"), included: hasWellness }}
            closeLabel={t("packages.close_btn")}
            primaryLabel={t("packages.invest_now")}
            onClose={() => setDetailPackage(null)}
            onPrimaryClick={() => {
              const pkg = detailPackage
              setDetailPackage(null)
              handlePurchaseClick(pkg)
            }}
          />
        )
      })()}
      {/* Integration with Payment checkout Modal */}
      {selectedPackage && (
        <BlockchainPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false)
            setSelectedPackage(null)
            setModalStatus('idle')
          }}
          amount={selectedPackage.price}
          pledgeAmount={0}
          status={modalStatus}
          countryCode={userProfile?.countryCode}
          isDirectPurchase={true}
          packageId={selectedPackage._id}
        />
      )}

      {/* Buy AQE Modal (lẻ - không qua package) */}
      <BlockchainPaymentModal
        isOpen={isBuyModalOpen}
        onClose={() => {
          setIsBuyModalOpen(false)
          setBuyModalStatus('idle')
        }}
        amount={purchaseAmount}
        pledgeAmount={0}
        status={buyModalStatus}
        countryCode={userProfile?.countryCode}
        isDirectPurchase={true}
      />

      <PendingPaymentDialog
        pendingTransaction={awaitingPayment?.pendingTransaction}
        onCancelled={fetchInitialData}
      />

    </div>
  )
}
