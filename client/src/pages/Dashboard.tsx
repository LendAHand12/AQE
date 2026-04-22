import React from "react"
import { useTranslation } from "react-i18next"
import { 
  Wallet, 
  TrendingUp, 
  Coins, 
  Calendar, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  ArrowRight,
  PieChart as PieChartIcon,
  ChevronRight,
  Bell,
  FileText,
  Download,
  Upload
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/AuthProvider"

// Mock Images
const ASSET_IMAGES = {
  oceanView: "/brain/4779104c-829a-4560-9ad9-ab91f6e8f0ed/ocean_view_resort_1776869101969.png",
  marinaBay: "/brain/4779104c-829a-4560-9ad9-ab91f6e8f0ed/marina_bay_premium_1776869118008.png",
  sunsetBeach: "/brain/4779104c-829a-4560-9ad9-ab91f6e8f0ed/sunset_beach_villas_1776869134688.png"
}

export default function Dashboard() {
  const { t } = useTranslation()
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="bg-[#276152]/5 p-8 rounded-[32px] border border-[#276152]/10 max-w-2xl w-full space-y-6">
        <div className="size-20 bg-[#276152] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#276152]/20 rotate-3">
          <Calendar className="text-white" size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-[32px] font-bold text-[#111827]">Coming Soon</h1>
          <p className="text-[#636D7D] text-[18px]">
            {t("dashboard.coming_soon_msg") || "Chúng tôi đang hoàn thiện trang Dashboard với những tính năng đầu tư cao cấp nhất. Vui lòng quay lại sau!"}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#276152]/40 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            </div>
          ))}
        </div>
        <button 
          onClick={() => window.location.href = '/pre-register'}
          className="mt-4 px-8 py-3 bg-[#276152] text-white font-bold rounded-xl hover:bg-[#1e4d40] transition-all shadow-md active:scale-95"
        >
          {t("dashboard.go_to_pre_register") || "Tham gia Pre-register ngay"}
        </button>
      </div>
    </div>
  )
}

function DashboardOldUI() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6 p-1 md:p-2">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label={t("dashboard.stats.total_assets") || "Tổng tài sản"} 
          value="58,470,000" 
          unit="₫"
          trend="+12.4%"
          isUp={true}
          icon={<Wallet className="text-[#276152]" size={20} />}
        />
        <StatCard 
          label={t("dashboard.stats.monthly_profit") || "Lợi nhuận tháng"} 
          value="3,420,000" 
          unit="₫"
          trend="+8.2%"
          isUp={true}
          icon={<TrendingUp className="text-[#276152]" size={20} />}
        />
        <StatCard 
          label={t("dashboard.stats.tokens_held") || "Token đang nắm"} 
          value="1,840" 
          unit=""
          icon={<Coins className="text-[#276152]" size={20} />}
          chart={true}
        />
        <StatCard 
          label={t("dashboard.stats.upcoming_dividends") || "Cổ tức sắp nhận"} 
          value="3,410,000" 
          unit="₫"
          trend="↓ 4 dự án"
          isUp={false}
          icon={<Calendar className="text-[#276152]" size={20} />}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <ActionButton icon={<PlusCircle size={16} />} label={t("dashboard.actions.buy")} />
        <ActionButton icon={<Download size={16} />} label={t("dashboard.actions.withdraw")} />
        <ActionButton icon={<Upload size={16} />} label={t("dashboard.actions.deposit")} />
        <ActionButton icon={<FileText size={16} />} label={t("dashboard.actions.report")} />
        <ActionButton icon={<Bell size={16} />} label={t("dashboard.actions.settings")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (70%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio Performance Chart */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#111827]">{t("dashboard.sections.portfolio")}</h3>
              <div className="flex bg-gray-50 p-1 rounded-lg">
                {['1W', '1M', '3M', '1Y', 'All'].map((period) => (
                  <button 
                    key={period}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-all",
                      period === '1M' ? "bg-[#276152] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-[300px] w-full relative">
              <MockPerformanceChart />
            </div>
          </div>

          {/* Top Assets */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#111827]">{t("dashboard.sections.top_assets")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-2 overflow-x-auto">
              <AssetCard 
                title="Ocean View Resort & Spa" 
                tokens={320} 
                roi="+15.2%" 
                image={ASSET_IMAGES.oceanView}
              />
              <AssetCard 
                title="Marina Bay Premium" 
                tokens={450} 
                roi="+14.8%" 
                image={ASSET_IMAGES.marinaBay}
              />
              <AssetCard 
                title="Sunset Beach Villas" 
                tokens={280} 
                roi="+16.5%" 
                image={ASSET_IMAGES.sunsetBeach}
              />
            </div>
          </div>

          {/* Dividend Timeline */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#111827]">{t("dashboard.sections.dividend_timeline")}</h3>
              <button className="text-[#276152] text-sm font-semibold flex items-center gap-1 hover:underline">
                {t("dashboard.actions.view_all")} <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-0">
               <TimelineItem 
                title="Ocean View Resort & Spa" 
                date="15/02/2026" 
                amount="850,000" 
                image={ASSET_IMAGES.oceanView}
                isLast={false}
               />
               <TimelineItem 
                title="Marina Bay Premium" 
                date="18/02/2026" 
                amount="1,200,000" 
                image={ASSET_IMAGES.marinaBay}
                isLast={false}
               />
               <TimelineItem 
                title="Sunset Beach Villas" 
                date="22/02/2026" 
                amount="640,000" 
                image={ASSET_IMAGES.sunsetBeach}
                isLast={false}
               />
               <TimelineItem 
                title="Coastal Paradise Tower" 
                date="25/02/2026" 
                amount="720,000" 
                image={ASSET_IMAGES.sunsetBeach}
                isLast={true}
               />
            </div>
          </div>
        </div>

        {/* Right Column (30%) */}
        <div className="space-y-6">
          {/* Portfolio Distribution */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#111827] mb-6">{t("dashboard.sections.portfolio_distribution")}</h3>
            <div className="flex flex-col items-center">
              <div className="size-48 relative mb-6">
                <MockPieChart />
              </div>
              <div className="w-full space-y-3">
                <DistributionItem label="Beachfront" percent={42} color="#276152" />
                <DistributionItem label="Resort" percent={28} color="#1e4d40" />
                <DistributionItem label="Island" percent={18} color="#d9ede8" />
                <DistributionItem label="Ocean View" percent={12} color="#e5e7eb" />
              </div>
            </div>
          </div>

          {/* Market Snapshot */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#111827]">{t("dashboard.sections.market")}</h3>
              <button className="text-[#276152] text-sm font-semibold flex items-center gap-1 hover:underline">
                Marketplace <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-4">
              <MarketItem name="Tropical Beach Club" price="128,000" change="+2.4%" image={ASSET_IMAGES.oceanView} />
              <MarketItem name="Emerald Bay" price="245,000" change="+1.8%" image={ASSET_IMAGES.marinaBay} />
              <MarketItem name="Pearl Island" price="510,000" change="-0.5%" isDown image={ASSET_IMAGES.sunsetBeach} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, unit, trend, isUp, icon, chart }: any) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-[#276152]/30 transition-all group h-[140px] flex items-start justify-between">
      <div className="flex flex-col h-full justify-between">
        <div>
          <p className="text-[13px] font-medium text-[#717c8d] mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#111827] tracking-tight">{unit}{value}</span>
          </div>
        </div>
        {trend && (
          <p className={cn(
            "text-[13px] font-semibold flex items-center gap-1",
            isUp ? "text-[#16a34a]" : "text-[#dc2626]"
          )}>
            {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </p>
        )}
        {chart && (
          <div className="h-6 w-24">
            <svg viewBox="0 0 100 30" className="w-full h-full">
              <path 
                d="M0 25 Q 10 20, 20 22 T 40 18 T 60 15 T 80 18 T 100 10" 
                fill="none" 
                stroke="#276152" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="bg-[#d9ede8] size-10 rounded-full flex items-center justify-center shrink-0">
        {icon}
      </div>
    </div>
  )
}

function ActionButton({ icon, label }: any) {
  return (
    <button className="bg-[#f8faf9] border border-gray-100 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold text-[#111827] hover:bg-white hover:border-[#276152]/30 hover:shadow-sm transition-all group">
      <span className="text-[#276152] group-hover:scale-110 transition-transform">{icon}</span>
      {label}
    </button>
  )
}

function AssetCard({ title, tokens, roi, image }: any) {
  return (
    <div className="min-w-[240px] bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all group">
      <div className="h-28 overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
      </div>
      <div className="p-4">
        <h4 className="font-bold text-[#111827] text-sm mb-1 line-clamp-1">{title}</h4>
        <p className="text-xs font-semibold text-gray-500 mb-4">{tokens} tokens</p>
        <div className="flex items-center justify-between">
          <span className="bg-[#d1fae5] text-[#065f46] text-[10px] font-bold px-2 py-1 rounded">ROI {roi}</span>
          <button className="text-[#276152] text-xs font-bold hover:underline">Xem →</button>
        </div>
      </div>
    </div>
  )
}

function TimelineItem({ title, date, amount, image, isLast }: any) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="size-2.5 rounded-full bg-[#276152] mt-1.5" />
        {!isLast && <div className="w-[1px] flex-grow bg-gray-200 my-1" />}
      </div>
      <div className={cn("flex-grow pb-6 flex items-center justify-between", !isLast && "border-b border-gray-50")}>
        <div className="flex items-center gap-3">
          <img src={image} className="size-9 rounded-lg object-cover" alt="" />
          <div>
            <p className="text-sm font-bold text-[#111827]">{title}</p>
            <p className="text-xs font-semibold text-gray-400">{date}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-[#276152]">₫{amount}</p>
          <span className="bg-[#fef3c7] text-[#92400e] text-[10px] font-bold px-2 py-0.5 rounded-full">Sắp tới</span>
        </div>
      </div>
    </div>
  )
}

function DistributionItem({ label, percent, color }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="size-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-semibold text-gray-500">{label}</span>
      </div>
      <span className="text-xs font-bold text-[#111827]">{percent}%</span>
    </div>
  )
}

function MarketItem({ name, price, change, isDown, image }: any) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3">
        <img src={image} className="size-7 rounded-md object-cover" alt="" />
        <p className="text-[13px] font-bold text-[#111827]">{name}</p>
      </div>
      <div className="text-right">
        <p className="text-[13px] font-bold text-[#111827]">₫{price}</p>
        <p className={cn("text-[10px] font-bold", isDown ? "text-[#dc2626]" : "text-[#16a34a]")}>
          {isDown ? "▼" : "▲"} {change}
        </p>
      </div>
    </div>
  )
}

function MockPerformanceChart() {
  return (
    <svg viewBox="0 0 800 300" className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#276152" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#276152" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid Lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line 
          key={i} 
          x1="0" y1={i * 60 + 30} x2="800" y2={i * 60 + 30} 
          stroke="#f3f4f6" strokeWidth="1" 
        />
      ))}
      {/* Area */}
      <path 
        d="M0 250 Q 100 220, 200 230 T 400 180 T 600 160 T 800 120 V 300 H 0 Z" 
        fill="url(#chartGradient)"
      />
      {/* Line */}
      <path 
        d="M0 250 Q 100 220, 200 230 T 400 180 T 600 160 T 800 120" 
        fill="none" stroke="#276152" strokeWidth="3" strokeLinecap="round"
      />
      {/* Dots */}
      <circle cx="400" cy="180" r="4" fill="#276152" />
    </svg>
  )
}

function MockPieChart() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full rotate-[-90deg]">
      {/* Beachfront - 42% */}
      <circle 
        cx="50" cy="50" r="40" 
        fill="transparent" 
        stroke="#276152" 
        strokeWidth="12" 
        strokeDasharray="105.5 251.2" 
      />
      {/* Resort - 28% */}
      <circle 
        cx="50" cy="50" r="40" 
        fill="transparent" 
        stroke="#1e4d40" 
        strokeWidth="12" 
        strokeDasharray="70.3 251.2" 
        strokeDashoffset="-105.5"
      />
      {/* Island - 18% */}
      <circle 
        cx="50" cy="50" r="40" 
        fill="transparent" 
        stroke="#d9ede8" 
        strokeWidth="12" 
        strokeDasharray="45.2 251.2" 
        strokeDashoffset="-175.8"
      />
      {/* Ocean View - 12% */}
      <circle 
        cx="50" cy="50" r="40" 
        fill="transparent" 
        stroke="#e5e7eb" 
        strokeWidth="12" 
        strokeDasharray="30.2 251.2" 
        strokeDashoffset="-221"
      />
      <circle cx="50" cy="50" r="28" fill="white" />
      <text 
        x="50" y="50" 
        transform="rotate(90 50 50)" 
        textAnchor="middle" 
        dominantBaseline="middle" 
        className="text-[12px] font-bold fill-[#111827]"
      >
        AQE
      </text>
    </svg>
  )
}
