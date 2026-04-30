import { useState, useEffect } from "react"
import { 
  CreditCard, 
  Search,
  Loader2,
  Calendar,
  Wallet,
  ArrowRight
} from "lucide-react"
import { useTranslation } from "react-i18next"
import apiClient from "@/lib/axios"
import { Input } from "@/components/ui/input"
import dayjs from "dayjs"
import { cn } from "@/lib/utils"
import { Pagination } from "@/components/common/Pagination"

interface Transaction {
  _id: string;
  hash: string;
  amount: number;
  usdtAmount: number;
  symbol: string;
  type: string;
  status: string;
  phase: string;
  createdAt: string;
  isReleased?: boolean;
  description?: string;
}

export default function PaymentHistoryPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Transaction[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [fetching, setFetching] = useState(false)
  const [summary, setSummary] = useState<any>({
    totalPaid: 0
  })

  const fetchPayments = async () => {
    if (page === 1) setLoading(true)
    else setFetching(true)
    try {
      const res = await apiClient.get(`/payments/my-payments?page=${page}&limit=10`)
      setPayments(res.data.transactions)
      setTotalPages(res.data.pages)
      setSummary(res.data.summary)
    } catch (err) {
      console.error("Fetch payments error:", err)
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [page])

  const filteredPayments = payments.filter(p => 
    p.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          {t("payments.title") || "Lịch sử thanh toán"}
        </h1>
        <p className="text-[#636D7D] text-[16px]">
          {t("payments.subtitle") || "Theo dõi các giao dịch thanh toán mua AQE sớm của bạn"}
        </p>
      </div>

      <div className="space-y-6">
        {/* Summary Mini Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#16A34A]/10 p-4 rounded-[12px] flex flex-col gap-1 border border-[#16A34A]/20">
            <p className="text-[16px] text-[#0D1F1D] font-medium">{t("payments.summary.total_paid")}</p>
            <p className="text-[24px] font-bold text-[#16A34A] tracking-tight">
              {summary.totalPaid.toLocaleString()} USDT
            </p>
          </div>
        </div>

        {/* Filters Area */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative w-full lg:w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#868F9E]" />
            <Input 
              placeholder={t("balance_history.search_placeholder") || "Tìm kiếm theo mã giao dịch..."}
              className="h-[44px] pl-10 rounded-[8px] border-[#9CA3AF] focus-visible:ring-[#276152]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          

        </div>

        {/* Data Table */}
        <div className="bg-white border border-[#EFEFEF] rounded-[16px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#EFEFEF]/50">
                  <th className="px-6 py-3 text-[12px] font-bold text-[#276152] uppercase tracking-wider">{t("payments.table.date")}</th>
                  <th className="px-6 py-3 text-[12px] font-bold text-[#276152] uppercase tracking-wider">{t("payments.table.description")}</th>
                  <th className="px-6 py-3 text-[12px] font-bold text-[#276152] uppercase tracking-wider text-right">{t("payments.table.amount")}</th>
                  <th className="px-6 py-3 text-[12px] font-bold text-[#276152] uppercase tracking-wider text-center">{t("payments.table.status")}</th>
                  <th className="px-6 py-3 text-[12px] font-bold text-[#276152] uppercase tracking-wider text-center">{t("payments.table.details")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFEF]">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-[#868F9E]">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <CreditCard size={64} />
                        <p className="text-[18px] font-medium">{t("payments.empty") || "Chưa có giao dịch thanh toán"}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-[#111827]">
                            {dayjs(p.createdAt).format("DD/MM/YYYY")}
                          </span>
                          <span className="text-[12px] text-[#868F9E]">{dayjs(p.createdAt).format("HH:mm:ss")}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "size-8 rounded-lg flex items-center justify-center",
                            p.type === 'BUY' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                          )}>
                             {p.type === 'BUY' ? <Wallet size={16} /> : <Calendar size={16} />}
                          </div>
                          <div>
                            <p className="text-[12px] text-[#868F9E] font-medium">
                              {p.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                         <span className="text-[14px] font-bold text-[#111827]">
                            {p.amount ? `${p.amount.toLocaleString()} USDT` : "---"}
                         </span>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex justify-center">
                           <div className={cn(
                             "rounded-full px-3 py-1 flex items-center gap-2 text-[11px] font-bold",
                             p.status === 'SUCCESS' ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEF3C7] text-[#92400E]"
                           )}>
                             {p.status === 'SUCCESS' ? t("payments.status.success") : t("payments.status.pending")}
                           </div>
                         </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <code className="text-[11px] text-[#868F9E] font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100">
                             {p.hash.slice(0, 6)}...{p.hash.slice(-4)}
                          </code>
                          <a 
                            href={`https://bscscan.com/tx/${p.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#276152] hover:bg-[#276152]/5 p-1.5 rounded-full transition-colors"
                          >
                             <ArrowRight size={18} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={fetching}
        />
      </div>
    </div>
  )
}
