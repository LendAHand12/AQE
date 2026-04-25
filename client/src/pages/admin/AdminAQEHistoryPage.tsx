import { useState, useEffect } from "react"
import { 
  Coins, 
  Search, 
  Loader2,
  ExternalLink,
  Zap,
  CheckCircle
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

export default function AdminAQEHistoryPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchData = async () => {
    try {
      const response = await apiClient.get("/admin/transactions")
      // Filter for AQE that is RELEASED (Official)
      const aqeOnly = response.data.filter((t: any) => t.symbol === 'AQE' && t.isReleased === true)
      setData(aqeOnly)
    } catch (err: any) {
      toast.error("Không thể tải danh sách trả AQE")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = data.filter(tx => {
    const userDisplay = tx.to?.username || tx.to?.fullName || ""
    return userDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (tx.hash || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            <Coins className="w-8 h-8 text-amber-500" /> Phân phối AQE Chính thức
          </h1>
          <p className="text-gray-500">Báo cáo các khoản AQE đã được chuyển vào số dư chính thức của người dùng.</p>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-white p-2 rounded-[16px] shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input 
            placeholder="Tìm kiếm người nhận (username, tên)..." 
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
              <TableHead className="font-bold text-[#111827]">Người nhận</TableHead>
              <TableHead className="font-bold text-[#111827]">Nguồn trả</TableHead>
              <TableHead className="font-bold text-[#111827]">Sự kiện</TableHead>
              <TableHead className="font-bold text-[#111827] text-right">Số lượng (AQE)</TableHead>
              <TableHead className="font-bold text-[#111827] pr-8 text-right">Mã Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((tx) => (
              <TableRow key={tx._id} className="hover:bg-amber-50/20 transition-colors">
                <TableCell className="py-5 pl-8">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">{dayjs(tx.createdAt).format("DD/MM/YYYY")}</span>
                    <span className="text-[10px] text-gray-400 leading-none mt-1">{dayjs(tx.createdAt).format("HH:mm:ss")}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-[#111827]">{tx.to?.username}</span>
                    <span className="text-[10px] text-gray-400">{tx.to?.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                   <Badge variant="outline" className="border-none bg-amber-50 text-amber-700 font-bold text-[9px] uppercase">
                      Hợp đồng AQE
                   </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn(
                    "rounded-full text-[10px] font-bold px-3",
                    tx.type === 'BUY' ? "bg-emerald-100 text-emerald-800" :
                    tx.type === 'REWARD' ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                  )}>
                    {tx.type === 'BUY' ? "Mua Token" : "Thưởng Promotion"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-[16px] font-black text-amber-600">
                      {tx.amount?.toLocaleString()} AQE
                    </span>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-green-600 uppercase">
                      <CheckCircle size={10} /> Đã cộng số dư
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-8">
                   <a href={`https://bscscan.com/tx/${tx.hash}`} target="_blank" className="font-mono text-xs text-gray-300 hover:text-[#276152] inline-flex items-center gap-1">
                    {tx.hash?.substring(0,6)}... <ExternalLink size={10}/>
                   </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredData.length === 0 && (
           <div className="py-20 text-center text-gray-400">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-10" />
              Chưa có AQE chính thức nào được phân phối.
           </div>
        )}
      </div>
    </div>
  )
}
