import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { 
  Plus, 
  MessageSquare, 
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { useTranslation } from "react-i18next"
import apiClient from "@/lib/axios"
import dayjs from "dayjs"
import { cn } from "@/lib/utils"
import { Pagination } from "@/components/common/Pagination"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TicketsPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [fetching, setFetching] = useState(false)
  const [status, setStatus] = useState("ALL")

  const fetchTickets = async () => {
    if (page === 1) setLoading(true)
    else setFetching(true)
    try {
      const res = await apiClient.get(`/tickets/user?page=${page}&limit=10${status !== "ALL" ? `&status=${status}` : ""}`)
      setTickets(res.data.tickets)
      setTotalPages(res.data.pages)
    } catch (err) {
      console.error("Fetch tickets error:", err)
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [page, status])

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'PENDING': return { color: "bg-yellow-100 text-yellow-700", icon: Clock, label: t("ticket.status_pending") }
      case 'IN_PROGRESS': return { color: "bg-blue-100 text-blue-700", icon: AlertCircle, label: t("ticket.status_in_progress") }
      case 'RESOLVED': return { color: "bg-green-100 text-green-700", icon: CheckCircle2, label: t("ticket.status_resolved") }
      case 'CLOSED': return { color: "bg-gray-100 text-gray-700", icon: CheckCircle2, label: t("ticket.status_closed") }
      default: return { color: "bg-gray-100 text-gray-700", icon: Clock, label: status }
    }
  }

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#276152]" />
    </div>
  )

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 font-sans pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-[32px] font-bold text-[#111827] tracking-tight">{t("ticket.title")}</h1>
          <p className="text-[#636D7D] text-[16px]">{t("ticket.subtitle")}</p>
        </div>
        <Link 
          to="/tickets/create"
          className="flex items-center gap-2 bg-[#276152] text-white px-5 py-2.5 rounded-[8px] font-bold hover:bg-[#1e4b40] transition-colors shadow-sm"
        >
          <Plus size={20} />
          {t("ticket.create_btn")}
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
          <SelectTrigger className="w-[180px] h-11 bg-white border-gray-200">
            <SelectValue placeholder={t("ticket.filter_status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("ticket.status_all")}</SelectItem>
            <SelectItem value="PENDING">{t("ticket.status_pending")}</SelectItem>
            <SelectItem value="IN_PROGRESS">{t("ticket.status_in_progress")}</SelectItem>
            <SelectItem value="RESOLVED">{t("ticket.status_resolved")}</SelectItem>
            <SelectItem value="CLOSED">{t("ticket.status_closed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {tickets.length === 0 ? (
          <div className="bg-white border border-[#EFEFEF] rounded-[16px] p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <MessageSquare size={48} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t("ticket.no_tickets")}</h3>
            <p className="text-gray-500 mb-6">{t("ticket.no_tickets_desc")}</p>
            <Link 
              to="/tickets/create"
              className="bg-[#276152] text-white px-6 py-2 rounded-full font-bold hover:bg-[#1e4b40] transition-colors"
            >
              {t("ticket.create_first")}
            </Link>
          </div>
        ) : (
          tickets.map(ticket => {
            const config = getStatusConfig(ticket.status);
            const Icon = config.icon;
            return (
              <Link 
                key={ticket._id}
                to={`/tickets/${ticket._id}`}
                className="block bg-white border border-[#EFEFEF] rounded-[16px] p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-[#111827]">{ticket.subject}</h3>
                      <Badge className={cn("border-none flex items-center gap-1.5", config.color)}>
                        <Icon size={12} />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-2 pr-4">{ticket.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400 font-medium pt-2">
                      <span>{t("ticket.created_at")} {dayjs(ticket.createdAt).format("MMM DD, YYYY HH:mm")}</span>
                      {ticket.adminResponseAt && (
                        <span className="text-[#276152]">{t("ticket.replied_at")} {dayjs(ticket.adminResponseAt).format("MMM DD, YYYY HH:mm")}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

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
