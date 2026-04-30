import { useState, useEffect } from "react"
import { 
  Search, 
  Loader2,
  ArrowRight,
  UserPlus
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
import { Pagination } from "@/components/common/Pagination"

export default function AdminCommissionHistoryPage() {
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [fetching, setFetching] = useState(false)


  const fetchCommissions = async () => {
    if (page === 1) setLoading(true)
    else setFetching(true)
    try {
      const response = await apiClient.get(`/admin/transactions?category=COMMISSION&page=${page}&limit=20&search=${searchTerm}`)
      setCommissions(response.data.transactions)
      setTotalPages(response.data.pages)
      setTotalItems(response.data.total)

    } catch (err: any) {
      toast.error("Không thể tải danh sách hoa hồng")
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchCommissions()
  }, [page])

  useEffect(() => {
    const timer = setTimeout(() => {
        if (page !== 1) setPage(1)
        else fetchCommissions()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const filteredCommissions = commissions; // Now filtered by backend

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 text-[#276152] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">


      <div className="flex gap-4 items-center bg-white p-2 rounded-[16px] shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input 
            placeholder="Tìm theo tên người giới thiệu hoặc người được giới thiệu..." 
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
              <TableHead className="font-bold text-[#111827]">Người được giới thiệu (F)</TableHead>
              <TableHead className="w-10"></TableHead>
              <TableHead className="font-bold text-[#111827]">Người nhận hoa hồng</TableHead>
              <TableHead className="font-bold text-[#111827] text-right">Số tiền (USDT)</TableHead>
              <TableHead className="font-bold text-[#111827] pr-8 text-right">Nội dung</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCommissions.map((tx) => (
              <TableRow key={tx._id} className="hover:bg-amber-50/30 transition-colors">
                <TableCell className="py-5 pl-8 text-xs text-gray-400 font-medium">
                  {dayjs(tx.createdAt).format("DD/MM/YYYY HH:mm")}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-[#111827]">{tx.from?.username}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Người phát sinh doanh số</span>
                  </div>
                </TableCell>
                <TableCell>
                  <ArrowRight size={16} className="text-gray-300" />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-[#276152]">{tx.to?.username}</span>
                    <Badge variant="outline" className="w-fit text-[9px] mt-1 bg-green-50 text-green-700 border-none font-bold">
                       {tx.description?.includes("F1") ? "HOA HỒNG F1" : "HOA HỒNG F2"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-[16px] font-bold text-amber-600">+{tx.amount?.toLocaleString()} USDT</span>
                </TableCell>
                <TableCell className="text-right pr-8 text-xs text-gray-500 italic">
                  {tx.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredCommissions.length === 0 && (
           <div className="py-20 text-center text-gray-400">
              <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-20" />
              Chưa có dữ liệu hoa hồng nào được ghi nhận.
           </div>
        )}
      </div>

      <Pagination 
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        disabled={fetching}
        totalItems={totalItems}
        itemsPerPage={20}
      />

    </div>
  )
}
