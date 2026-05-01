import { useState, useEffect } from "react"
import {
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { cn } from "@/lib/utils"
import apiClient from "@/lib/axios"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

dayjs.extend(relativeTime)

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiClient.get('/admin/dashboard-stats')
        setData(response.data)
      } catch (error: any) {
        toast.error("Không thể tải dữ liệu dashboard")
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#276152]" />
      </div>
    )
  }

  const { stats, monthlyRevenue, recentTransactions, pendingKYC } = data

  // Format chart data
  const chartData = monthlyRevenue.map((item: any) => ({
    name: `T${item._id.month}`,
    total: item.total // USDT
  }))

  // Ensure we have 12 months (mocking missing ones if needed for visual)
  const finalChartData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const existing = chartData.find((d: any) => d.name === `T${month}`);
    return existing || { name: `T${month}`, total: 0 };
  });

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-10 animate-in fade-in duration-500">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Tổng người dùng" 
          value={stats.totalUsers.value.toLocaleString()} 
          change={stats.totalUsers.change} 
        />
        <StatCard 
          title="Tài sản hoạt động" 
          value={stats.activeAssets.value.toLocaleString()} 
          change={stats.activeAssets.change} 
        />
        <StatCard 
          title="Giao dịch hôm nay" 
          value={stats.todayTransactions.value.toLocaleString()} 
          change={stats.todayTransactions.change} 
        />
        <StatCard 
          title="Doanh thu (USDT)" 
          value={`${stats.totalRevenue.value.toLocaleString()} USDT`} 
          change={stats.totalRevenue.change} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Recent Transactions */}
          <section className="space-y-4">
            <h2 className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[18px] text-[#276152] tracking-[0.54px]">
              Giao dịch gần đây
            </h2>
            <div className="bg-white rounded-[16px] border border-[#efefef] overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#d9ede8]">
                  <tr>
                    <th className="px-4 py-3 font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] text-[#0d1f1d]">Người dùng</th>
                    <th className="px-4 py-3 font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] text-[#0d1f1d]">Số tiền</th>
                    <th className="px-4 py-3 font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] text-[#0d1f1d]">Trạng thái</th>
                    <th className="px-4 py-3 font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] text-[#0d1f1d]">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#efefef]/50">
                  {recentTransactions.map((tx: any) => (
                    <tr key={tx._id} className="hover:bg-[#f8faf9] transition-colors">
                      <td className="px-4 py-3 font-['SVN-Gilroy:Regular',sans-serif] text-[16px] text-[#111827]">
                        {tx.userName}
                      </td>
                      <td className="px-4 py-3 font-['SVN-Gilroy:Regular',sans-serif] text-[16px] text-[#111827]">
                        {tx.amount?.toLocaleString()} USDT
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="px-4 py-3 font-['SVN-Gilroy:Regular',sans-serif] text-[16px] text-[#111827]">
                        {dayjs(tx.createdAt).fromNow()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Revenue Chart */}
          <section className="bg-[rgba(239,239,239,0.5)] p-4 rounded-[16px] space-y-6">
            <h2 className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[18px] text-[#276152] tracking-[0.54px]">
              Doanh thu theo tháng (USDT)
            </h2>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finalChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#efefef" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#0d1f1d', fontSize: 14, fontFamily: 'SVN-Gilroy:SemiBold' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#0d1f1d', fontSize: 14, fontFamily: 'SVN-Gilroy:SemiBold' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar 
                    dataKey="total" 
                    radius={[4, 4, 0, 0]} 
                    barSize={40}
                  >
                    {finalChartData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === now.getMonth() ? '#276152' : 'rgba(39,97,82,0.4)'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* KYC Pending */}
          <section className="bg-[rgba(239,239,239,0.5)] border border-white rounded-[16px] p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[18px] text-[#0d1f1d] tracking-[0.54px]">
                KYC chờ duyệt
              </h2>
            </div>
            <div className="space-y-0 divide-y divide-[#efefef]">
              {pendingKYC.length > 0 ? pendingKYC.map((user: any) => (
                <div key={user._id} className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#ef4444] rounded-full" />
                    <span className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[14px] text-[#0d1f1d]">
                      {user.fullName || user.email}
                    </span>
                  </div>
                  <button 
                    onClick={() => navigate('/admin/users')}
                    className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[11px] text-[#276152] hover:underline"
                  >
                    Xem
                  </button>
                </div>
              )) : (
                <p className="text-center py-4 text-gray-500 text-sm">Không có yêu cầu chờ duyệt</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, change }: { title: string, value: string, change: number }) {
  const isUp = change >= 0
  return (
    <div className="bg-[rgba(239,239,239,0.5)] border-l-4 border-[#276152] rounded-r-[16px] p-[20px] py-[15px] space-y-3">
      <div className="space-y-1">
        <p className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[14px] text-[#636d7d] tracking-[0.42px]">
          {title}
        </p>
        <p className="font-['SVN-Gilroy:Bold',sans-serif] text-[24px] text-[#0d1f1d] tracking-[0.72px]">
          {value}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {isUp ? <ArrowUpCircle className="w-5 h-5 text-[#16a34a]" /> : <ArrowDownCircle className="w-5 h-5 text-[#ef4444]" />}
        <span className={cn(
          "font-['SVN-Gilroy:SemiBold',sans-serif] text-[14px] tracking-[0.42px]",
          isUp ? "text-[#16a34a]" : "text-[#ef4444]"
        )}>
          {isUp ? '+' : ''}{change}%
        </span>
        <span className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[14px] text-[#868f9e] tracking-[0.42px]">
          so với tháng trước
        </span>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    SUCCESS: "bg-[#d1fae5] text-[#065f46]",
    PENDING: "bg-[#fef3c7] text-[#d97706]",
    FAILED: "bg-[#fee2e2] text-[#ef4444]"
  } as any

  const labels = {
    SUCCESS: "Hoàn tất",
    PENDING: "Đang xử lý",
    FAILED: "Thất bại"
  } as any

  return (
    <div className={cn(
      "px-2 py-1 rounded-full text-center text-[14px] font-['SVN-Gilroy:Regular',sans-serif]",
      styles[status] || "bg-gray-100 text-gray-600"
    )}>
      {labels[status] || status}
    </div>
  )
}

const now = new Date();
