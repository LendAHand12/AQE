import { useState, useEffect } from "react"
import { 
  Search, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Wallet,
  Clock,
  Filter
} from "lucide-react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import dayjs from "dayjs"
import { cn } from "@/lib/utils"
import { Pagination } from "@/components/common/Pagination"

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [fetching, setFetching] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  
  // Dialog states
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null)
  const [txHash, setTxHash] = useState("")

  const ITEMS_PER_PAGE = 10

  const fetchWithdrawals = async () => {
    if (page === 1) setLoading(true)
    else setFetching(true)
    try {
      const response = await apiClient.get(`/withdrawals/admin/all`, {
        params: {
          page,
          limit: ITEMS_PER_PAGE,
          search: searchTerm,
          status: statusFilter
        }
      })
      setWithdrawals(response.data.withdrawals)
      setTotalPages(response.data.pages)
      setTotalItems(response.data.total)
    } catch (err: any) {
      toast.error("Không thể tải danh sách rút tiền")
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchWithdrawals()
  }, [page, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1)
      else fetchWithdrawals()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleApprove = async () => {
    if (!txHash.trim()) {
      toast.error("Vui lòng nhập mã hash giao dịch")
      return
    }
    
    setProcessingId(selectedWithdrawal._id)
    try {
      await apiClient.put(`/withdrawals/admin/${selectedWithdrawal._id}/approve`, {
        hash: txHash
      })
      toast.success("Đã phê duyệt yêu cầu rút tiền")
      setIsApproveOpen(false)
      setTxHash("")
      fetchWithdrawals()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi phê duyệt")
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async () => {
    setProcessingId(selectedWithdrawal._id)
    try {
      await apiClient.put(`/withdrawals/admin/${selectedWithdrawal._id}/reject`)
      toast.success("Đã từ chối và hoàn tiền")
      setIsRejectOpen(false)
      fetchWithdrawals()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi từ chối")
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 text-[#276152] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[24px] shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input 
            placeholder="Tìm kiếm địa chỉ ví, mã hash..." 
            className="pl-12 h-12 border-gray-100 focus-visible:ring-[#276152] rounded-[16px] text-md" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400 ml-2" />
          <select 
            className="h-12 px-4 rounded-[16px] border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#276152] bg-white text-sm font-bold"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Đang chờ</option>
            <option value="SUCCESS">Thành công</option>
            <option value="FAILED">Đã từ chối</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-b border-gray-100 hover:bg-transparent">
                <TableHead className="py-6 font-bold text-[#111827] pl-8">Thời gian</TableHead>
                <TableHead className="font-bold text-[#111827]">Người dùng</TableHead>
                <TableHead className="font-bold text-[#111827]">Ví nhận</TableHead>
                <TableHead className="font-bold text-[#111827] text-right">Số tiền</TableHead>
                <TableHead className="font-bold text-[#111827] text-center">Phương thức</TableHead>
                <TableHead className="font-bold text-[#111827] text-center">Trạng thái</TableHead>
                <TableHead className="font-bold text-[#111827] pr-8 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-60 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <Wallet size={48} />
                      <p className="font-bold">Không tìm thấy yêu cầu rút tiền nào</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                withdrawals.map((item) => (
                  <TableRow key={item._id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-5 pl-8">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#111827]">{dayjs(item.createdAt).format("DD/MM/YYYY")}</span>
                        <span className="text-xs text-gray-400">{dayjs(item.createdAt).format("HH:mm:ss")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#111827]">{item.userId?.username}</span>
                        <span className="text-xs text-gray-400">{item.userId?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded w-fit border border-gray-100">
                          {item.walletAddress.substring(0, 8)}...{item.walletAddress.substring(item.walletAddress.length - 8)}
                        </span>
                        {item.hash && (
                          <a 
                            href={`https://bscscan.com/tx/${item.hash}`} 
                            target="_blank" 
                            className="text-[10px] text-[#276152] hover:underline flex items-center gap-1 font-bold"
                          >
                            Xem trên BscScan <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col">
                        <span className="font-black text-[#111827]">{item.amount.toLocaleString()} USDT</span>
                        <span className="text-[10px] text-gray-400 font-bold">Phí: {item.fee || 1} USDT</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Badge className={cn(
                          "rounded-full font-bold border-none px-3 py-1 text-[10px]",
                          item.method === 'AUTO' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {item.method}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <div className={cn(
                          "rounded-full px-3 py-1 flex items-center gap-2 text-[11px] font-bold",
                          item.status === 'SUCCESS' ? "bg-emerald-100 text-emerald-700" : 
                          item.status === 'FAILED' ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {item.status === 'PENDING' && <Clock size={12} className="animate-pulse" />}
                          {item.status === 'SUCCESS' ? "Thành công" : 
                           item.status === 'FAILED' ? "Đã từ chối" : "Đang chờ"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      {item.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setSelectedWithdrawal(item)
                              setIsApproveOpen(true)
                            }}
                            className="bg-[#276152] hover:bg-[#1e4d40] text-white rounded-full size-8 p-0"
                          >
                            <CheckCircle2 size={16} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedWithdrawal(item)
                              setIsRejectOpen(true)
                            }}
                            className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full size-8 p-0"
                          >
                            <XCircle size={16} />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 font-bold italic">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Pagination 
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        disabled={fetching}
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* Approve Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="rounded-[32px] max-w-md p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-[26px] font-black text-gray-900 leading-tight">Phê duyệt rút tiền</DialogTitle>
            <DialogDescription className="text-[14px] text-gray-500">
              Vui lòng nhập mã giao dịch (Hash) sau khi bạn đã chuyển khoản thủ công cho người dùng.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-5">
            <div className="p-5 bg-emerald-50 rounded-[20px] border border-emerald-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-emerald-700 font-bold text-sm">Số tiền cần chuyển:</span>
                <span className="font-black text-[28px] text-emerald-900 leading-none">
                  {selectedWithdrawal?.amount.toLocaleString()} <span className="text-lg">USDT</span>
                </span>
              </div>
              <div className="space-y-1.5">
                <span className="text-emerald-700 font-bold text-sm block">Địa chỉ ví nhận:</span>
                <div className="bg-white p-3 rounded-[12px] border border-emerald-100 break-all">
                   <span className="font-mono text-[13px] font-bold text-gray-700 leading-relaxed">
                     {selectedWithdrawal?.walletAddress}
                   </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-md font-black text-gray-900">Mã Hash giao dịch (TxHash)</label>
              <Input 
                placeholder="Dán mã giao dịch tại đây..." 
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="h-14 rounded-[14px] text-md border-gray-200 focus:ring-[#276152]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsApproveOpen(false)} className="rounded-[12px] font-bold h-12 px-6">Hủy</Button>
            <Button 
              onClick={handleApprove} 
              disabled={!!processingId}
              className="bg-[#276152] hover:bg-[#1e4d40] text-white rounded-[14px] font-black px-8 h-12 text-md flex-1 shadow-md shadow-emerald-900/10"
            >
              {processingId ? <Loader2 className="animate-spin size-5" /> : "Xác nhận & Duyệt ngay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="rounded-[32px] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[24px] font-black text-red-900">Từ chối rút tiền</DialogTitle>
            <DialogDescription className="text-gray-500">
              Hành động này sẽ từ chối yêu cầu và **hoàn trả lại toàn bộ số dư** (bao gồm phí) cho tài khoản người dùng.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="p-4 bg-red-50 rounded-[16px] border border-red-100 space-y-2">
              <div className="flex justify-between text-sm text-red-700">
                <span>Người dùng:</span>
                <span className="font-bold">{selectedWithdrawal?.userId?.username}</span>
              </div>
              <div className="flex justify-between text-sm text-red-700">
                <span>Số dư hoàn trả:</span>
                <span className="font-black">{(selectedWithdrawal?.amount + (selectedWithdrawal?.fee || 1)).toLocaleString()} USDT</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsRejectOpen(false)} className="rounded-[12px] font-bold">Hủy</Button>
            <Button 
              onClick={handleReject} 
              disabled={!!processingId}
              variant="destructive"
              className="rounded-[12px] font-bold px-8 h-12"
            >
              {processingId ? <Loader2 className="animate-spin size-4" /> : "Xác nhận Từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
