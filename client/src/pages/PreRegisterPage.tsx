import { useState, useEffect } from "react"
import { 
  Rocket,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Wallet,
  Calendar,
  Link2,
  Check,
  Smartphone,
  Mail,
  UserCheck,
  LogOut,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, useDisconnect } from 'wagmi'
import { transferUSDT } from "@/lib/payment"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

export default function PreRegisterPage() {
  const { t } = useTranslation()
  const [pledgeAmount, setPledgeAmount] = useState(0)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [pledge, setPledge] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [referralStats, setReferralStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  const { open } = useWeb3Modal()
  const { disconnect } = useDisconnect()
  const { address, isConnected } = useAccount()

  const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [pledgeRes, profileRes, referralRes] = await Promise.all([
        apiClient.get("/payments/pledge"),
        apiClient.get("/auth/profile"),
        apiClient.get("/auth/referrals")
      ])
      
      setPledge(pledgeRes.data)
      setUserProfile(profileRes.data)
      setReferralStats(referralRes.data.summary)
      
      if (pledgeRes.data) {
        setPledgeAmount(pledgeRes.data.pledgeUsdt)
        if (pledgeRes.data.paidUsdtPreRegister === 0) {
          setPaymentAmount(Math.round(pledgeRes.data.pledgeUsdt * 0.3))
        } else {
          setPaymentAmount(Math.max(1, pledgeRes.data.pledgeUsdt - pledgeRes.data.paidUsdtPreRegister))
        }
      }
    } catch (err) {
      console.error("Fetch Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleWalletConnect = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    open()
  }

  const handleWalletDisconnect = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    disconnect()
  }

  const handlePayment = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (userProfile?.kycStatus !== 'verified') {
      toast.error(t("pre_register.kyc_verified_required"))
      return
    }

    if (!isConnected) {
      toast.error(t("header.connect_wallet"))
      return
    }

    const isFirstRegistration = !pledge
    const isFirstPayment = !pledge || pledge.paidUsdtPreRegister === 0

    // Extra validation for first registration amount
    if (isFirstRegistration && pledgeAmount < 10) {
        toast.error(t("pre_register.reg_amount_min"))
        return
    }

    const minAmount = isFirstPayment ? (pledgeAmount * 0.3) : 1

    if (paymentAmount < minAmount) {
      toast.error(t("pre_register.pay_min_error", { min: minAmount.toLocaleString() }))
      return
    }

    setPaying(true)
    try {
      toast.info(t("pre_register.pay_confirm_toast"))
      
      const hash = await transferUSDT(paymentAmount.toString(), address as `0x${string}`)

      toast.success(t("pre_register.pay_sent_toast"))

      await apiClient.post("/payments/payment", { 
        hash, 
        amount: paymentAmount,
        pledgeAmount: !pledge ? pledgeAmount : undefined
      })

      toast.success(t("pre_register.pay_success"))
      fetchInitialData()
    } catch (err: any) {
      console.error("Payment Error:", err)
      const errorMsg = err.response?.data?.message || err.shortMessage || err.message || "pre_register.pay_failed";
      toast.error(t(errorMsg, err.response?.data || {}) as string);
    } finally {
      setPaying(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(t("pre_register.copied"))
  }

  const getActiveBonusStage = () => {
    let dateToCompare = new Date();
    
    if (pledge?.status === 'completed' && pledge.transactions?.length > 0) {
      const latestBuy = [...pledge.transactions]
        .filter((t: any) => t.type === 'BUY')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      if (latestBuy) {
        dateToCompare = new Date(latestBuy.createdAt);
      }
    }

    const may31 = new Date('2026-05-31T23:59:59+07:00');
    const june30 = new Date('2026-06-30T23:59:59+07:00');

    if (dateToCompare <= may31) return 'bonus_before';
    if (dateToCompare <= june30) return 'bonus_after';
    return 'bonus_late';
  }

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#276152]" />
    </div>
  )

  const isKycVerified = userProfile?.kycStatus === 'verified'
  const activeStage = getActiveBonusStage()

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      <div className="p-8 max-w-[1400px] mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="text-[36px] font-bold text-[#0d1f1d] leading-tight">
            {t("pre_register.title")}
          </h1>
          <p className="text-[18px] text-[#868f9e]">
            {t("pre_register.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_523px] gap-8 items-start relative">
          
          {/* Left Side Content */}
          <div className="space-y-8">
            
            {/* Hero Bar */}
            <div className="rounded-[16px] p-8 min-h-[285px] relative overflow-hidden flex flex-col justify-between" 
              style={{ background: "linear-gradient(90deg, #276152 0%, #1e4d40 100%)" }}>
              
              <div className="space-y-6 relative z-10">
                <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 backdrop-blur-sm border border-white/10">
                  <Calendar className="h-4 w-4 text-white" />
                  <span className="text-[13px] font-medium text-white">{t("pre_register.hero_badge")}</span>
                </div>
                
                <h2 className="text-[28px] font-bold text-white">
                  {t("pre_register.hero_title")}
                </h2>
                
                <div className="flex items-center gap-2 text-white/90">
                  <Calendar className="h-5 w-5 opacity-70" />
                  <span className="text-[15px]">{t("pre_register.hero_time")}</span>
                </div>
              </div>

              <div className="flex gap-4 relative z-10 mt-6">
                 <div className="bg-white/10 backdrop-blur-md rounded-[12px] p-4 min-w-[120px]">
                    <p className="text-[13px] text-white/70 mb-1">{t("pre_register.hero_min")}</p>
                    <p className="text-[20px] font-bold text-white">100 USDT</p>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md rounded-[12px] p-4 min-w-[120px]">
                    <p className="text-[13px] text-white/70 mb-1">{t("pre_register.hero_prepay")}</p>
                    <p className="text-[20px] font-bold text-white">30%</p>
                 </div>
              </div>

              <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none translate-x-10 translate-y-10">
                 <Rocket size={200} className="text-white rotate-12" />
              </div>
            </div>

            {/* Quyền lợi Info Section */}
            <div className="space-y-8">
               <h3 className="text-[18px] font-bold text-[#111827]">
                 {t("pre_register.benefits_title")}
               </h3>

               {/* Bonus List */}
               <div className="bg-white border border-[#efefef] rounded-[12px] p-6 space-y-4">
                  <p className="text-[16px] font-bold text-[#111827]">{t("pre_register.bonus_title")}</p>
                  <div className="space-y-2">
                    {[
                      { key: "bonus_before", value: "+10%", label: "bonus_before" },
                      { key: "bonus_after", value: "+5%", label: "bonus_after" },
                      { key: "bonus_late", value: "+0%", label: "bonus_late" }
                    ].map((item) => (
                      <div 
                        key={item.key} 
                        className={cn(
                          "flex items-center justify-between p-4 rounded-[12px] transition-colors",
                          activeStage === item.key 
                            ? "bg-[#276152] text-white" 
                            : "bg-[#efefef]/50 text-[#0d1f1d]"
                        )}
                      >
                        <span className="text-[16px] font-medium">{t(`pre_register.${item.label}`)}</span>
                        <span className={cn(
                          "text-[16px] font-bold",
                          activeStage === item.key ? "text-white" : "text-[#276152]"
                        )}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Referral Tiers */}
               <div className="bg-white border border-[#efefef] rounded-[12px] p-6 space-y-4">
                  <p className="text-[16px] font-bold text-[#111827]">{t("pre_register.referral_title")}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#efefef]/50 p-4 rounded-[12px] space-y-1">
                      <p className="text-[14px] text-[#868f9e]">{t("pre_register.f1_label")}</p>
                      <p className="text-[20px] font-bold text-[#276152]">8%</p>
                    </div>
                    <div className="bg-[#efefef]/50 p-4 rounded-[12px] space-y-1">
                      <p className="text-[14px] text-[#868f9e]">{t("pre_register.f2_label")}</p>
                      <p className="text-[20px] font-bold text-[#276152]">2%</p>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#6b7280]">
                    {t("pre_register.comm_note")}
                  </p>
               </div>

               {/* Warning Alert */}
               <div className="bg-[#f59e0b]/10 rounded-[12px] p-5 space-y-1 border border-[#f59e0b]/5">
                  <p className="text-[16px] font-bold text-[#d97706]">{t("pre_register.alert_title")}</p>
                  <p className="text-[13px] text-[#d97706] opacity-90">{t("pre_register.alert_desc")}</p>
               </div>

               {/* Progress KYC */}
               <div className="bg-white border border-[#efefef] rounded-[16px] p-6 space-y-4">
                  <p className="text-[16px] font-bold text-[#111827]">{t("settings.tabs.kyc")}</p>
                  <div className="space-y-2">
                    {[
                       { label: t("kyc.steps.step_1"), icon: UserCheck, verified: userProfile?.kycStatus === 'verified' },
                       { label: t("kyc.steps.step_2"), icon: Smartphone, verified: !!userProfile?.faceTecTid },
                       { label: t("kyc.steps.step_3"), icon: ShieldCheck, verified: userProfile?.isTwoFactorEnabled },
                       { label: "Email", icon: Mail, verified: userProfile?.isActive },
                       { label: "Wallet", icon: Wallet, verified: isConnected }
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3.5 border border-[#e5e7eb] rounded-[12px]">
                         <step.icon size={20} className={cn(step.verified ? "text-[#276152]" : "text-[#6b7280]")} />
                         <span className="text-[14px] font-medium text-[#6b7280]">{step.label}</span>
                         {step.verified && <Check size={16} className="ml-auto text-[#276152]" />}
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>

          {/* Right Column - Action Card */}
          <div className="xl:sticky xl:top-[137px] z-20">
            <div className="bg-white p-6 rounded-[16px] shadow-[0px_26px_27px_0px_rgba(0,0,0,0.03)] border border-gray-100 space-y-10">
              
              {/* Referral Section */}
              <div className="space-y-4">
                <div className="flex gap-3 items-center">
                   <div className="size-10 bg-[#d9ede8] rounded-full flex items-center justify-center">
                      <Link2 size={24} className="text-[#276152]" />
                   </div>
                   <div className="space-y-0.5">
                      <p className="text-[18px] font-bold text-[#111827]">{t("pre_register.ref_card_title")}</p>
                      <p className="text-[14px] text-[#6b7280]">{t("pre_register.ref_card_desc")}</p>
                   </div>
                </div>

                <div className="flex gap-3 h-[44px]">
                   <div className="flex-1 bg-[#efefef]/50 rounded-[12px] px-4 flex items-center relative group/link">
                      <span className="text-[14px] text-[#6b7280] truncate">{`${FRONTEND_URL.replace(/^https?:\/\//, '')}/register?ref=${userProfile?.username || 'TN2024AQE'}`}</span>
                      {(!pledge || pledge.pledgeUsdt === 0 || (pledge.paidUsdtPreRegister / pledge.pledgeUsdt) < 0.3) && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-[12px] flex items-center justify-center opacity-0 group-hover/link:opacity-100 transition-opacity">
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">Need ≥30% Payment to unlock</span>
                        </div>
                      )}
                   </div>
                   <Button 
                    className="bg-[#276152] hover:bg-[#1e4d40] text-white rounded-[12px] px-6 h-full font-medium disabled:opacity-50 disabled:grayscale transition-all"
                    disabled={!pledge || pledge.pledgeUsdt === 0 || (pledge.paidUsdtPreRegister / pledge.pledgeUsdt) < 0.3}
                    onClick={() => copyToClipboard(`${FRONTEND_URL}/register?ref=${userProfile?.username || 'TN2024AQE'}`)}
                   >
                     {t("pre_register.copy_btn")}
                   </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-[#efefef]/50 p-3.5 rounded-[12px] space-y-1">
                      <p className="text-[14px] text-[#6b7280]">{t("pre_register.total_referrals")}</p>
                      <p className="text-[20px] font-bold text-[#276152]">{referralStats?.totalReferrals || 0}</p>
                   </div>
                   <div className="bg-[#efefef]/50 p-3.5 rounded-[12px] space-y-1">
                      <p className="text-[14px] text-[#6b7280]">{t("pre_register.total_commission")}</p>
                      <div className="flex items-baseline gap-1 text-[#276152]">
                        <span className="text-[20px] font-bold">{referralStats?.totalCommission || 0}</span>
                        <span className="text-[14px] font-bold">USDT</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Registration Form */}
              <div className="space-y-4">
                 <div className="flex gap-3 items-center">
                   <div className="size-10 bg-[#d9ede8] rounded-full flex items-center justify-center">
                      <UserCheck size={20} className="text-[#276152]" />
                   </div>
                   <p className="text-[18px] font-bold text-[#111827]">{t("pre_register.reg_info_title")}</p>
                 </div>

                 {pledge?.status !== 'completed' && (
                    <div className="space-y-4 pt-2">
                       <div className="space-y-2.5">
                          <div className="flex justify-between items-center text-[14px]">
                             <span className="font-medium text-[#0d1f1d]">{t("pre_register.reg_amount_label")}</span>
                             <span className="text-[#868f9e]">{t("pre_register.reg_amount_min")}</span>
                          </div>
                          <div className="relative group">
                             <Input 
                               type="number"
                               min={100}
                               value={pledgeAmount === 0 ? "" : pledgeAmount}
                               placeholder="0"
                               disabled={pledge?.paidUsdtPreRegister > 0}
                               onChange={(e) => setPledgeAmount(e.target.value === "" ? 0 : Number(e.target.value))}
                               className="h-11 border-[#9ca3af] rounded-[8px] focus:ring-0 focus:border-[#276152] font-medium text-[#0d1f1d]"
                             />
                             <div className="absolute right-2 top-1.5 px-3 py-1 bg-[#efefef]/50 rounded-[5px] text-[13.33px] font-semibold text-[#717c8d]">
                                USDT
                             </div>
                          </div>
                       </div>

                       <div className="space-y-2.5">
                          <div className="flex justify-between items-center text-[14px]">
                             <span className="font-medium text-[#0d1f1d]">{t("pre_register.reg_initial_label")}</span>
                             <span className="text-[#868f9e]">{t("pre_register.reg_initial_hint")}</span>
                          </div>
                          <div className="relative group">
                             <Input 
                               type="number"
                               value={paymentAmount === 0 ? "" : paymentAmount}
                               placeholder="0"
                               onChange={(e) => setPaymentAmount(e.target.value === "" ? 0 : Number(e.target.value))}
                               className="h-11 border-[#9ca3af] rounded-[8px] focus:ring-0 focus:border-[#276152] font-medium text-[#0d1f1d]"
                             />
                             <div className="absolute right-2 top-1.5 px-3 py-1 bg-[#efefef]/50 rounded-[5px] text-[13.33px] font-semibold text-[#717c8d]">
                                USDT
                             </div>
                          </div>
                          {pledge?.paidUsdtPreRegister === 0 && (
                           <p className="text-[11px] text-amber-600 font-medium">
                             {t("pre_register.pay_min_error", { min: (pledge.pledgeUsdt * 0.3).toLocaleString() })}
                           </p>
                         )}
                       </div>

                       {/* Wallet Section (Explicit Actions) */}
                       <div className="bg-[#efefef]/30 p-4 rounded-[12px] border border-[#efefef] space-y-3 mt-4">
                         <div className="flex items-center justify-between">
                           <p className="text-[14px] font-bold text-[#0d1f1d]">{t("header.connect_wallet")}</p>
                           {isConnected && (
                             <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 gap-1 px-2 py-0.5">
                               <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                               Connected
                             </Badge>
                           )}
                         </div>
                         
                         {!isConnected ? (
                           <Button 
                             type="button"
                             onClick={handleWalletConnect}
                             className="w-full h-11 bg-white hover:bg-gray-50 text-[#0d1f1d] border border-gray-200 rounded-[10px] shadow-sm flex items-center justify-center gap-2 font-semibold"
                           >
                               <Wallet size={18} className="text-[#276152]" />
                               {t("header.connect_wallet")}
                           </Button>
                         ) : (
                           <div className="flex gap-2">
                               <div className="flex-1 h-11 bg-white border border-gray-100 rounded-[10px] px-3 flex items-center gap-2 overflow-hidden">
                                  <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
                                  <span className="text-[13px] font-mono text-[#4b5563] truncate">
                                    {address ? `${address.slice(0, 6)}...${address.slice(-6)}` : ''}
                                  </span>
                               </div>
                               <Button 
                                 type="button"
                                 variant="ghost" 
                                 onClick={handleWalletConnect}
                                 className="size-11 p-0 rounded-[10px] bg-white border border-gray-100 hover:bg-gray-50 text-gray-400"
                               >
                                  <RefreshCw size={18} />
                               </Button>
                               <Button 
                                 type="button"
                                 variant="ghost" 
                                 onClick={handleWalletDisconnect}
                                 className="size-11 p-0 rounded-[10px] bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-500"
                               >
                                  <LogOut size={18} />
                               </Button>
                           </div>
                         )}
                       </div>
                    </div>
                 )}

                 <div className="flex gap-3 pt-4">
                    {isKycVerified ? (
                      <div className="flex-1 space-y-3">
                         {pledge?.status === 'completed' ? (
                            <div className="space-y-4">
                              {pledge?.paidUsdtPreRegister > 0 && (
                                 <div className="p-4 bg-[#efefef]/50 rounded-[16px] grid grid-cols-3 gap-1 mb-4 w-full">
                                   <div className="flex flex-col items-center border-r border-[#000]/5 last:border-0 px-1">
                                     <p className="text-[12px] text-[#636d7d] font-normal mb-1 whitespace-nowrap">{t("pre_register.summary_total")}</p>
                                     <p className="text-[14px] text-[#0d1f1d] font-bold tracking-tight">
                                       {pledge.pledgeUsdt.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                                     </p>
                                   </div>
                                   <div className="flex flex-col items-center border-r border-[#000]/5 last:border-0 px-1">
                                     <p className="text-[12px] text-[#636d7d] font-normal mb-1 whitespace-nowrap">{t("pre_register.summary_paid")}</p>
                                     <p className="text-[14px] text-[#0d1f1d] font-bold tracking-tight">
                                       {pledge.paidUsdtPreRegister.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                                     </p>
                                   </div>
                                   <div className="flex flex-col items-center px-1">
                                     <p className="text-[12px] text-[#636d7d] font-normal mb-1 whitespace-nowrap">{t("pre_register.summary_remaining")}</p>
                                     <p className="text-[14px] text-[#ef4444] font-bold tracking-tight">
                                       {Math.max(0, pledge.pledgeUsdt - pledge.paidUsdtPreRegister).toLocaleString('en-US', { minimumFractionDigits: 1 })}
                                     </p>
                                   </div>
                                 </div>
                              )}
                              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-[12px] flex items-start gap-3">
                                <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-[14px] text-emerald-700 font-medium leading-relaxed">
                                  {t("pre_register.pay_completed_msg")}
                                </p>
                              </div>
                              <Button className="w-full h-11 bg-emerald-500 text-white rounded-[12px] font-bold" disabled>
                                 <CheckCircle2 size={18} className="mr-2" />
                                 {t("pre_register.pay_success")}
                              </Button>
                            </div>
                         ) : (
                            <div className="space-y-3">
                              {pledge?.paidUsdtPreRegister > 0 && (
                                 <div className="p-4 bg-[#efefef]/50 rounded-[16px] grid grid-cols-3 gap-1 mb-5 w-full">
                                   <div className="flex flex-col items-center border-r border-[#000]/5 last:border-0 px-1">
                                     <p className="text-[12px] text-[#636d7d] font-normal mb-1 whitespace-nowrap">{t("pre_register.summary_total")}</p>
                                     <p className="text-[14px] text-[#0d1f1d] font-bold tracking-tight">
                                       {pledge.pledgeUsdt.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                                     </p>
                                   </div>
                                   <div className="flex flex-col items-center border-r border-[#000]/5 last:border-0 px-1">
                                     <p className="text-[12px] text-[#636d7d] font-normal mb-1 whitespace-nowrap">{t("pre_register.summary_paid")}</p>
                                     <p className="text-[14px] text-[#0d1f1d] font-bold tracking-tight">
                                       {pledge.paidUsdtPreRegister.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                                     </p>
                                   </div>
                                   <div className="flex flex-col items-center px-1">
                                     <p className="text-[12px] text-[#636d7d] font-normal mb-1 whitespace-nowrap">{t("pre_register.summary_remaining")}</p>
                                     <p className="text-[14px] text-[#ef4444] font-bold tracking-tight">
                                       {Math.max(0, pledge.pledgeUsdt - pledge.paidUsdtPreRegister).toLocaleString('en-US', { minimumFractionDigits: 1 })}
                                     </p>
                                   </div>
                                 </div>
                              )}
                              <Button 
                                type="button"
                                className="w-full h-11 bg-[#276152] hover:bg-[#1e4d40] text-white rounded-[12px] font-bold flex items-center justify-center gap-2"
                                disabled={paying || !isConnected}
                                onClick={handlePayment}
                              >
                                {paying ? <Loader2 size={18} className="animate-spin" /> : 
                                 <>
                                   <Rocket size={18} />
                                   <span>{(!pledge || pledge?.paidUsdtPreRegister === 0) ? t("pre_register.confirm_payment_btn") : t("pre_register.pay_now")}</span>
                                 </>}
                              </Button>
                              {!isConnected && (
                                <p className="text-[11px] text-amber-600 font-medium text-center italic">
                                  * {t("pre_register.connect_to_pay_hint") || "Vui lòng kết nối ví để thanh toán"}
                                </p>
                              )}
                            </div>
                         )}
                      </div>
                    ) : (
                      <div className="w-full space-y-3">
                         <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2.5">
                            <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                              {t("pre_register.kyc_verified_required")}
                            </p>
                         </div>
                         <div className="flex gap-3">
                            <Button className="flex-1 h-[44px] bg-gray-100 text-gray-400 rounded-[12px]" disabled>
                              {(!pledge || pledge?.paidUsdtPreRegister === 0) ? t("pre_register.confirm_payment_btn") : t("pre_register.pay_now")}
                            </Button>
                            <Link to="/settings?tab=kyc" className="shrink-0">
                              <Button variant="outline" className="h-[44px] border-[#276152] text-[#276152] hover:bg-[#276152]/5 rounded-[12px] font-medium">
                                {t("pre_register.kyc_btn")}
                              </Button>
                            </Link>
                         </div>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
