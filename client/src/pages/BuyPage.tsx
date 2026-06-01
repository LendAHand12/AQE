import { useState, useEffect } from "react"
import {
  Coins,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Clock,
  ArrowRight,
  Link2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { BlockchainPaymentModal } from "@/components/BlockchainPaymentModal"
import { useSocket } from "@/providers/SocketProvider"

export default function BuyPage() {
  const { t } = useTranslation()
  const { socket } = useSocket()
  const [purchaseAmount, setPurchaseAmount] = useState<number>(0)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [awaitingPayment, setAwaitingPayment] = useState<any>(null)
  const [referralStats, setReferralStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isBlockchainModalOpen, setIsBlockchainModalOpen] = useState(false)
  const [modalStatus, setModalStatus] = useState<'idle' | 'success'>('idle')

  const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(t("pre_register.copied"))
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Listen for socket notifications to refresh data instantly
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: any) => {
      if (notification.type === 'PAYMENT') {
        console.log("Payment detected via socket, refreshing data...");
        fetchInitialData();
        setModalStatus('success');
      }
    };

    socket.on('new_notification', handleNotification);

    return () => {
      socket.off('new_notification', handleNotification);
    };
  }, [socket])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [profileRes, pledgeRes, referralRes] = await Promise.all([
        apiClient.get("/auth/profile"),
        apiClient.get("/payments/pledge"), // Contains user's legacy pledge & awaiting approval amounts
        apiClient.get("/auth/referrals")
      ])

      setUserProfile(profileRes.data)
      setAwaitingPayment(pledgeRes.data)
      setReferralStats(referralRes.data.summary)
    } catch (err) {
      console.error("Fetch Buy Page Initial Data Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handlePresetSelect = (amount: number) => {
    setPurchaseAmount(amount)
  }

  const handlePurchase = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (awaitingPayment?.awaitingApprovalAmount > 0) {
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

    setIsBlockchainModalOpen(true)
  }

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#276152]" />
    </div>
  )

  const isKycVerified = userProfile?.kycStatus === 'verified' || userProfile?.kycStatus === 'pending'

  // June Promotion check (Client side)
  const now = new Date()
  const isJune = now.getMonth() === 5 && now.getFullYear() === 2026 // 5 = June in JS Date

  const expectedAqe = purchaseAmount
  const bonusAqe = isJune ? purchaseAmount * 0.05 : 0
  const totalReceived = expectedAqe + bonusAqe

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20 flex flex-col items-center">
      <div className="w-full max-w-[520px] px-4 py-8 sm:py-12 space-y-6 animate-in fade-in duration-500">

        {/* Header Section */}
        <div className="space-y-1 text-center">
          <h1 className="text-[28px] font-black text-[#0d1f1d] leading-tight">
            {t("buy.title")}
          </h1>
          <p className="text-[14px] font-medium text-[#868f9e]">
            {t("buy.subtitle")}
          </p>
        </div>

        {/* Special Promotion Alert Card */}
        {isJune ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-[16px] p-4 flex items-start gap-3 shadow-sm">
            <div className="size-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-[0_2px_8px_rgba(16,185,129,0.15)]">
              <CheckCircle2 size={16} />
            </div>
            <div className="space-y-0.5">
              <p className="text-[15px] font-bold text-emerald-800">
                {t("buy.june_promo_banner")}
              </p>
              <p className="text-[13px] text-emerald-600">
                {t("buy.june_promo_desc")}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/50 border border-amber-100 rounded-[16px] p-4 flex items-start gap-3 shadow-sm">
            <div className="size-8 bg-amber-500 rounded-full flex items-center justify-center text-white shrink-0">
              <Calendar size={16} />
            </div>
            <div className="space-y-0.5">
              <p className="text-[15px] font-bold text-amber-800">
                {t("buy.upcoming_promo_title")}
              </p>
              <p className="text-[13px] text-amber-600">
                {t("buy.upcoming_promo_desc")}
              </p>
            </div>
          </div>
        )}

        {/* Main Action Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-[20px] shadow-[0px_15px_40px_rgba(0,0,0,0.02)] border border-gray-100 space-y-5">

          <div className="flex gap-2.5 items-center border-b border-gray-50 pb-3">
            <div className="size-8 bg-[#d9ede8] rounded-full flex items-center justify-center text-[#276152]">
              <Coins size={18} />
            </div>
            <h3 className="text-[16px] font-bold text-[#111827]">{t("buy.amount_label")}</h3>
          </div>

          {/* Amount input & warning */}
          <div className="space-y-3">
            <div className="relative group">
              <Input
                type="number"
                min={10}
                value={purchaseAmount === 0 ? "" : purchaseAmount}
                placeholder={t("buy.amount_placeholder")}
                onChange={(e) => setPurchaseAmount(e.target.value === "" ? 0 : Number(e.target.value))}
                className="h-11 pl-4 pr-16 border-[#d5d7db] rounded-[12px] focus:ring-1 focus:ring-[#276152] focus:border-[#276152] font-semibold text-sm text-[#0d1f1d] placeholder:text-gray-300"
              />
              <div className="absolute right-3 top-2 px-2.5 py-0.5 bg-gray-100 rounded-md text-[11px] font-bold text-[#717c8d]">
                USDT
              </div>
            </div>

            {purchaseAmount > 0 && purchaseAmount < 10 && (
              <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 pl-0.5">
                <ShieldAlert size={12} />
                {t("buy.min_warning")}
              </p>
            )}
          </div>

          {/* Presets Selection */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-0.5">{t("buy.select_amount")}</p>
            <div className="flex items-center gap-2">
              {[50, 100, 500, 1000].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handlePresetSelect(amount)}
                  className={cn(
                    "flex-1 py-1.5 h-8 rounded-[8px] font-bold text-xs border transition-all active:scale-[0.97]",
                    purchaseAmount === amount
                      ? "bg-[#276152] border-[#276152] text-white"
                      : "border-gray-100 bg-white text-gray-500 hover:border-gray-300"
                  )}
                >
                  {amount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic calculations card */}
          {purchaseAmount > 0 && (
            <div className="bg-gray-50/80 rounded-[12px] p-4 space-y-2.5 border border-gray-100/50 text-[13px]">
              <div className="flex justify-between items-center text-gray-500">
                <span>{t("buy.expected_label")}</span>
                <span className="font-bold text-gray-800">{expectedAqe.toLocaleString()} AQE</span>
              </div>
              {isJune && (
                <div className="flex justify-between items-center text-emerald-600">
                  <span>{t("buy.bonus_label")}</span>
                  <span className="font-bold">+{bonusAqe.toLocaleString()} AQE</span>
                </div>
              )}
              <div className="w-full h-[1px] bg-gray-200/50 my-0.5"></div>
              <div className="flex justify-between items-center text-sm font-extrabold text-[#0d1f1d]">
                <span>{t("buy.total_received")}</span>
                <span className="text-base text-[#276152]">{totalReceived.toLocaleString()} AQE</span>
              </div>
            </div>
          )}

          {/* Awaiting Admin approval warning */}
          {awaitingPayment?.awaitingApprovalAmount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-[12px] flex items-start gap-2.5">
              <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-[12px] text-amber-700 font-bold leading-none">
                  Awaiting manual approval
                </p>
                <p className="text-[10px] text-amber-600 font-medium">
                  {t("buy.pending_warning")}
                </p>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-1">
            {isKycVerified ? (
              <Button
                type="button"
                className="w-full h-11 bg-[#276152] hover:bg-[#1e4d41] text-white rounded-[12px] font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
                disabled={loading || purchaseAmount < 10 || awaitingPayment?.awaitingApprovalAmount > 0}
                onClick={handlePurchase}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> :
                  <>
                    <span>{t("buy.buy_btn")}</span>
                    <ArrowRight size={16} />
                  </>}
              </Button>
            ) : (
              <div className="space-y-2.5">
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-[12px] flex items-start gap-2">
                  <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-700 font-medium leading-relaxed">
                    {t("pre_register.kyc_verified_required")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 h-11 bg-gray-100 text-gray-400 rounded-[12px]" disabled>
                    {t("buy.buy_btn")}
                  </Button>
                  <Link to="/settings?tab=kyc" className="shrink-0">
                    <Button variant="outline" className="h-11 border-[#276152] text-[#276152] hover:bg-[#276152]/5 rounded-[12px] font-bold px-4 text-xs">
                      KYC
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Referral Card */}
        <div className="bg-white p-6 sm:p-8 rounded-[20px] shadow-[0px_15px_40px_rgba(0,0,0,0.02)] border border-gray-100 space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-150">
          <div className="flex gap-2.5 items-center border-b border-gray-50 pb-3">
            <div className="size-8 bg-[#d9ede8] rounded-full flex items-center justify-center text-[#276152]">
              <Link2 size={18} />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-[16px] font-bold text-[#111827]">{t("pre_register.ref_card_title")}</h3>
              <p className="text-[12px] font-medium text-[#868f9e]">{t("pre_register.ref_card_desc")}</p>
            </div>
          </div>

          <div className="flex gap-3 h-[44px]">
            <div className="flex-1 bg-[#efefef]/50 rounded-[12px] px-4 flex items-center relative group/link overflow-hidden border border-transparent">
              <span className="text-[13px] font-medium text-[#6b7280] truncate">
                {`${FRONTEND_URL?.replace(/^https?:\/\//, '')}/register?ref=${userProfile?.username || 'TN2024AQE'}`}
              </span>
              {(!userProfile || (userProfile.totalPaid || 0) < 10) && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-[12px] flex items-center justify-center">
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-tight">
                    {t("pre_register.referral_lock_msg")}
                  </span>
                </div>
              )}
            </div>
            <Button
              className="bg-[#276152] hover:bg-[#1e4d40] text-white rounded-[12px] px-5 h-full font-bold text-xs disabled:opacity-50 disabled:grayscale transition-all active:scale-[0.97]"
              disabled={!userProfile || (userProfile.totalPaid || 0) < 10}
              onClick={() => copyToClipboard(`${FRONTEND_URL}/register?ref=${userProfile?.username || 'TN2024AQE'}`)}
            >
              {t("pre_register.copy_btn")}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#efefef]/30 p-3.5 rounded-[12px] space-y-0.5 border border-gray-50/50">
              <p className="text-[12px] text-[#868f9e] font-medium">{t("pre_register.total_referrals")}</p>
              <p className="text-[18px] font-black text-[#276152]">{referralStats?.totalReferrals || 0}</p>
            </div>
            <div className="bg-[#efefef]/30 p-3.5 rounded-[12px] space-y-0.5 border border-gray-50/50">
              <p className="text-[12px] text-[#868f9e] font-medium">{t("pre_register.total_commission")}</p>
              <div className="flex items-baseline gap-0.5 text-[#276152]">
                <span className="text-[18px] font-black">{referralStats?.totalCommission || 0}</span>
                <span className="text-[11px] font-bold">USDT</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal integration */}
      <BlockchainPaymentModal
        isOpen={isBlockchainModalOpen}
        onClose={() => {
          setIsBlockchainModalOpen(false);
          setModalStatus('idle');
        }}
        amount={purchaseAmount}
        pledgeAmount={0}
        status={modalStatus}
        countryCode={userProfile?.countryCode}
        isDirectPurchase={true}
      />

    </div>
  )
}
