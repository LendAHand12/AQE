import { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { 
  Search, 
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import apiClient from "@/lib/axios"
import dayjs from "dayjs"
import { cn } from "@/lib/utils"
import { Pagination } from "@/components/common/Pagination"

export default function AdminTicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"))
  const [status, setStatus] = useState(searchParams.get("status") || "ALL")
  
  const [totalPages, setTotalPages] = useState(1)
  const [fetching, setFetching] = useState(false)

  const fetchTickets = async () => {
    if (page === 1) setLoading(true)
    else setFetching(true)
    try {
      const response = await apiClient.get(`/tickets/admin/all?page=${page}&limit=10${status !== 'ALL' ? `&status=${status}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`)
      // Note: Admin routes were created under /api/tickets/admin/all
      // so using apiClient.get('/tickets/admin/all...')
      setTickets(response.data.tickets)
      setTotalPages(response.data.pages)
    } catch (err) {
      console.error("Fetch admin tickets error:", err)
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }

  // Update search params
  useEffect(() => {
    const params: any = { page: page.toString() }
    if (searchTerm) params.search = searchTerm
    if (status !== 'ALL') params.status = status
    setSearchParams(params, { replace: true })
  }, [page, searchTerm, status])

  useEffect(() => {
    const timer = setTimeout(() => {
        if (page !== 1) setPage(1)
        else fetchTickets()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, status])

  useEffect(() => {
    fetchTickets()
  }, [page])

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'PENDING': return { color: "bg-yellow-100 text-yellow-700", icon: Clock, label: "Pending" }
      case 'IN_PROGRESS': return { color: "bg-blue-100 text-blue-700", icon: AlertCircle, label: "In Progress" }
      case 'RESOLVED': return { color: "bg-green-100 text-green-700", icon: CheckCircle2, label: "Resolved" }
      case 'CLOSED': return { color: "bg-gray-100 text-gray-700", icon: CheckCircle2, label: "Closed" }
      default: return { color: "bg-gray-100 text-gray-700", icon: Clock, label: status }
    }
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-8 pt-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-[16px] shadow-sm border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input 
            placeholder="Search by email, username, subject..." 
            className="pl-12 h-12 border-none focus-visible:ring-0 text-md bg-gray-50 rounded-[8px]" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[200px] h-12 bg-gray-50 border-none rounded-[8px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-10 h-10 text-[#276152] animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-[#f8faf9]">
              <TableRow className="border-b border-gray-100">
                <TableHead className="py-5 font-bold text-[#111827] pl-8">User</TableHead>
                <TableHead className="font-bold text-[#111827]">Subject</TableHead>
                <TableHead className="font-bold text-[#111827]">Created At</TableHead>
                <TableHead className="font-bold text-[#111827]">Status</TableHead>
                <TableHead className="font-bold text-[#111827] pr-8 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center text-gray-500">
                    No tickets found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => {
                  const config = getStatusConfig(ticket.status)
                  const Icon = config.icon
                  return (
                    <TableRow key={ticket._id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="py-5 pl-8">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#111827]">{ticket.userInfo?.fullName || ticket.userInfo?.username}</span>
                          <span className="text-xs text-gray-500">{ticket.userInfo?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{ticket.subject}</span>
                          <span className="text-xs text-gray-500 truncate max-w-[300px]">{ticket.message}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {dayjs(ticket.createdAt).format("MMM DD, YYYY HH:mm")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("border-none flex items-center gap-1.5 w-fit", config.color)}>
                          <Icon size={12} />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Link 
                          to={`/admin/tickets/${ticket._id}`}
                          className="inline-flex items-center gap-2 bg-[#f8faf9] hover:bg-[#eef2f0] text-[#276152] px-4 py-2 rounded-[8px] font-bold text-sm transition-colors border border-gray-200"
                        >
                          <Eye size={16} />
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={fetching}
        />
      )}
    </div>
  )
}
