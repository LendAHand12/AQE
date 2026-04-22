import React, { useState, useEffect } from "react"
import { 
  History as HistoryIcon, 
  Search,
  Loader2,
  FileDown,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Receipt,
  Wallet
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import apiClient from "@/lib/axios"
import dayjs from "dayjs"
import { cn } from "@/lib/utils"

export default function BalanceHistoryPage() {
  const { t } = useTranslation()
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("ALL")
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [historyRes, profileRes] = await Promise.all([
        apiClient.get("/explorer/my-balance-history"),
        apiClient.get("/auth/profile")
      ])
      setHistory(historyRes.data)
      setUserProfile(profileRes.data)
    } catch (err) {
      console.error("Fetch Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: "ALL", label: t("balance_history.tabs.all") || "Tất cả" },
    { id: "DEPOSIT", label: t("balance_history.tabs.deposit") || "Nạp" },
    { id: "WITHDRAW", label: t("balance_history.tabs.withdraw") || "Rút" },
    { id: "BUY", label: t("balance_history.tabs.buy") || "Mua token" },
    { id: "SELL", label: t("balance_history.tabs.sell") || "Bán token" },
    { id: "COMMISSION", label: t("balance_history.tabs.commission") || "Cổ tức & Hoa hồng" },
    { id: "TRANSFER", label: t("balance_history.tabs.transfer") || "Chuyển" },
  ]

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === "ALL" || item.type === activeTab
    return matchesSearch && matchesTab
  })

  // Summary logic
  const totalDeposit = history.filter(i => i.type === 'DEPOSIT').reduce((s, i) => s + i.amount, 0)
  const totalWithdraw = history.filter(i => i.type === 'WITHDRAW').reduce((s, i) => s + i.amount, 0)
  const totalReward = history.filter(i => ['COMMISSION', 'REWARD'].includes(i.type)).reduce((s, i) => s + (i.usdtAmount || i.amount), 0)
  const totalFees = history.reduce((s, i) => s + (i.fee || 0), 0)

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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-[220px]">
              <Input 
                placeholder="dd/mm/yyyy" 
                className="h-[44px] rounded-[8px] border-[#9CA3AF] pl-4 focus-visible:ring-[#276152]"
              />
            </div>
            <span className="text-[#9CA3AF] font-bold">─</span>
            <div className="relative flex-1 lg:w-[220px]">
              <Input 
                placeholder="dd/mm/yyyy" 
                className="h-[44px] rounded-[8px] border-[#9CA3AF] pl-4 focus-visible:ring-[#276152]"
              />
            </div>
          </div>


        </div>

      {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard 
            label={t("balance_history.summary.total_deposit")} 
            value={totalDeposit} 
            bgColor="bg-[#16A34A]/10" 
            textColor="text-[#16A34A]" 
          />
          <SummaryCard 
            label={t("balance_history.summary.total_withdraw")} 
            value={totalWithdraw} 
            bgColor="bg-[#EF4444]/10" 
            textColor="text-[#EF4444]" 
          />
          <SummaryCard 
            label={t("balance_history.summary.total_profit")} 
            value={totalReward} 
            bgColor="bg-[#F59E0B]/10" 
            textColor="text-[#F59E0B]" 
          />
          <SummaryCard 
            label={t("balance_history.summary.total_fee")} 
            value={totalFees} 
            bgColor="bg-[#EFEFEF]" 
            textColor="text-[#0D1F1D]" 
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
                        <span className={cn(
                          "text-[14px] font-bold",
                          item.category === 'INFLOW' ? "text-[#16A34A]" : "text-[#EF4444]"
                        )}>
                          {item.category === 'INFLOW' ? "+" : "-"}{item.amount.toLocaleString()} {item.symbol}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-right whitespace-nowrap text-[14px] font-bold text-[#0D1F1D]">
                        {item.fee ? item.fee.toLocaleString() : "0"}
                      </td>
                      <td className="px-4 py-5 text-right whitespace-nowrap text-[14px] font-bold text-[#111827]">
                        {item.balanceAfter ? item.balanceAfter.toLocaleString() : "---"}
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
                    <td colSpan={7} className="px-6 py-20 text-center text-[#868F9E]">
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

function SummaryCard({ label, value, bgColor, textColor }: { label: string, value: number, bgColor: string, textColor: string }) {
  return (
    <div className={cn("p-4 rounded-[12px] flex flex-col gap-1 transition-transform hover:scale-[1.02]", bgColor)}>
      <p className="text-[16px] text-[#0D1F1D]">{label}</p>
      <p className={cn("text-[24px] font-bold tracking-tight", textColor)}>
        ₫{value.toLocaleString()}
      </p>
    </div>
  )
}
