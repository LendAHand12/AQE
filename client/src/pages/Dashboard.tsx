import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { 
  TrendingUp, 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileText, 
  Wallet, 
  Plus, 
  ArrowUp,
  Loader2
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import apiClient from "@/lib/axios"
import dayjs from "dayjs"

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // API State
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    usdtBalance: 0,
    officialAQE: 0,
    temporaryAQE: 0,
    totalCommissions: 0,
  })
  const [totalSales, setTotalSales] = useState(0)
  const [monthlyCommission, setMonthlyCommission] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // 1. Fetch balance summary (limit=0 gets the overall totals)
        try {
          const summaryRes = await apiClient.get("/payments/my-balance-history?limit=0")
          if (summaryRes.data?.summary) {
            setSummary(summaryRes.data.summary)
          }
        } catch (e) {
          console.error("Failed to fetch balance history summary:", e)
        }

        // 2. Fetch referrals stats (for network total sales)
        try {
          const referralsRes = await apiClient.get("/auth/referrals")
          if (referralsRes.data?.summary) {
            setTotalSales(referralsRes.data.summary.totalSales || 0)
          }
        } catch (e) {
          console.error("Failed to fetch referrals stats:", e)
        }

        // 3. Fetch commissions and calculate commissions for current month
        try {
          const commissionsRes = await apiClient.get("/payments/my-commissions")
          const now = dayjs()
          const startOfMonth = now.startOf("month")
          const commissionsThisMonth = (commissionsRes.data || []).filter((c: any) => {
            return dayjs(c.createdAt).isAfter(startOfMonth) || dayjs(c.createdAt).isSame(startOfMonth)
          })
          const monthlySum = commissionsThisMonth.reduce((sum: number, c: any) => sum + (c.amountUsdt || 0), 0)
          setMonthlyCommission(monthlySum)
        } catch (e) {
          console.error("Failed to fetch commissions list:", e)
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#276152]" />
      </div>
    )
  }

  // 1. KPI data structured according to user request
  const kpis = [
    {
      id: "total-commissions",
      title: t("dashboard.total_commissions", "Lợi nhuận tổng"),
      value: `${(summary.totalCommissions || 0).toLocaleString()} USDT`,
      change: t("dashboard.commissions_desc", "Tổng hoa hồng đã nhận"),
      isPositive: true,
      icon: Wallet,
    },
    {
      id: "total-sales",
      title: t("dashboard.total_sales", "Tổng doanh thu"),
      value: `${(totalSales || 0).toLocaleString()} USDT`,
      change: t("dashboard.network_sales_desc", "Tổng doanh thu cấp dưới"),
      isPositive: true,
      icon: Coins,
    },
    {
      id: "monthly-commissions",
      title: t("dashboard.monthly_commissions", "Lợi nhuận tháng"),
      value: `${(monthlyCommission || 0).toLocaleString()} USDT`,
      change: t("dashboard.monthly_commissions_desc", "Hoa hồng tháng này"),
      isPositive: true,
      icon: TrendingUp,
    }
  ]

  // 2. Quick Actions (Removed notification configuration)
  const quickActions = [
    {
      label: t("dashboard.buy_token", "Mua Token"),
      icon: Plus,
      path: "/pre-register",
    },
    {
      label: t("dashboard.withdraw", "Rút tiền"),
      icon: ArrowDownLeft,
      path: "/assets",
    },
    {
      label: t("dashboard.deposit", "Nạp tiền"),
      icon: ArrowUpRight,
      path: "/assets",
    },
    {
      label: t("dashboard.view_report", "Xem báo cáo"),
      icon: FileText,
      path: "/balance-history",
    }
  ]

  // 3. Asset Details (Calculated 1 AQE = 1 USDT)
  const totalVal = (summary.officialAQE || 0) + (summary.temporaryAQE || 0) + (summary.usdtBalance || 0)

  const assetsData = {
    totalValue: totalVal,
    details: [
      {
        id: "invested",
        label: t("dashboard.invested_aqe", "Đã đầu tư (AQE)"),
        quantity: summary.officialAQE || 0,
        value: `≈ ${(summary.officialAQE || 0).toLocaleString()} USDT`,
        color: "#276152",
        suffix: "AQE"
      },
      {
        id: "upcoming",
        label: t("dashboard.upcoming_aqe", "Sắp nhận (AQE)"),
        quantity: summary.temporaryAQE || 0,
        value: `≈ ${(summary.temporaryAQE || 0).toLocaleString()} USDT`,
        color: "#f59e0b",
        suffix: "AQE"
      },
      {
        id: "usdt",
        label: t("dashboard.usdt", "USDT"),
        quantity: summary.usdtBalance || 0,
        value: `≈ ${(summary.usdtBalance || 0).toLocaleString()} USDT`,
        color: "#3b82f6",
        suffix: "USDT"
      }
    ]
  }

  // Chart pie data - Show empty grey slice if total is 0
  const pieData = totalVal > 0
    ? [
        { name: t("dashboard.aqe_invested_legend", "AQE đã đầu tư"), value: summary.officialAQE || 0, color: "#276152" },
        { name: t("dashboard.aqe_upcoming_legend", "AQE sắp nhận"), value: summary.temporaryAQE || 0, color: "#f59e0b" },
        { name: t("dashboard.usdt_legend", "USDT"), value: summary.usdtBalance || 0, color: "#3b82f6" }
      ]
    : [
        { name: t("dashboard.empty_legend", "Chưa có tài sản"), value: 1, color: "#e5e7eb" }
      ]

  // 4. Dividend timeline schedule (Mocked for later reuse)
  /*
  const dividends = [
    {
      id: "div-1",
      title: "Ocean View Resort & Spa",
      date: "15/02/2026",
      amount: "₫850,000",
      status: t("dashboard.upcoming", "Sắp tới"),
      image: "https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=120&auto=format&fit=crop&q=60"
    },
    {
      id: "div-2",
      title: "Marina Bay Premium",
      date: "15/02/2026",
      amount: "₫850,000",
      status: t("dashboard.upcoming", "Sắp tới"),
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=120&auto=format&fit=crop&q=60"
    },
    {
      id: "div-3",
      title: "Coastal Paradise Tower",
      date: "15/02/2026",
      amount: "₫850,000",
      status: t("dashboard.upcoming", "Sắp tới"),
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=120&auto=format&fit=crop&q=60"
    }
  ]
  */

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 font-sans animate-in fade-in duration-500">
      
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div 
              key={kpi.id} 
              className="bg-white border border-[#efefef] rounded-[24px] p-5 flex items-start justify-between hover:shadow-md hover:border-[#276152]/20 transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[14px] text-gray-500 font-medium tracking-wide">
                    {kpi.title}
                  </p>
                  <p className="text-[26px] font-bold text-[#111827] tracking-tight">
                    {kpi.value}
                  </p>
                </div>
                <p className={`text-[13px] font-medium tracking-wide text-emerald-600`}>
                  {kpi.change}
                </p>
              </div>
              <div className="size-10 rounded-full bg-[#d9ede8] flex items-center justify-center text-[#276152]">
                <Icon size={20} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {quickActions.map((action, i) => {
          const Icon = action.icon
          return (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-2 px-5 py-3 bg-[#efefef]/50 hover:bg-[#276152] hover:text-white rounded-[16px] text-[#111827] text-[13px] font-bold tracking-wide active:scale-95 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:shadow-[#276152]/10"
            >
              <Icon size={16} />
              <span>{action.label}</span>
            </button>
          )
        })}
      </div>

      {/* Performance Section: Total Assets & Portfolio Distribution */}
      <div className="bg-white border border-[#e5e7eb] rounded-[24px] p-6 lg:p-8 space-y-6">
        
        {/* Asset Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-[#111827] tracking-wide">
            {t("dashboard.total_assets", "Tổng tài sản")}
          </h2>
          <div className="bg-[#d9ede8] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-[#276152] text-[14px] font-semibold">
            <ArrowUp size={14} className="stroke-[3]" />
            <span>+16%</span>
          </div>
        </div>

        {/* Assets details & Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Asset balances */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            
            {/* Total Balance overview */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-[44px] font-bold text-[#0d1f1d] leading-none">
                  {assetsData.totalValue.toLocaleString()}
                </span>
                <span className="text-[22px] font-bold text-[#0d1f1d] tracking-wide">
                  USDT
                </span>
              </div>
            </div>

            {/* Asset Breakdown cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {assetsData.details.map((detail) => (
                <div 
                  key={detail.id}
                  className="bg-[#276152] hover:bg-[#1e4d41] rounded-[20px] p-5 text-white flex flex-col justify-between h-[150px] shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <p className="text-[12px] opacity-80 font-medium tracking-wide">
                    {detail.label}
                  </p>
                  <div className="space-y-1 mt-auto">
                    <p className="text-[32px] font-bold leading-none tracking-tight">
                      {detail.quantity.toLocaleString()}
                    </p>
                    <p className="text-[13px] opacity-75 font-normal truncate">
                      {detail.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Donut chart & legend */}
          <div className="lg:col-span-5 bg-[#efefef]/20 border border-white rounded-[24px] p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Chart Wrapper with Center text overlay */}
            <div className="relative size-[210px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center labels */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[12px] text-gray-500 font-medium tracking-wide">
                  {t("dashboard.total_assets", "Tổng tài sản")}
                </span>
                <span className={`font-black text-[#111827] tracking-tight leading-none mt-1 ${totalVal.toLocaleString().length > 6 ? 'text-[22px]' : 'text-[28px]'}`}>
                  {totalVal.toLocaleString()}
                </span>
                <span className="text-[10px] text-gray-400 font-bold tracking-wider mt-0.5">
                  USDT
                </span>
              </div>
            </div>

            {/* Chart Legends */}
            <div className="flex-1 space-y-4 w-full">
              <h3 className="text-[16px] font-bold text-[#111827] pb-1 border-b border-gray-100">
                {t("dashboard.portfolio_distribution", "Phân bổ danh mục")}
              </h3>
              <div className="space-y-3.5">
                {assetsData.details.map((detail) => (
                  <div key={detail.id} className="flex items-center justify-between text-[14px]">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="size-3.5 rounded-[4px] shrink-0" 
                        style={{ backgroundColor: detail.color }} 
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0d1f1d] leading-tight">
                          {detail.label}
                        </span>
                        <span className="text-[12px] text-gray-500 font-medium mt-0.5">
                          {detail.value}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="font-bold text-[#111827]">
                        {detail.quantity.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-gray-400 font-semibold tracking-wider">
                        {detail.suffix}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 
        TEMPORARILY HIDDEN / COMMENTED OUT DIVIDEND TIMELINE SCHEDULE 
        AS REQUESTED BY THE USER. CAN BE RESTORED LATER.

      <div className="bg-white border border-[#efefef] rounded-[24px] p-6 lg:p-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-[#111827] tracking-wide">
            {t("dashboard.dividend_schedule", "Lịch trả cổ tức")}
          </h2>
          <button 
            onClick={() => navigate("/assets")}
            className="flex items-center gap-1 text-[13px] font-bold text-[#276152] hover:text-[#1e4d41] hover:underline cursor-pointer transition-colors"
          >
            <span>{t("dashboard.view_all", "Xem tất cả")}</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="relative pl-3 space-y-0.5">
          <div className="absolute left-[17px] top-6 bottom-6 w-0.5 bg-[#e5e7eb]" />

          {dividends.map((item) => (
            <div key={item.id} className="flex gap-4 items-start pb-6 last:pb-0 relative group">
              <div className="relative z-10 flex items-center justify-center h-[50px] w-3">
                <div className="size-2.5 rounded-full bg-[#276152] border-2 border-white ring-4 ring-[#d9ede8] group-hover:scale-110 transition-transform duration-300" />
              </div>

              <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100 last:border-none">
                <div className="flex items-center gap-4">
                  <div className="size-[50px] rounded-[10px] overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[16px] font-bold text-[#111827] group-hover:text-[#276152] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[13px] text-gray-400 font-medium">
                      {item.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-center">
                  <span className="text-[16px] font-bold text-[#276152] tracking-tight">
                    {item.amount}
                  </span>
                  <span className="bg-[#fef3c7] text-[#92400e] px-3.5 py-1.5 rounded-full text-[13px] font-bold tracking-wide shadow-sm">
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      */}

    </div>
  )
}
