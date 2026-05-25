import { useState, useEffect } from "react"
import {
  Loader2,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Receipt,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/providers/AuthProvider"
import apiClient from "@/lib/axios"
import dayjs from "dayjs"
import { cn } from "@/lib/utils"
import { Pagination } from "@/components/common/Pagination"

export default function AssetsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, syncProfile } = useAuth()
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [fetching, setFetching] = useState(false)
  const [summary, setSummary] = useState<any>({
    usdtBalance: 0,
    officialAQE: 0,
    temporaryAQE: 0,
  })
  const [interestInfo, setInterestInfo] = useState<any>({
    provisionalAqeInterest: 0,
    claimableAqeInterest: 0,
    firstPaymentDate: null
  })
  const [claimingInterest, setClaimingInterest] = useState(false)

  // Withdrawal Modal State
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'ZELLE'>(user?.countryCode === '+1' && !user?.walletAddress ? 'ZELLE' : 'WALLET')
  const [zelleInfo, setZelleInfo] = useState('')
  const [zelleName, setZelleName] = useState('')

  useEffect(() => {
    fetchData()
    syncProfile()
  }, [page])

  const fetchData = async () => {
    if (page === 1) setLoading(true)
    else setFetching(true)
    try {
      const historyRes = await apiClient.get(`/withdrawals/my-history?page=${page}&limit=10`)
      setHistory(historyRes.data.history)
      setTotalPages(historyRes.data.pages)
      setTotalItems(historyRes.data.total)
      
      const summaryRes = await apiClient.get(`/payments/my-balance-history?limit=0`)
      setSummary(summaryRes.data.summary)

      const interestRes = await apiClient.get(`/interest/info`)
      setInterestInfo(interestRes.data)
    } catch (err) {
      console.error("Fetch Error:", err)
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }
  const handleWithdraw = async () => {
    if (paymentMethod === 'WALLET' && !user?.walletAddress) {
      toast.error(t("assets.withdraw_dialog.no_wallet_title"));
      return;
    }

    if (paymentMethod === 'ZELLE') {
      if (!zelleName) {
        toast.error(t("assets.withdraw_dialog.zelle_name_placeholder"));
        return;
      }
      if (!zelleInfo) {
        toast.error(t("assets.withdraw_dialog.zelle_info_placeholder"));
        return;
      }
    }

    const currentBalance = summary.usdtBalance;
    const fee = 1.0;
    const withdrawable = currentBalance - fee;

    if (withdrawable < 10) {
      toast.error(t("assets.withdraw_dialog.insufficient_balance"));
      return;
    }

    setWithdrawing(true);
    try {
      const res = await apiClient.post("/withdrawals/request", {
        walletAddress: paymentMethod === 'WALLET' ? user?.walletAddress : undefined,
        zelleInfo: paymentMethod === 'ZELLE' ? zelleInfo : undefined,
        zelleName: paymentMethod === 'ZELLE' ? zelleName : undefined,
        paymentMethod: paymentMethod
      });

      if (res.data.url) {
        window.location.href = res.data.url;
        return;
      }

      toast.success(res.data.message);
      setIsWithdrawOpen(false);
      fetchData();
      syncProfile();
    } catch (err: any) {
      toast.error(t(err.response?.data?.message) || t("auth.errors.unknown"));
    } finally {
      setWithdrawing(false);
    }
  };

  const handleClaimInterest = async () => {
    if (interestInfo.claimableAqeInterest <= 0) {
      toast.error(t("assets.interest.no_claimable", "Không có lãi để nhận (No claimable interest)"));
      return;
    }

    setClaimingInterest(true);
    try {
      const res = await apiClient.post("/interest/claim");
      toast.success(res.data.message);
      fetchData();
      syncProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("auth.errors.unknown"));
    } finally {
      setClaimingInterest(false);
    }
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#276152]" />
    </div>
  )

  const hasWallet = !!user?.walletAddress;
  const canUseZelle = user?.countryCode === '+1';
  const currentBalance = summary.usdtBalance;
  const fee = 1.0;
  const receiveAmount = Math.max(0, currentBalance - fee);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 font-sans pb-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-[36px] font-bold text-[#111827] tracking-tight">
            {t("assets.title")}
          </h1>
          <p className="text-[#636D7D] text-[16px]">
            {t("assets.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsWithdrawOpen(true)}
            className="h-[52px] px-8 bg-[#276152] hover:bg-[#1e4d40] text-white rounded-[16px] font-bold gap-2 shadow-lg shadow-[#276152]/20"
          >
            <ArrowUpRight size={20} />
            {t("assets.withdraw_btn")}
          </Button>
        </div>
      </div>

      {/* Asset Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[24px] border-none shadow-sm overflow-hidden bg-gradient-to-br from-[#276152] to-[#1e4d40] text-white p-6 relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet size={120} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-white/20 flex items-center justify-center">
                <CreditCard size={20} />
              </div>
              <span className="text-[14px] font-bold uppercase tracking-wider opacity-80">{t("assets.usdt_available")}</span>
            </div>
            <div className="space-y-1">
              <p className="text-[40px] font-black tracking-tight">
                {summary.usdtBalance.toLocaleString()} <span className="text-[20px] font-bold opacity-60 ml-1">USDT</span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[24px] border-none shadow-sm overflow-hidden bg-white p-6 relative border border-gray-100">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-[#276152]">
            <ShieldCheck size={120} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-[#276152]/10 flex items-center justify-center text-[#276152]">
                <ShieldCheck size={20} />
              </div>
              <span className="text-[14px] font-bold uppercase tracking-wider text-gray-500">{t("assets.aqe_total")}</span>
            </div>
            <div className="space-y-1">
              <p className="text-[40px] font-black tracking-tight text-[#111827]">
                {summary.officialAQE.toLocaleString()} <span className="text-[20px] font-bold text-gray-400 ml-1">AQE</span>
              </p>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-full bg-[#276152]/5 text-[#276152] border-none px-3 py-1 font-bold">
                  {summary.officialAQE.toLocaleString()} Official
                </Badge>
                <Badge variant="outline" className="rounded-full bg-amber-50 text-amber-600 border-none px-3 py-1 font-bold">
                  +{summary.temporaryAQE.toLocaleString()} Estimated
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* AQE Interest Card */}
        <Card className="rounded-[24px] border-none shadow-sm overflow-hidden bg-white p-6 relative border border-gray-100 flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-amber-500">
            <ShieldCheck size={120} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                  <ArrowUpRight size={20} />
                </div>
                <span className="text-[14px] font-bold uppercase tracking-wider text-gray-500">{t("assets.interest.title", "AQE Interest")}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[32px] font-black tracking-tight text-[#111827]">
                {interestInfo.claimableAqeInterest.toFixed(2)} <span className="text-[16px] font-bold text-gray-400 ml-1">AQE</span>
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-500">{t("assets.interest.provisional", "Provisional")}</span>
                  <span className="font-bold text-[#276152]">+{interestInfo.provisionalAqeInterest.toFixed(2)} AQE</span>
                </div>
              </div>
            </div>
          </div>
          <Button
            onClick={handleClaimInterest}
            disabled={claimingInterest || interestInfo.claimableAqeInterest <= 0}
            className="w-full mt-4 h-[44px] bg-amber-500 hover:bg-amber-600 text-white rounded-[12px] font-bold shadow-sm disabled:opacity-50"
          >
            {claimingInterest ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t("assets.interest.claim_btn", "Claim to USDT")}
          </Button>
        </Card>
      </div>

      <div className="space-y-6">
        <h3 className="text-[20px] font-bold text-[#111827]">{t("assets.withdraw_history")}</h3>

        <div className="bg-white border border-[#EFEFEF] rounded-[24px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#EFEFEF]/50">
                  <th className="px-6 py-4 text-[12px] font-bold text-[#276152] uppercase tracking-wider">{t("assets.table.time")}</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#276152] uppercase tracking-wider">{t("assets.table.recipient_info")}</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#276152] uppercase tracking-wider text-right">{t("assets.table.amount")}</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#276152] uppercase tracking-wider text-right">{t("assets.table.fee")}</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#276152] uppercase tracking-wider">{t("assets.table.hash")}</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#276152] uppercase tracking-wider text-center">{t("assets.table.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFEF]">
                {history.length > 0 ? (
                  history.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-[#111827]">
                            {dayjs(item.createdAt).format("DD/MM/YYYY")}
                          </span>
                          <span className="text-[12px] text-[#868F9E]">
                            {dayjs(item.createdAt).format("HH:mm:ss")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {item.paymentMethod === 'ZELLE' ? (
                           <div className="flex flex-col">
                             <span className="text-[13px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full w-fit">Zelle</span>
                             <span className="text-[14px] font-medium text-[#111827] mt-1">{item.zelleName || "N/A"}</span>
                             <span className="text-[12px] text-gray-500">{item.zelleInfo}</span>
                           </div>
                        ) : (
                           <p className="text-[14px] text-[#111827] font-mono font-medium">
                             {item.walletAddress ? `${item.walletAddress.substring(0, 6)}...${item.walletAddress.substring(item.walletAddress.length - 4)}` : "-"}
                           </p>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <span className="text-[14px] font-bold text-[#EF4444]">
                          -{item.amount.toLocaleString()} USDT
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap text-[14px] font-bold text-[#0D1F1D]">
                        {item.fee ? item.fee.toLocaleString() : "0"} USDT
                      </td>
                      <td className="px-6 py-5">
                        {item.hash ? (
                          <a 
                            href={`https://bscscan.com/tx/${item.hash}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[12px] text-[#276152] hover:underline font-mono"
                          >
                            {item.hash.substring(0, 10)}...
                          </a>
                        ) : (
                          <span className="text-[12px] text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <div className={cn(
                            "rounded-full px-3 py-1 flex items-center gap-2 text-[11px] font-bold",
                            item.status === 'SUCCESS' ? "bg-[#D1FAE5] text-[#065F46]" : 
                            item.status === 'FAILED' ? "bg-red-100 text-red-700" :
                            "bg-[#FEF3C7] text-[#92400E]"
                          )}>
                            {item.status === 'PENDING' && <div className="size-1.5 rounded-full bg-[#D97706] animate-pulse" />}
                            {item.status === 'SUCCESS' ? t("assets.status.success") : 
                             item.status === 'FAILED' ? t("assets.status.failed") :
                             t("assets.status.pending")}
                          </div>
                          {item.status === 'FAILED' && item.adminNote && (
                            <p className="text-[10px] text-red-500 mt-1.5 font-medium max-w-[150px] leading-tight text-center italic">
                              Lý do: {item.adminNote}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-[#868F9E]">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <Receipt size={64} />
                        <p className="text-[18px] font-medium">{t("assets.empty_history")}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setPage}
          disabled={fetching}
        />
      </div>

      {/* Withdrawal Dialog - Simple Confirmation Only */}
      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent className="max-w-md rounded-[24px] p-8 border-none shadow-2xl">
            <div className="space-y-6">
            <DialogHeader className="space-y-1">
                <DialogTitle className="text-[24px] font-bold text-gray-900">{t("assets.withdraw_dialog.title")}</DialogTitle>
                <DialogDescription className="text-[14px] text-gray-500">{t("assets.withdraw_dialog.desc")}</DialogDescription>
            </DialogHeader>

              <div className="space-y-4">
                {/* Method Selection */}
                <div className={cn("grid gap-2 p-1.5 bg-gray-100 rounded-[16px]", canUseZelle ? "grid-cols-2" : "grid-cols-1")}>
                  <button
                    disabled={!hasWallet}
                    onClick={() => setPaymentMethod('WALLET')}
                    className={cn(
                      "py-2.5 text-[13px] font-bold rounded-[12px] transition-all",
                      paymentMethod === 'WALLET' ? "bg-white text-[#276152] shadow-sm" : "text-gray-500",
                      !hasWallet && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {t("assets.withdraw_dialog.method_wallet")}
                  </button>
                  {canUseZelle && (
                    <button
                      onClick={() => setPaymentMethod('ZELLE')}
                      className={cn(
                        "py-2.5 text-[13px] font-bold rounded-[12px] transition-all",
                        paymentMethod === 'ZELLE' ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"
                      )}
                    >
                      {t("assets.withdraw_dialog.method_zelle")}
                    </button>
                  )}
                </div>

                {!hasWallet && paymentMethod === 'WALLET' && (
                   <p className="text-[11px] text-red-500 font-bold px-1">
                     {t("assets.withdraw_dialog.no_wallet_desc")} 
                     <span onClick={() => navigate("/settings")} className="underline cursor-pointer ml-1">{t("assets.withdraw_dialog.go_to_settings")}</span>
                   </p>
                )}

                {/* Destination Info */}
                {paymentMethod === 'WALLET' ? (
                  <div className="p-4 bg-emerald-50/50 rounded-[16px] border border-emerald-100/50">
                      <p className="text-[12px] text-emerald-700/60 font-bold uppercase tracking-wider mb-1">{t("assets.withdraw_dialog.wallet_label")}</p>
                      <p className="text-[14px] font-mono font-bold text-[#276152] break-all">{user?.walletAddress}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-[12px] font-bold text-gray-700 uppercase tracking-wider pl-1">{t("assets.withdraw_dialog.zelle_name_label")}</p>
                        <Input 
                            value={zelleName}
                            onChange={(e) => setZelleName(e.target.value)}
                            placeholder={t("assets.withdraw_dialog.zelle_name_placeholder")}
                            className="h-[52px] rounded-[16px] border-gray-200 focus:ring-[#276152] font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[12px] font-bold text-gray-700 uppercase tracking-wider pl-1">{t("assets.withdraw_dialog.zelle_info_label")}</p>
                        <Input 
                            value={zelleInfo}
                            onChange={(e) => setZelleInfo(e.target.value)}
                            placeholder={t("assets.withdraw_dialog.zelle_info_placeholder")}
                            className="h-[52px] rounded-[16px] border-gray-200 focus:ring-[#276152] font-medium"
                        />
                      </div>
                  </div>
                )}

                <div className="p-5 rounded-[20px] bg-gray-50 border border-gray-100 space-y-4">
                  <div className="flex justify-between text-[14px]">
                    <span className="text-gray-500">{t("assets.withdraw_dialog.amount_label")}</span>
                    <span className="font-bold text-gray-900">{currentBalance.toLocaleString()} USDT</span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-gray-500">{t("assets.withdraw_dialog.fee_note")}</span>
                    <span className="font-bold text-gray-900">1 USDT</span>
                  </div>
                  <div className="h-px bg-gray-200/60" />
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[15px] font-bold text-gray-900">{t("assets.withdraw_dialog.total_deduct")}</span>
                    <span className="text-[20px] font-black text-[#276152]">{receiveAmount.toLocaleString()} USDT</span>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-[16px] p-4 border border-amber-100 flex gap-3">
                  <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-800 leading-relaxed">
                    {t("assets.withdraw_dialog.note")}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="w-full h-[56px] bg-[#276152] hover:bg-[#1e4d40] text-white rounded-[16px] font-bold text-[16px] shadow-lg shadow-[#276152]/10"
              >
                {withdrawing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t("assets.withdraw_dialog.processing")}
                  </>
                ) : (
                  t("assets.withdraw_dialog.confirm_btn")
                )}
              </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  )
}
