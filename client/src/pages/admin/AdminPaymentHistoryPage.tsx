import { useState, useEffect } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { 
  Search, 
  Loader2,
  Check,
  X,
  ExternalLink
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
  const [searchParams, setSearchParams] = useSearchParams()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Initialize from search params
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"))
  
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [fetching, setFetching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const ITEMS_PER_PAGE = 10

  const handleApprove = async (paymentId: string) => {
    if (!window.confirm("Are you sure you want to APPROVE this transaction?")) return;
    setActionLoading(paymentId);
    try {
      await apiClient.post('/admin/transactions/approve', { paymentId });
      toast.success("Transaction approved successfully");
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error approving transaction");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    const reason = window.prompt("Rejection reason (optional):");
    if (reason === null) return;
    
    setActionLoading(paymentId);
    try {
      await apiClient.post('/admin/transactions/reject', { paymentId, reason });
      toast.error("Transaction rejected");
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error rejecting transaction");
    } finally {
      setActionLoading(null);
    }
  };

  const fetchTransactions = async () => {
    if (page === 1) setLoading(true)
    else setFetching(true)
    try {
      const response = await apiClient.get(`/admin/transactions?category=USDT&page=${page}&limit=${ITEMS_PER_PAGE}&search=${searchTerm}`)
      setTransactions(response.data.transactions)
      setTotalPages(response.data.pages)
      setTotalItems(response.data.total)

    } catch (err: any) {
      toast.error("Could not load payment list")
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
    <div className="space-y-8 max-w-[1400px] mx-auto">


      <div className="flex gap-4 items-center bg-white p-2 rounded-[16px] shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input 
            placeholder="Search users, hash..." 
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
              <TableHead className="py-6 font-bold text-[#111827] pl-8">Time</TableHead>
              <TableHead className="font-bold text-[#111827]">User</TableHead>
              <TableHead className="font-bold text-[#111827]">Payment ID</TableHead>
              <TableHead className="font-bold text-[#111827]">Type</TableHead>
              <TableHead className="font-bold text-[#111827]">Method</TableHead>
              <TableHead className="font-bold text-[#111827] text-right">Amount (USDT)</TableHead>
              <TableHead className="font-bold text-[#111827] text-center">Status</TableHead>
              <TableHead className="font-bold text-[#111827] pr-8 text-right">Hash</TableHead>
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
                     <Link 
                       to={`/admin/users/${tx.to?._id}`}
                       className="flex flex-col hover:opacity-70 transition-opacity"
                     >
                        <span className="font-bold text-[#111827]">@{tx.to?.username}</span>
                        <span className="text-xs text-gray-400">{tx.to?.fullName}</span>
                     </Link>
                  ) : tx.from && typeof tx.from === 'object' ? (
                     <Link 
                       to={`/admin/users/${tx.from?._id}`}
                       className="flex flex-col hover:opacity-70 transition-opacity"
                     >
                        <span className="font-bold text-[#111827]">@{tx.from.username}</span>
                        <span className="text-xs text-gray-400">{tx.from.fullName}</span>
                     </Link>
                  ) : (
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-none font-bold uppercase text-[10px]">
                      {tx.from || "System / Wallet"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-mono text-[13px] text-gray-500">
                  {tx.paymentId || "N/A"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge className={cn(
                      "w-fit rounded-full font-bold border-none",
                      tx.type === 'DEPOSIT' ? "bg-blue-100 text-blue-700" : 
                      tx.type === 'WITHDRAW' ? "bg-amber-100 text-amber-700" :
                      tx.type === 'BUY' ? "bg-emerald-100 text-emerald-800" :
                      tx.type === 'PAYMENT' ? "bg-emerald-100 text-emerald-700" :
                      "bg-gray-100 text-gray-700"
                    )}>
                      {tx.type}
                    </Badge>
                    {tx.metadata?.isManual && (
                      <Badge className="w-fit bg-amber-100 text-amber-700 border-none text-[9px] font-black uppercase">
                        Manual
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-bold text-gray-500">
                    {tx.metadata?.method === 'QR' ? (
                      <span className="flex items-center gap-1 text-purple-600">
                        <span className="size-1.5 rounded-full bg-purple-600" /> QR Code
                      </span>
                    ) : tx.metadata?.method === 'ZELLE' ? (
                      <span className="flex items-center gap-1 text-orange-500">
                        <span className="size-1.5 rounded-full bg-orange-500" /> Zelle
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-blue-600">
                        <span className="size-1.5 rounded-full bg-blue-600" /> Wallet Transfer
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right font-bold text-emerald-600">
                  {(tx.usdtAmount || tx.amount)?.toLocaleString()} USDT
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <Badge className={cn(
                      "border-none rounded-full px-3 py-1 font-bold",
                      tx.status === 'SUCCESS' ? "bg-green-100 text-green-700" :
                      tx.status === 'AWAITING_APPROVAL' ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {tx.status === 'SUCCESS' ? "Success" : 
                       tx.status === 'AWAITING_APPROVAL' ? "Awaiting Approval" : "Processing"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <div className="flex items-center justify-end gap-2">
                    {tx.status === 'AWAITING_APPROVAL' && (
                      <div className="flex items-center gap-1 mr-2">
                        <button 
                          onClick={() => handleApprove(tx.paymentId)}
                          disabled={!!actionLoading}
                          className="size-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-colors"
                          title="Approve"
                        >
                          {actionLoading === tx.paymentId ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        </button>
                        <button 
                          onClick={() => handleReject(tx.paymentId)}
                          disabled={!!actionLoading}
                          className="size-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                          title="Reject"
                        >
                          {actionLoading === tx.paymentId ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                        </button>
                      </div>
                    )}
                    {tx.hash ? (
                      tx.hash.startsWith('0x') ? (
                        <a href={`https://bscscan.com/tx/${tx.hash}`} target="_blank" className="font-mono text-xs text-gray-400 hover:text-[#276152] flex items-center justify-end gap-1">
                          {tx.hash?.substring(0,6)}...{tx.hash?.substring(tx.hash.length-4)} <ExternalLink size={12}/>
                        </a>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-medium italic">
                          {tx.hash}
                        </span>
                      )
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">No hash</span>
                    )}
                  </div>
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
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
      />

    </div>
  )
}
