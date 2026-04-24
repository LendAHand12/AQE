import { useState, useEffect } from "react"
import { 
  Loader2,
  Receipt,
  Search
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import apiClient from "@/lib/axios"
import dayjs from "dayjs"
import { cn } from "@/lib/utils"

export default function BalanceHistoryPage() {
  const { t } = useTranslation()
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [assetFilter, setAssetFilter] = useState("ALL") // ALL, USDT, AQE

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const historyRes = await apiClient.get("/payments/my-balance-history")
      setHistory(historyRes.data)
    } catch (err) {
      console.error("Fetch Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredHistory = history.filter(item => {
    // 1. Hide Commissions where the user is NOT the receiver (Inflow)
    if (item.type === 'COMMISSION' && item.category !== 'INFLOW') return false;

    const matchesSearch = (item.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.symbol || "").toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesAsset = true;
    if (assetFilter === "USDT") matchesAsset = item.symbol === "USDT";
    else if (assetFilter === "AQE") matchesAsset = item.symbol === "AQE";
    
    return matchesSearch && matchesAsset;
  })

  // Summary logic
  const totalDeposit = history.reduce((s, i) => {
    if (i.type === 'DEPOSIT') return s + (i.amount || 0);
    // For BUY transactions, we want to sum the USDT amount paid
    if (i.type === 'BUY' && i.symbol === 'AQE') return s + (i.raw?.usdtAmount || 0);
    return s;
  }, 0)

  const totalAQEOfficial = history.filter(i => i.symbol === 'AQE' && i.isReleased).reduce((s, i) => s + (i.amount || 0), 0)
  const totalAQEEstimated = history.filter(i => i.symbol === 'AQE' && !i.isReleased).reduce((s, i) => s + (i.amount || 0), 0)
  const totalCommissions = history.filter(i => i.type === 'COMMISSION' && i.category === 'INFLOW').reduce((s, i) => s + (i.amount || 0), 0)

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#276152]" />
    </div>
  )

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 font-sans pb-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-[36px] font-bold text-[#111827] tracking-tight">
          {t("sidebar.balance_history")}
        </h1>
        <p className="text-[#636D7D] text-[16px]">
          {t("balance_history.subtitle") || "Theo dõi tất cả giao dịch trong tài khoản"}
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Filters & Export */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-[16px] border border-[#EFEFEF]">
          <div className="flex flex-wrap items-center gap-3">
             <button 
               onClick={() => setAssetFilter("ALL")}
               className={cn(
                 "px-6 py-2 rounded-full text-sm font-bold transition-all",
                 assetFilter === "ALL" ? "bg-[#276152] text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
               )}
             >
               {t("balance_history.asset_filter.all")}
             </button>
             <button 
               onClick={() => setAssetFilter("USDT")}
               className={cn(
                 "px-6 py-2 rounded-full text-sm font-bold transition-all",
                 assetFilter === "USDT" ? "bg-[#16A34A] text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
               )}
             >
               {t("balance_history.asset_filter.usdt")}
             </button>
             <button 
               onClick={() => setAssetFilter("AQE")}
               className={cn(
                 "px-6 py-2 rounded-full text-sm font-bold transition-all",
                 assetFilter === "AQE" ? "bg-amber-500 text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
               )}
             >
               {t("balance_history.asset_filter.aqe")}
             </button>
          </div>

          <div className="relative w-full lg:w-[350px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#868F9E]" strokeWidth={2.5} />
             <Input 
                placeholder={t("balance_history.search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-[44px] pl-10 rounded-[12px] border-[#EFEFEF] focus-visible:ring-[#276152]"
             />
          </div>
        </div>

      {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard 
            label={t("history.summary.total_paid")} 
            value={totalDeposit} 
            symbol="USDT"
            bgColor="bg-[#16A34A]/10" 
            textColor="text-[#16A34A]" 
          />
          <SummaryCard 
            label={t("history.summary.aqe_official")} 
            value={totalAQEOfficial} 
            symbol="AQE"
            bgColor="bg-[#276152]/10" 
            textColor="text-[#276152]" 
          />
          <SummaryCard 
            label={t("history.summary.aqe_estimated")} 
            value={totalAQEEstimated} 
            symbol="AQE"
            bgColor="bg-amber-50" 
            textColor="text-amber-600" 
          />
          <SummaryCard 
            label={t("history.summary.total_commissions")} 
            value={totalCommissions} 
            symbol="USDT"
            bgColor="bg-blue-50" 
            textColor="text-blue-700" 
          />
        </div>

        {/* Transaction Table */}
        <div className="bg-white border border-[#EFEFEF] rounded-[16px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#EFEFEF]/50">
                  <th className="px-4 py-3 text-[12px] font-bold text-[#276152] uppercase tracking-wider">{t("history.date")}</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-[#276152] uppercase tracking-wider">{t("history.type")}</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-[#276152] uppercase tracking-wider">{t("history.detail")}</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-[#276152] uppercase tracking-wider text-right">{t("history.amount")}</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-[#276152] uppercase tracking-wider text-right">{t("history.fee")}</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-[#276152] uppercase tracking-wider text-right">{t("history.balance_before")}</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-[#276152] uppercase tracking-wider text-right">{t("history.balance_after")}</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-[#276152] uppercase tracking-wider text-center">{t("history.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFEF]">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-5">
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-[#111827]">
                            {dayjs(item.date).format("DD/MM/YYYY")}
                          </span>
                          <span className="text-[12px] text-[#868F9E]">
                            {dayjs(item.date).format("HH:mm:ss")}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <Badge className={cn(
                          "rounded-full px-3 py-0.5 text-[11px] font-bold border-none",
                          item.type === 'DEPOSIT' ? "bg-blue-100 text-blue-700" :
                          item.type === 'WITHDRAW' ? "bg-orange-100 text-orange-700" :
                          item.type === 'COMMISSION' ? "bg-amber-100 text-amber-700" :
                          item.type === 'BUY' ? "bg-emerald-100 text-emerald-800" :
                          "bg-gray-100 text-gray-700"
                        )}>
                          {t(`balance_history.types.${item.type.toLowerCase()}`) || item.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-5 max-w-[250px]">
                        <p className="text-[14px] text-[#111827] truncate font-medium">{item.description}</p>
                      </td>
                      <td className="px-4 py-5 text-right whitespace-nowrap">
                         {item.symbol === 'AQE' ? (
                            <div className="flex flex-col items-end">
                               <span className={cn(
                                 "text-[14px] font-bold",
                                 item.isReleased ? "text-[#16A34A]" : "text-amber-600"
                               )}>
                                 {item.amount.toLocaleString()} AQE
                               </span>
                               <span className="text-[10px] font-bold uppercase opacity-60">
                                 {item.isReleased ? t("balance_history.status.official") : t("balance_history.status.estimated")}
                               </span>
                            </div>
                         ) : (
                            <span className={cn(
                              "text-[14px] font-bold",
                              item.category === 'INFLOW' ? "text-[#16A34A]" : "text-[#EF4444]"
                            )}>
                              {item.category === 'INFLOW' ? "+" : "-"}{item.amount.toLocaleString()} USDT
                            </span>
                         )}
                      </td>
                      <td className="px-4 py-5 text-right whitespace-nowrap text-[14px] font-bold text-[#0D1F1D]">
                        {item.fee ? item.fee.toLocaleString() : "0"}
                      </td>
                      <td className="px-4 py-5 text-right whitespace-nowrap text-[14px] font-bold text-[#868F9E]">
                        {item.balanceBefore !== undefined ? item.balanceBefore.toLocaleString() : "---"}
                      </td>
                      <td className="px-4 py-5 text-right whitespace-nowrap text-[14px] font-bold text-[#111827]">
                        {item.balanceAfter !== undefined ? item.balanceAfter.toLocaleString() : "---"}
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex justify-center">
                          <div className={cn(
                            "rounded-full px-3 py-1 flex items-center gap-2 text-[11px] font-bold",
                            item.status === 'SUCCESS' ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEF3C7] text-[#92400E]"
                          )}>
                            {item.status === 'PENDING' && <div className="size-1.5 rounded-full bg-[#D97706] animate-pulse" />}
                            {item.status === 'SUCCESS' ? t("payments.status.success") : t("payments.status.pending")}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center text-[#868F9E]">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <Receipt size={64} />
                        <p className="text-[18px] font-medium">{t("history.empty") || "Không có giao dịch nào"}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, bgColor, textColor, symbol }: { label: string, value: number, bgColor: string, textColor: string, symbol?: string }) {
  return (
    <div className={cn("p-4 rounded-[12px] flex flex-col gap-1 transition-transform hover:scale-[1.02]", bgColor)}>
      <p className="text-[16px] text-[#0D1F1D]">{label}</p>
      <p className={cn("text-[24px] font-bold tracking-tight", textColor)}>
        {value.toLocaleString()} {symbol || "USDT"}
      </p>
    </div>
  )
}
