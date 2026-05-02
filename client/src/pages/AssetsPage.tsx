import { useState, useEffect } from "react"
import { 
  Loader2,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Receipt,
  AlertCircle,
  Settings as SettingsIcon,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { 
  Dialog, 
  DialogContent, 
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

  // Withdrawal Modal State
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  useEffect(() => {
    fetchData()
    syncProfile()
  }, [page])

  const fetchData = async () => {
    if (page === 1) setLoading(true)
    else setFetching(true)
    try {
      const historyRes = await apiClient.get(`/payments/my-balance-history?page=${page}&limit=10&symbol=WITHDRAW`)
      setHistory(historyRes.data.history)
      setTotalPages(historyRes.data.pages)
      setTotalItems(historyRes.data.total)
      setSummary(historyRes.data.summary)
    } catch (err) {
      console.error("Fetch Error:", err)
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }

  const handleWithdraw = async () => {
    if (!user?.walletAddress) {
      toast.error(t("assets.withdraw_dialog.no_wallet_title"));
      return;
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
        walletAddress: user.walletAddress
      });
      
      toast.success(res.data.message);
      setIsWithdrawOpen(false);
      fetchData(); 
      syncProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("auth.errors.unknown"));
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#276152]" />
    </div>
  )

  const hasWallet = !!user?.walletAddress;
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

      <div className="space-y-6">
        <h3 className="text-[20px] font-bold text-[#111827]">{t("assets.withdraw_history")}</h3>
        
        <div className="bg-white border border-[#EFEFEF] rounded-[24px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#EFEFEF]/50">
                  <th className="px-6 py-4 text-[12px] font-bold text-[#276152] uppercase tracking-wider">{t("assets.table.time")}</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#276152] uppercase tracking-wider">{t("assets.table.detail")}</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#276152] uppercase tracking-wider text-right">{t("assets.table.amount")}</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#276152] uppercase tracking-wider text-right">{t("assets.table.fee")}</th>
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
                            {dayjs(item.date).format("DD/MM/YYYY")}
                          </span>
                          <span className="text-[12px] text-[#868F9E]">
                            {dayjs(item.date).format("HH:mm:ss")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[14px] text-[#111827] font-medium">{item.description}</p>
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
                        <div className="flex justify-center">
                          <div className={cn(
                            "rounded-full px-3 py-1 flex items-center gap-2 text-[11px] font-bold",
                            item.status === 'SUCCESS' ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEF3C7] text-[#92400E]"
                          )}>
                            {item.status === 'PENDING' && <div className="size-1.5 rounded-full bg-[#D97706] animate-pulse" />}
                            {item.status === 'SUCCESS' ? t("assets.status.success") : t("assets.status.pending")}
                          </div>
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
          {hasWallet ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-[24px] font-bold text-gray-900">{t("assets.withdraw_dialog.title")}</h2>
                <p className="text-[14px] text-gray-500">{t("assets.withdraw_dialog.desc")}</p>
              </div>

              <div className="space-y-4">
                 <div className="p-5 rounded-[16px] bg-gray-50 space-y-4">
                    <div className="flex justify-between text-[14px]">
                       <span className="text-gray-500">{t("assets.withdraw_dialog.amount_label")}</span>
                       <span className="font-bold text-gray-900">{currentBalance.toLocaleString()} USDT</span>
                    </div>
                    <div className="flex justify-between text-[14px]">
                       <span className="text-gray-500">{t("assets.withdraw_dialog.fee_note")}</span>
                       <span className="font-bold text-gray-900">1 USDT</span>
                    </div>
                    <div className="h-px bg-gray-200" />
                    <div className="flex justify-between items-center pt-1">
                       <span className="text-[15px] font-bold text-gray-900">{t("assets.withdraw_dialog.total_deduct")}</span>
                       <span className="text-[20px] font-black text-[#276152]">{receiveAmount.toLocaleString()} USDT</span>
                    </div>
                 </div>

                 <div className="bg-amber-50 rounded-[12px] p-3 border border-amber-100 flex gap-2">
                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 leading-normal">
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
          ) : (
            <div className="flex flex-col items-center text-center space-y-6 py-4">
              <div className="size-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <SettingsIcon size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-[20px] font-bold text-gray-900">{t("assets.withdraw_dialog.no_wallet_title")}</h2>
                <p className="text-[14px] text-gray-500">
                   {t("assets.withdraw_dialog.no_wallet_desc")}
                </p>
              </div>
              <Button 
                onClick={() => navigate("/settings")}
                className="w-full h-[52px] bg-[#276152] hover:bg-[#1e4d40] text-white rounded-[16px] font-bold text-[16px]"
              >
                {t("assets.withdraw_dialog.go_to_settings")}
                <ChevronRight size={18} className="ml-1" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
