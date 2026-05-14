import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { 
  Search, 
  Loader2,
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
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import { Pagination } from "@/components/common/Pagination"
import dayjs from "dayjs"
import { getImageUrl } from "@/lib/utils"

export default function AdminWalletConnectionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  
  // Initialize from search params
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"))
  
  const ITEMS_PER_PAGE = 20

  const [totalPages, setTotalPages] = useState(1)
  const [fetching, setFetching] = useState(false)
  
  const fetchConnections = async () => {
    if (page === 1) setLoading(true)
    else setFetching(true)
    
    try {
      const response = await apiClient.get(`/admin/wallet-connections?page=${page}&limit=${ITEMS_PER_PAGE}&search=${searchTerm}`)
      setConnections(response.data.connections)
      setTotalPages(response.data.pages)
      setTotalItems(response.data.total)
    } catch (err: any) {
      toast.error("Không thể tải lịch sử kết nối ví")
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }

  // Update search params when state changes
  useEffect(() => {
    const params: any = { page: page.toString() }
    if (searchTerm) params.search = searchTerm
    setSearchParams(params, { replace: true })
  }, [page, searchTerm])

  useEffect(() => {
    fetchConnections()
  }, [page])


  // Reset page when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only reset to page 1 if we're not on page 1
      if (page !== 1) {
        setPage(1)
      } else {
        fetchConnections()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 text-[#276152] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-10 pt-4">
      <div className="space-y-4">
        {/* Filter Area */}
        <div className="flex justify-between items-center">
          <p className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[18px] text-[#276152] tracking-[0.54px]">Danh sách kết nối</p>
          <div className="flex gap-3">
            <div className="relative w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Tìm kiếm người dùng..." 
                className="w-full pl-10 pr-4 py-2.5 border border-[#d5d7db] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#276152] font-['SVN-Gilroy:Regular',sans-serif] text-[16px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-[16px] border border-[rgba(239,239,239,0.5)] overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-[#d9ede8]">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="py-4 px-4 font-['SVN-Gilroy:SemiBold',sans-serif] text-[#0d1f1d] text-[16px] tracking-[0.48px] h-[44px]">Thời gian</TableHead>
                <TableHead className="py-4 px-4 font-['SVN-Gilroy:SemiBold',sans-serif] text-[#0d1f1d] text-[16px] tracking-[0.48px] h-[44px]">Người dùng</TableHead>
                <TableHead className="py-4 px-4 font-['SVN-Gilroy:SemiBold',sans-serif] text-[#0d1f1d] text-[16px] tracking-[0.48px] h-[44px]">Email</TableHead>
                <TableHead className="py-4 px-4 font-['SVN-Gilroy:SemiBold',sans-serif] text-[#0d1f1d] text-[16px] tracking-[0.48px] h-[44px]">Địa chỉ ví</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connections.map((item) => (
                <TableRow key={item._id} className="border-b border-[rgba(239,239,239,0.5)] hover:bg-gray-50 transition-colors">
                  <TableCell className="py-4 px-4 font-['SVN-Gilroy:Regular',sans-serif] text-[#111827] text-[16px]">
                    <div className="flex flex-col">
                        <span className="font-bold">{dayjs(item.createdAt).format("DD/MM/YYYY")}</span>
                        <span className="text-xs text-gray-400">{dayjs(item.createdAt).format("HH:mm:ss")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4 font-['SVN-Gilroy:Regular',sans-serif] text-[#111827] text-[16px]">
                    {item.user ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#276152] text-white flex items-center justify-center text-xs font-bold overflow-hidden uppercase">
                            {item.user.avatar ? (
                              <img src={getImageUrl(item.user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span>{item.user.fullName?.charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.user.fullName}</span>
                            <span className="text-[12px] text-gray-400">@{item.user.username}</span>
                          </div>
                        </div>
                    ) : (
                        <span className="text-gray-400 italic">User deleted</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-4 font-['SVN-Gilroy:Regular',sans-serif] text-[#111827] text-[16px]">
                     {item.user?.email || '-'}
                  </TableCell>
                  <TableCell className="py-4 px-4">
                     <div className="flex items-center gap-2">
                         <div className="size-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                             <Wallet size={12} />
                         </div>
                         <span className="font-mono font-bold text-[#111827] bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                             {item.walletAddress}
                         </span>
                         {item.walletName && (
                             <span className="text-xs font-bold text-[#276152] bg-[#276152]/10 px-2 py-1 rounded-md ml-2">
                                 {item.walletName}
                             </span>
                         )}
                     </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {connections.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <Search className="w-12 h-12 text-gray-200 mx-auto" />
              <p className="text-gray-400 font-medium">Không tìm thấy lịch sử kết nối ví nào phù hợp với từ khóa.</p>
            </div>
          )}
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
    </div>
  )
}
