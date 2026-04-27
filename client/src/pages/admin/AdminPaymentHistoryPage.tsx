import { useState, useEffect } from "react"
import { 
  Search, 
  Loader2,
  ExternalLink,
  Wallet
} from "lucide-react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import dayjs from "dayjs"
import { cn } from "@/lib/utils"
import { Pagination } from "@/components/common/Pagination"

export default function AdminPaymentHistoryPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [fetching, setFetching] = useState(false)

  const fetchTransactions = async () => {
    if (page === 1) setLoading(true)
    else setFetching(true)
    try {
      const response = await apiClient.get(`/admin/transactions?category=USDT&page=${page}&limit=20&search=${searchTerm}`)
      setTransactions(response.data.transactions)
      setTotalPages(response.data.pages)
    } catch (err: any) {
      toast.error("Không thể tải danh sách thanh toán")
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [page])

  useEffect(() => {
    const timer = setTimeout(() => {
        if (page !== 1) setPage(1)
        else fetchTransactions()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const filteredTransactions = transactions; // Now filtered by backend

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 text-[#276152] animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-[32px] font-bold text-[#111827] flex items-center gap-3">
            <Wallet className="w-8 h-8 text-[#276152]" /> Lịch sử thanh toán USDT
          </h1>
          <p className="text-gray-500">Danh sách các giao dịch nạp tiền và thanh toán bằng USDT.</p>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-white p-2 rounded-[16px] shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input 
            placeholder="Tìm kiếm người dùng, mã hash..." 
            className="pl-12 h-12 border-none focus-visible:ring-0 text-md" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-[#f8faf9]">
            <TableRow className="border-b border-gray-100">
              <TableHead className="py-6 font-bold text-[#111827] pl-8">Thời gian</TableHead>
              <TableHead className="font-bold text-[#111827]">Người thực hiện</TableHead>
              <TableHead className="font-bold text-[#111827]">Loại giao dịch</TableHead>
              <TableHead className="font-bold text-[#111827] text-right">Số tiền (USDT)</TableHead>
              <TableHead className="font-bold text-[#111827] text-center">Trạng thái</TableHead>
              <TableHead className="font-bold text-[#111827] pr-8 text-right">Mã Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((tx) => (
              <TableRow key={tx._id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="py-5 pl-8">
                  <div className="flex flex-col">
                    <span className="font-bold">{dayjs(tx.createdAt).format("DD/MM/YYYY")}</span>
                    <span className="text-xs text-gray-400">{dayjs(tx.createdAt).format("HH:mm:ss")}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {(tx.type === 'BUY' || tx.type === 'REWARD') ? (
                     <div className="flex flex-col">
                        <span className="font-bold text-[#111827]">{tx.to?.username}</span>
                        <span className="text-xs text-gray-400">{tx.to?.fullName}</span>
                     </div>
                  ) : tx.from && typeof tx.from === 'object' ? (
                     <div className="flex flex-col">
                        <span className="font-bold text-[#111827]">{tx.from.username}</span>
                        <span className="text-xs text-gray-400">{tx.from.fullName}</span>
                     </div>
                  ) : (
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-none font-bold uppercase text-[10px]">
                      {tx.from || "Hệ thống / Ví"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={cn(
                    "rounded-full font-bold border-none",
                    tx.type === 'DEPOSIT' ? "bg-blue-100 text-blue-700" : 
                    tx.type === 'WITHDRAW' ? "bg-amber-100 text-amber-700" :
                    tx.type === 'BUY' ? "bg-emerald-100 text-emerald-800" :
                    "bg-gray-100 text-gray-700"
                  )}>
                    {tx.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold text-emerald-600">
                  {(tx.usdtAmount || tx.amount)?.toLocaleString()} USDT
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <Badge className="bg-green-100 text-green-700 border-none rounded-full px-3 py-1 font-bold">
                      Thành công
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <a href={`https://bscscan.com/tx/${tx.hash}`} target="_blank" className="font-mono text-xs text-gray-400 hover:text-[#276152] flex items-center justify-end gap-1">
                    {tx.hash?.substring(0,6)}...{tx.hash?.substring(tx.hash.length-4)} <ExternalLink size={12}/>
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination 
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        disabled={fetching}
      />
    </div>
  )
}
