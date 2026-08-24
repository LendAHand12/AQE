import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import {
  Search,
  Loader2,
  Eye,
  ArrowLeftRight,
  Clock,
  Filter,
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
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import dayjs from "dayjs"
import { cn } from "@/lib/utils"
import { Pagination } from "@/components/common/Pagination"

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  AWAITING_WALLET: "Awaiting Wallet",
  AWAITING_TRANSFER: "Awaiting Transfer",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
}

export const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  AWAITING_WALLET: "bg-blue-100 text-blue-700",
  AWAITING_TRANSFER: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
}

export default function AdminSwapRequestsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [swapRequests, setSwapRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "")
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"))

  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [fetching, setFetching] = useState(false)

  const ITEMS_PER_PAGE = 10

  const fetchSwapRequests = async () => {
    if (page === 1) setLoading(true)
    else setFetching(true)
    try {
      const response = await apiClient.get(`/swap/admin/all`, {
        params: {
          page,
          limit: ITEMS_PER_PAGE,
          search: searchTerm,
          status: statusFilter
        }
      })
      setSwapRequests(response.data.swapRequests)
      setTotalPages(response.data.pages)
      setTotalItems(response.data.total)
    } catch (err: any) {
      toast.error("Could not load swap request list")
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }

  useEffect(() => {
    const params: any = { page: page.toString() }
    if (searchTerm) params.search = searchTerm
    if (statusFilter) params.status = statusFilter
    setSearchParams(params, { replace: true })
  }, [page, searchTerm, statusFilter])

  useEffect(() => {
    fetchSwapRequests()
  }, [page, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1)
      else fetchSwapRequests()
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
    <div className="space-y-8 max-w-[1400px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[24px] shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search name, email, phone, ID code, tx hash..."
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
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="AWAITING_WALLET">Awaiting Wallet</option>
            <option value="AWAITING_TRANSFER">Awaiting Transfer</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-b border-gray-100 hover:bg-transparent">
                <TableHead className="py-6 font-bold text-[#111827] pl-8">Time</TableHead>
                <TableHead className="font-bold text-[#111827]">Contact</TableHead>
                <TableHead className="font-bold text-[#111827] text-right">Amount</TableHead>
                <TableHead className="font-bold text-[#111827] text-center">Status</TableHead>
                <TableHead className="font-bold text-[#111827] pr-8 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {swapRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-60 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <ArrowLeftRight size={48} />
                      <p className="font-bold">No swap requests found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                swapRequests.map((item) => (
                  <TableRow
                    key={item._id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/swap-requests/${item._id}`)}
                  >
                    <TableCell className="py-5 pl-8">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#111827]">{dayjs(item.createdAt).format("DD/MM/YYYY")}</span>
                        <span className="text-xs text-gray-400">{dayjs(item.createdAt).format("HH:mm:ss")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#111827]">{item.fullName}</span>
                        <span className="text-xs text-gray-400">{item.email}</span>
                        <span className="text-xs text-gray-400">{item.countryCode} {item.phone} &middot; ID: {item.idCode}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col">
                        <span className="font-black text-[#111827]">{item.amount.toLocaleString()} HEWE</span>
                        <span className="text-[10px] text-emerald-600 font-bold">
                          → {(item.amount * (item.rateAtRequest ?? 1)).toLocaleString(undefined, { maximumFractionDigits: 6 })} {item.outputToken}
                        </span>
                        {item.sentAmount && (
                          <span className="text-[10px] text-gray-400 font-bold">Sent: {item.sentAmount.toLocaleString()}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Badge className={cn(
                          "rounded-full font-bold border-none px-3 py-1 text-[10px]",
                          STATUS_STYLES[item.status]
                        )}>
                          {item.status === 'PENDING' && <Clock size={12} className="animate-pulse mr-1" />}
                          {STATUS_LABELS[item.status] || item.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/swap-requests/${item._id}`)
                        }}
                        className="h-8 w-8 rounded-full text-[#276152] hover:bg-[#d9ede8]"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
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
    </div>
  )
}
