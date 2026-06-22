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
import { cn, formatTruncated } from "@/lib/utils"
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
  const [bonusInfo, setBonusInfo] = useState<any>({
    totalBonusReceived: 0,
    provisionalAqeBonus: 0,
    claimableAqeBonus: 0,
    firstPaymentDate: null,
    totalRemainingBonus: 0,
    totalExpectedBonus: 0,
    hasClaimedThisMonth: false,
    schedule: []
  })
  const [claimingBonus, setClaimingBonus] = useState(false)
  const [bonusPage, setBonusPage] = useState(1)
  const bonusLimit = 10
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [isClaimConfirmOpen, setIsClaimConfirmOpen] = useState(false)
  const [claimType, setClaimType] = useState<'USDT' | 'AQE'>('USDT')

  // Withdrawal Modal State
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [isConvertOpen, setIsConvertOpen] = useState(false)
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

      const bonusRes = await apiClient.get(`/bonus/info`)
      setBonusInfo(bonusRes.data)
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
    const fee = paymentMethod === 'AQE' ? 0.0 : 1.0;
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

  const handleConvert = async () => {
    const currentBalance = summary.usdtBalance;
    if (currentBalance < 10) {
      toast.error(t("assets.withdraw_dialog.insufficient_balance"));
      return;
    }

    setWithdrawing(true);
    try {
      const res = await apiClient.post("/withdrawals/request", {
        paymentMethod: 'AQE'
      });

      if (res.data.url) {
        window.location.href = res.data.url;
        return;
      }

      toast.success(res.data.message);
      setIsConvertOpen(false);
      fetchData();
      syncProfile();
    } catch (err: any) {
      toast.error(t(err.response?.data?.message) || t("auth.errors.unknown"));
    } finally {
      setWithdrawing(false);
    }
  };

  const handleClaimBonus = async (type: 'USDT' | 'AQE' = 'USDT') => {
    if (bonusInfo.claimableAqeBonus <= 0) {
      toast.error(t("assets.bonus.no_claimable"));
      return;
    }

    setClaimingBonus(true);
    try {
      const res = await apiClient.post("/bonus/claim", { claimType: type });
      toast.success(t(res.data.message || "assets.bonus.claim_success"));
      fetchData();
      syncProfile();
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        toast.error(t(serverMsg));
      } else {
        toast.error(t("auth.errors.unknown"));
      }
    } finally {
      setClaimingBonus(false);
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

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setIsConvertOpen(true)}
            className="h-[52px] px-8 bg-amber-600 hover:bg-amber-700 text-white rounded-[16px] font-bold gap-2 shadow-lg shadow-amber-600/20"
          >
            <ArrowUpRight size={20} />
            {t("assets.withdraw_dialog.method_aqe")}
          </Button>
          <Button
            onClick={() => {
              setPaymentMethod(user?.countryCode === '+1' && !user?.walletAddress ? 'ZELLE' : 'WALLET');
              setIsWithdrawOpen(true);
            }}
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
                {formatTruncated(summary.officialAQE || 0, 5)} <span className="text-[20px] font-bold text-gray-400 ml-1">AQE</span>
              </p>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-full bg-[#276152]/5 text-[#276152] border-none px-3 py-1 font-bold">
                  {formatTruncated(summary.officialAQE || 0, 5)} Official
                </Badge>
                <Badge variant="outline" className="rounded-full bg-amber-50 text-amber-600 border-none px-3 py-1 font-bold">
                  +{formatTruncated(summary.temporaryAQE || 0, 5)} Estimated
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* AQE Bonus Card */}
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
                <span className="text-[14px] font-bold uppercase tracking-wider text-gray-500">{t("assets.bonus.title", "AQE Bonus")}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[32px] font-black tracking-tight text-[#111827]">
                {formatTruncated(bonusInfo.claimableAqeBonus, 5)} <span className="text-[16px] font-bold text-gray-400 ml-1">AQE</span>
              </p>
              <div className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">
                {t("assets.bonus.claimable", "Claimable Bonus")}
              </div>
              <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-500 font-medium">{t("assets.bonus.total_expected", "Total Expected")}</span>
                  <span className="font-bold text-gray-900">{formatTruncated(bonusInfo.totalExpectedBonus || 0, 5)} AQE</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-500 font-medium">{t("assets.bonus.total_received", "Total Received")}</span>
                  <span className="font-bold text-[#276152]">+{formatTruncated(bonusInfo.totalBonusReceived || 0, 5)} AQE</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-500 font-medium">{t("assets.bonus.remaining", "Remaining")}</span>
                  <span className="font-bold text-amber-600">{formatTruncated(bonusInfo.totalRemainingBonus || 0, 5)} AQE</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-500 font-medium">{t("assets.bonus.provisional", "Provisional")}</span>
                  <span className="font-bold text-blue-600">+{formatTruncated(bonusInfo.provisionalAqeBonus || 0, 5)} AQE</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsScheduleOpen(true)}
              className="w-full h-[36px] border border-amber-300 text-amber-600 hover:text-amber-700 hover:bg-amber-50/50 rounded-[10px] font-bold text-[13px]"
            >
              {t("assets.bonus.view_schedule_btn", "View Payout Schedule")}
            </Button>
            <Button
              onClick={() => {
                setClaimType('USDT'); // reset default to USDT when opening
                setIsClaimConfirmOpen(true);
              }}
              disabled={claimingBonus || bonusInfo.claimableAqeBonus <= 0 || bonusInfo.hasClaimedThisMonth}
              className="w-full h-[44px] bg-[#276152] hover:bg-[#1e4d40] text-white rounded-[12px] font-bold shadow-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:shadow-none"
            >
              {claimingBonus ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {bonusInfo.hasClaimedThisMonth
                ? t("assets.bonus.already_claimed", "Already Claimed This Month")
                : t("assets.bonus.claim_btn", "Claim")}
            </Button>
          </div>
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
                        {item.paymentMethod === 'AQE' ? (
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full w-fit border border-amber-100">
                              {t("assets.withdraw_dialog.method_aqe")}
                            </span>
                            <span className="text-[12px] text-gray-500 mt-1">
                              {user?.language === 'vi' 
                                ? "Quy đổi sang số dư AQE hưởng lãi 6%" 
                                : "Converted to AQE (6% APR)"}
                            </span>
                          </div>
                        ) : item.paymentMethod === 'ZELLE' ? (
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full w-fit border border-orange-100">Zelle</span>
                            <span className="text-[14px] font-medium text-[#111827] mt-1">{item.zelleName || "N/A"}</span>
                            <span className="text-[12px] text-gray-500">{item.zelleInfo}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit border border-emerald-100">
                              {t("assets.withdraw_dialog.method_wallet")}
                            </span>
                            <p className="text-[14px] text-[#111827] font-mono font-medium mt-1">
                              {item.walletAddress ? `${item.walletAddress.substring(0, 6)}...${item.walletAddress.substring(item.walletAddress.length - 4)}` : "-"}
                            </p>
                          </div>
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
              {canUseZelle && (
                <div className="grid gap-2 p-1.5 bg-gray-100 rounded-[16px] grid-cols-2">
                  <button
                    disabled={!hasWallet}
                    onClick={() => setPaymentMethod('WALLET')}
                    className={cn(
                      "py-2.5 text-[12px] font-bold rounded-[12px] transition-all",
                      paymentMethod === 'WALLET' ? "bg-white text-[#276152] shadow-sm" : "text-gray-500",
                      !hasWallet && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {t("assets.withdraw_dialog.method_wallet")}
                  </button>
                  <button
                    onClick={() => setPaymentMethod('ZELLE')}
                    className={cn(
                      "py-2.5 text-[12px] font-bold rounded-[12px] transition-all",
                      paymentMethod === 'ZELLE' ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"
                    )}
                  >
                    {t("assets.withdraw_dialog.method_zelle")}
                  </button>
                </div>
              )}

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
                  <span className="text-[15px] font-bold text-gray-900">
                    {t("assets.withdraw_dialog.total_deduct")}
                  </span>
                  <span className="text-[20px] font-black text-[#276152]">
                    {receiveAmount.toLocaleString()} USDT
                  </span>
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

      {/* Convert to AQE Dialog */}
      <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <DialogContent className="max-w-md rounded-[24px] p-8 border-none shadow-2xl">
          <div className="space-y-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-[24px] font-bold text-gray-900">{t("assets.withdraw_dialog.method_aqe")}</DialogTitle>
              <DialogDescription className="text-[14px] text-gray-500">
                {user?.language === 'vi' 
                  ? "Quy đổi số dư USDT hiện tại của bạn sang số dư AQE để hưởng lãi suất."
                  : "Convert your current USDT balance to AQE balance to earn daily yield."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-amber-50/50 rounded-[16px] border border-amber-100/50 space-y-1">
                <p className="text-[12px] text-amber-700/60 font-bold uppercase tracking-wider">{t("assets.withdraw_dialog.method_aqe")}</p>
                <p className="text-[13px] text-amber-800 leading-relaxed font-medium">
                  {t("assets.withdraw_dialog.method_aqe_desc")}
                </p>
              </div>

              <div className="p-5 rounded-[20px] bg-gray-50 border border-gray-100 space-y-4">
                <div className="flex justify-between text-[14px]">
                  <span className="text-gray-500">{t("assets.withdraw_dialog.amount_label")}</span>
                  <span className="font-bold text-gray-900">{currentBalance.toLocaleString()} USDT</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-gray-500">{t("assets.withdraw_dialog.fee_note")}</span>
                  <span className="font-bold text-gray-900">0 USDT</span>
                </div>
                <div className="h-px bg-gray-200/60" />
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[15px] font-bold text-gray-900">
                    {t("assets.bonus.claim_option_aqe")}
                  </span>
                  <span className="text-[20px] font-black text-[#276152]">
                    {currentBalance.toLocaleString()} AQE
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 rounded-[16px] p-4 border border-amber-100 flex gap-3">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-800 leading-relaxed">
                  {user?.language === 'vi' 
                    ? "Lưu ý: Số AQE được quy đổi sẽ được chuyển ngay lập tức vào số dư AQE của bạn và bắt đầu tính lãi 6% APR hàng ngày."
                    : "Note: Converted AQE will be instantly credited to your AQE balance and start earning 6% APR daily yield."}
                </p>
              </div>
            </div>

            <Button
              onClick={handleConvert}
              disabled={withdrawing}
              className="w-full h-[56px] bg-amber-600 hover:bg-amber-700 text-white rounded-[16px] font-bold text-[16px] shadow-lg shadow-amber-600/10"
            >
              {withdrawing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t("assets.withdraw_dialog.processing")}
                </>
              ) : (
                user?.language === 'vi' ? "Xác nhận quy đổi" : "Confirm Conversion"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bonus Payout Schedule Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-2xl rounded-[24px] p-8 border-none shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-[24px] font-bold text-gray-900">
              {t("assets.bonus.schedule_title")}
            </DialogTitle>
            <DialogDescription className="text-[14px] text-gray-500">
              {t("assets.bonus.schedule_desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto my-4 pr-1">
            <div className="bg-white border border-[#EFEFEF] rounded-[20px] overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#EFEFEF]/50">
                    <th className="px-6 py-4 text-[12px] font-bold text-[#276152] uppercase tracking-wider">{t("assets.bonus.table_date")}</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#276152] uppercase tracking-wider text-right">{t("assets.bonus.table_amount")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEFEF]">
                  {(() => {
                    const paginatedSchedule = (bonusInfo.schedule || []).slice(
                      (bonusPage - 1) * bonusLimit,
                      bonusPage * bonusLimit
                    );
                    if (paginatedSchedule.length === 0) {
                      return (
                        <tr>
                          <td colSpan={2} className="px-6 py-10 text-center text-[#868F9E] opacity-50">
                            {t("assets.bonus.no_schedule")}
                          </td>
                        </tr>
                      );
                    }
                    return paginatedSchedule.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-[14px] font-bold text-[#111827]">
                            {dayjs(item.date).format("DD/MM/YYYY")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <span className="text-[14px] font-bold text-[#276152]">
                            +{formatTruncated(item.amount, 5)} AQE
                          </span>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {bonusInfo.schedule && bonusInfo.schedule.length > bonusLimit && (
            <div className="pt-2">
              <Pagination
                currentPage={bonusPage}
                totalPages={Math.ceil(bonusInfo.schedule.length / bonusLimit)}
                totalItems={bonusInfo.schedule.length}
                onPageChange={setBonusPage}
                disabled={fetching}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Claim Confirmation Dialog */}
      <Dialog open={isClaimConfirmOpen} onOpenChange={setIsClaimConfirmOpen}>
        <DialogContent className="max-w-md rounded-[24px] p-8 border-none shadow-2xl">
          <div className="space-y-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-[24px] font-bold text-gray-900">
                {t("assets.bonus.confirm_title")}
              </DialogTitle>
              <DialogDescription className="text-[14px] text-gray-500 leading-relaxed">
                {t("assets.bonus.confirm_desc_generic", { amount: formatTruncated(bonusInfo.claimableAqeBonus, 5) })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                {t("assets.bonus.claim_type_label", "Choose claim option:")}
              </label>

              <div
                onClick={() => setClaimType('USDT')}
                className={cn(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3",
                  claimType === 'USDT'
                    ? "border-[#276152] bg-emerald-50/20"
                    : "border-gray-100 hover:border-gray-200 bg-white"
                )}
              >
                <div className={cn(
                  "size-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                  claimType === 'USDT' ? "border-[#276152]" : "border-gray-300"
                )}>
                  {claimType === 'USDT' && <div className="size-2.5 rounded-full bg-[#276152]" />}
                </div>
                <div>
                  <h4 className="font-bold text-[14px] text-gray-900">
                    {t("assets.bonus.claim_option_usdt", "Claim to USDT")}
                  </h4>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    Convert 1 AQE = 1 USDT directly to your USDT balance
                  </p>
                </div>
              </div>

              <div
                onClick={() => setClaimType('AQE')}
                className={cn(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3",
                  claimType === 'AQE'
                    ? "border-[#276152] bg-emerald-50/20"
                    : "border-gray-100 hover:border-gray-200 bg-white"
                )}
              >
                <div className={cn(
                  "size-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                  claimType === 'AQE' ? "border-[#276152]" : "border-gray-300"
                )}>
                  {claimType === 'AQE' && <div className="size-2.5 rounded-full bg-[#276152]" />}
                </div>
                <div>
                  <h4 className="font-bold text-[14px] text-gray-900">
                    {t("assets.bonus.claim_option_aqe", "Reinvest to AQE")}
                  </h4>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    Add to AQE balance (this amount continues to earn 6% APR yield)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsClaimConfirmOpen(false)}
                className="flex-1 h-[52px] rounded-[16px] font-bold border-gray-200 text-gray-500 hover:bg-gray-50"
              >
                {t("assets.bonus.confirm_cancel")}
              </Button>
              <Button
                onClick={() => {
                  setIsClaimConfirmOpen(false);
                  handleClaimBonus(claimType);
                }}
                disabled={claimingBonus}
                className="flex-1 h-[52px] bg-[#276152] hover:bg-[#1e4d40] text-white rounded-[16px] font-bold gap-2"
              >
                {claimingBonus ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("assets.bonus.claim_btn")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
