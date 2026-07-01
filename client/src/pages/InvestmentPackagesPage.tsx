import { useState, useEffect } from "react"
import {
  Coins,
  Loader2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  UserCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { BlockchainPaymentModal } from "@/components/BlockchainPaymentModal"
import { useSocket } from "@/providers/SocketProvider"
import { useTranslation } from "react-i18next"

interface Package {
  _id: string
  title: string
  price: number
  description: string
  bonusPercent: number
  segment: "Cơ bản" | "Nâng cao" | "Cao cấp"
  aqeAmount: number
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
  
  const [packages, setPackages] = useState<Package[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSegment, setSelectedSegment] = useState<string>("Tất cả")
  
  // Checkout Modal States
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [modalStatus, setModalStatus] = useState<'idle' | 'success'>('idle')
  
  // Detail Modal States
  const [detailPackage, setDetailPackage] = useState<Package | null>(null)

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
      const [profileRes, packagesRes] = await Promise.all([
        apiClient.get("/auth/profile"),
        apiClient.get("/payments/packages")
      ])
      setUserProfile(profileRes.data)
      setPackages(packagesRes.data)
    } catch (err) {
      console.error("Fetch Investment Packages error:", err)
      toast.error(t("packages.fetch_error", { defaultValue: "Không thể tải thông tin gói đầu tư" }))
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseClick = (pkg: Package) => {
    if (userProfile?.kycStatus !== 'verified' && userProfile?.kycStatus !== 'pending') {
      toast.error(t("kyc.errors.step_locked", { defaultValue: "Vui lòng hoàn tất xác minh KYC trước khi tham gia đầu tư" }))
      return
    }

    setSelectedPackage(pkg)
    setModalStatus('idle')
    setIsPaymentModalOpen(true)
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
      <div className="flex justify-between items-start pt-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[#0d1f1d] leading-none tracking-tight">
            {t("packages.title")}
          </h1>
          <p className="text-sm text-gray-500 font-medium max-w-xl">
            {t("packages.subtitle")}
          </p>
        </div>
        <Link to="/payment-history">
          <Button variant="outline" className="border-[#276152] text-[#276152] hover:bg-[#d9ede8]/20 font-bold rounded-xl text-xs gap-1.5 h-9">
            <Clock size={14} />
            <span>{t("packages.view_history")}</span>
          </Button>
        </Link>
      </div>

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
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-1.5">
            <Coins size={14} className="text-emerald-300" />
            <span>{t("packages.rate_label")}</span>
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
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
        {segments.map((seg) => (
          <button
            key={seg}
            onClick={() => setSelectedSegment(seg)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
              selectedSegment === seg
                ? "bg-[#276152] text-white shadow-sm"
                : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800 border border-gray-100"
            )}
          >
            {getSegmentLabel(seg)}
          </button>
        ))}
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredPackages.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 font-bold bg-white rounded-3xl border border-gray-150 shadow-sm">
            {t("packages.empty_packages")}
          </div>
        ) : (
          filteredPackages.map((pkg) => {
            const finalAqe = pkg.aqeAmount * (1 + pkg.bonusPercent / 100)
            const colors = getPackageColors(pkg.color)
            return (
              <div key={pkg._id} className="rounded-3xl border border-gray-150 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between" style={{ backgroundColor: colors.bgCard }}>
                <div className="p-6 space-y-6">
                  {/* Category label & Title */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: colors.primary }}>
                        {getSegmentLabel(pkg.segment)}
                      </span>
                      {pkg.bonusPercent > 0 && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ color: colors.primary, backgroundColor: colors.badgeBg }}>
                          +{pkg.bonusPercent}% Bonus
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-[#0d1f1d]">{pkg.title}</h3>
                  </div>

                  {/* Pricing and AQE details */}
                  <div className="p-5 rounded-2xl space-y-3 border" style={{ backgroundColor: colors.bgBox, borderColor: colors.border }}>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{t("packages.invest_with")}</span>
                      <p className="text-2xl font-black" style={{ color: colors.primary }}>${pkg.price.toLocaleString()} USDT</p>
                    </div>
                    <div className="h-[1px]" style={{ backgroundColor: colors.border }} />
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                      <span className="text-gray-500 font-medium">{t("packages.aqe_received")}</span>
                      <span className="font-extrabold text-[#0d1f1d]">{finalAqe.toLocaleString()} AQE</span>
                    </div>
                  </div>

                  {/* Brief description snippet */}
                  <p className="text-xs text-gray-500 leading-relaxed font-medium line-clamp-3">
                    {pkg.description}
                  </p>
                </div>

                {/* Bottom CTA Actions */}
                <div className="p-6 pt-0 space-y-2.5">
                  <Button
                    onClick={() => handlePurchaseClick(pkg)}
                    className="w-full h-11 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all duration-300 hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <span>{t("packages.participate_now")}</span>
                    <ArrowRight size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDetailPackage(pkg)}
                    className="w-full h-11 rounded-xl font-bold transition-all border"
                    style={{ borderColor: colors.primary, color: colors.primary, backgroundColor: 'transparent' }}
                  >
                    {t("packages.view_details")}
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Benefit Comparison Section */}
      {packages.length > 0 && (
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6 overflow-hidden">
          <div>
            <h3 className="text-lg font-black text-[#0d1f1d]">
              {t("packages.comparison.title", { defaultValue: "So sánh quyền lợi các gói" })}
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {t("packages.comparison.subtitle", { defaultValue: "Xem chi tiết các đặc quyền nghỉ dưỡng đi kèm với từng cấp độ đầu tư." })}
            </p>
          </div>

          <div className="overflow-x-auto">
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
            <span>{t("packages.notes.item_2", { defaultValue: "Tỷ lệ niêm yết từ ngày 01/07/2026 là 1 AQE = 1.02 USDT." })}</span>
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

      {/* Detail Privileges Modal */}
      {detailPackage && (() => {
        const modalColors = getPackageColors(detailPackage.color)
        return (
          <div className="fixed inset-0 bg-[#0d1f1d]/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl border border-gray-150 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ color: modalColors.primary, backgroundColor: modalColors.badgeBg }}>
                      {getSegmentLabel(detailPackage.segment)}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-[#0d1f1d]">{detailPackage.title}</h2>
                </div>
                <span className="text-sm font-black px-3 py-1 rounded-full" style={{ color: modalColors.primary, backgroundColor: modalColors.badgeBg }}>
                  ${detailPackage.price.toLocaleString()} USDT
                </span>
              </div>

              <div className="space-y-5">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-500 leading-relaxed whitespace-pre-line">
                  {detailPackage.description}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                  <div className="p-4 rounded-xl border" style={{ backgroundColor: modalColors.bgBox, borderColor: modalColors.border }}>
                    <p className="text-gray-400 uppercase tracking-wider text-[9px] mb-1">{t("packages.aqe_amount_label")}</p>
                    <p className="text-lg font-black" style={{ color: modalColors.primary }}>{(detailPackage.aqeAmount * (1 + detailPackage.bonusPercent/100)).toLocaleString()} AQE</p>
                  </div>
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                    <p className="text-gray-400 uppercase tracking-wider text-[9px] mb-1">{t("packages.referral_commission")}</p>
                    <p className="text-xs text-blue-800 font-extrabold mt-1">
                      F1: {detailPackage.f1CommissionPercent}% | F2: {detailPackage.f2CommissionPercent}%
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <Button variant="outline" onClick={() => setDetailPackage(null)} className="rounded-xl font-bold">
                    {t("packages.close_btn")}
                  </Button>
                  <Button
                    onClick={() => {
                      const pkg = detailPackage
                      setDetailPackage(null)
                      handlePurchaseClick(pkg)
                    }}
                    className="text-white rounded-xl font-bold px-6"
                    style={{ backgroundColor: modalColors.primary }}
                  >
                    {t("packages.invest_now")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
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

    </div>
  )
}
