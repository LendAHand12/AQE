import { useState, useEffect } from "react"
import { 
  Users, 
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

export default function AdminCommissionHistoryPage() {
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchCommissions = async () => {
    try {
      const response = await apiClient.get("/admin/transactions")
      const commsOnly = response.data.filter((t: any) => t.type === 'COMMISSION')
      setCommissions(commsOnly)
    } catch (err: any) {
      toast.error("Không thể tải danh sách hoa hồng")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommissions()
  }, [])

  const filteredCommissions = commissions.filter(tx => {
    const fromUser = tx.from?.username || tx.from?.fullName || ""
    const toUser = tx.to?.username || tx.to?.fullName || ""
    
    return fromUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
           toUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (tx.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  })

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
            <Users className="w-8 h-8 text-[#276152]" /> Lịch sử hoa hồng hệ thống
          </h1>
          <p className="text-gray-500">Giám sát việc chi trả hoa hồng F1/F2 giữa các thành viên.</p>
        </div>
      </div>

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
                  {dayjs(tx.createdAt).format("DD/MM HH:mm")}
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
    </div>
  )
}
