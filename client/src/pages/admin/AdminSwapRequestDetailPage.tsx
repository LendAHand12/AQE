import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  Hash,
  Wallet,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useAdminPermissions } from "@/hooks/useAdminPermissions"
import { STATUS_LABELS, STATUS_STYLES } from "./AdminSwapRequestsPage"

const AMC20_EXPLORER_URL = import.meta.env.VITE_AMC20_EXPLORER_URL

export default function AdminSwapRequestDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAdminPermissions()
  const canApprove = hasPermission('SWAP_APPROVE')

  const [loading, setLoading] = useState(true)
  const [swapRequest, setSwapRequest] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [sentAmount, setSentAmount] = useState("")
  const [completionTxHash, setCompletionTxHash] = useState("")
  const [completionNote, setCompletionNote] = useState("")

  const fetchSwapRequest = async () => {
    try {
      const res = await apiClient.get(`/swap/admin/${id}`)
      setSwapRequest(res.data)
      if (res.data.status === 'AWAITING_TRANSFER' && !sentAmount) {
        setSentAmount(
          res.data.amount
            ? (res.data.amount * (res.data.rateAtRequest ?? 1)).toString()
            : ""
        )
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not load swap request")
      navigate("/admin/swap-requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSwapRequest()
  }, [id])

  const handleApprove = async () => {
    setProcessing(true)
    try {
      await apiClient.put(`/swap/admin/${id}/approve`)
      toast.success("Swap request approved. An email has been sent to the user.")
      setIsApproveOpen(false)
      fetchSwapRequest()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error approving swap request")
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    setProcessing(true)
    try {
      await apiClient.put(`/swap/admin/${id}/reject`, { reason: rejectReason })
      toast.success("Swap request rejected")
      setIsRejectOpen(false)
      setRejectReason("")
      fetchSwapRequest()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error rejecting swap request")
    } finally {
      setProcessing(false)
    }
  }

  const handleComplete = async () => {
    if (!sentAmount || isNaN(Number(sentAmount)) || Number(sentAmount) <= 0) {
      toast.error("Please enter a valid sent amount")
      return
    }
    setProcessing(true)
    try {
      await apiClient.put(`/swap/admin/${id}/complete`, {
        sentAmount: Number(sentAmount),
        completionTxHash: completionTxHash || undefined,
        adminNote: completionNote || undefined
      })
      toast.success("Swap request completed")
      fetchSwapRequest()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error completing swap request")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#276152]" />
      </div>
    )
  }

  if (!swapRequest) return null

  const rate = swapRequest.rateAtRequest ?? 1
  const expectedReceive = swapRequest.amount * rate

  return (
    <div className="mx-auto max-w-[900px] space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-gray-200"
            onClick={() => navigate("/admin/swap-requests")}
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="space-y-1">
            <h1 className="text-[24px] font-extrabold tracking-tight text-[#111827]">Swap Request Detail</h1>
            <p className="text-[13px] text-[#6b7280]">ID: {swapRequest._id}</p>
          </div>
        </div>
        <Badge className={cn(
          "rounded-full border-none px-4 py-1.5 font-bold text-[12px]",
          STATUS_STYLES[swapRequest.status]
        )}>
          {swapRequest.status === 'PENDING' && <Clock size={12} className="animate-pulse mr-1.5" />}
          {STATUS_LABELS[swapRequest.status] || swapRequest.status}
        </Badge>
      </div>

      {/* Contact Info */}
      <Card className="rounded-[24px] border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[16px] font-bold">
            <User size={18} className="text-[#276152]" /> Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-400">Full Name</p>
            <p className="text-[14px] font-medium text-gray-700">{swapRequest.fullName}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-400">ID Number</p>
            <p className="text-[14px] font-medium text-gray-700">{swapRequest.idCode}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-400 flex items-center gap-1"><Mail size={12} /> Email</p>
            <p className="text-[14px] font-medium text-gray-700">{swapRequest.email}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-400 flex items-center gap-1"><Phone size={12} /> Phone</p>
            <p className="text-[14px] font-medium text-gray-700">{swapRequest.countryCode} {swapRequest.phone}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-400">Submitted At</p>
            <p className="text-[14px] font-medium text-gray-700">{dayjs(swapRequest.createdAt).format("DD/MM/YYYY HH:mm:ss")}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-400">Source</p>
            <p className="text-[14px] font-medium text-gray-700">
              {swapRequest.createdBy
                ? `Created manually by @${swapRequest.createdBy.username}`
                : "Submitted by user via /swap"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Details */}
      <Card className="overflow-hidden rounded-[24px] border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[16px] font-bold">
            <ArrowLeftRight size={18} className="text-[#276152]" /> Conversion Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[16px] bg-emerald-50 border border-emerald-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-700">Sent by user:</span>
              <span className="text-[22px] font-black leading-none text-emerald-900">
                {swapRequest.amount.toLocaleString()} <span className="text-sm">HEWE</span>
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-emerald-100 pt-3">
              <span className="text-sm font-bold text-emerald-700">User will receive:</span>
              <span className="text-[22px] font-black leading-none text-emerald-900">
                {expectedReceive.toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
                <span className="text-sm">{swapRequest.outputToken}</span>
              </span>
            </div>
            <p className="text-[11px] italic text-emerald-600/70">
              Rate locked at request time: 1 HEWE = {rate} {swapRequest.outputToken}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase text-gray-400 flex items-center gap-1"><Hash size={12} /> Transaction Hash</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-[13px] text-gray-700 break-all">{swapRequest.txHash}</p>
                {AMC20_EXPLORER_URL && (
                  <a
                    href={`${AMC20_EXPLORER_URL}/transactions_detail/${swapRequest.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-[#276152] hover:opacity-70"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-gray-400 flex items-center gap-1"><Wallet size={12} /> Sender Wallet (AMC20)</p>
              <p className="font-mono text-[13px] text-gray-700 break-all">{swapRequest.fromWalletAddress || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quantum Wallet */}
      {(swapRequest.status === 'AWAITING_WALLET' || swapRequest.quantumWalletAddress) && (
        <Card className="rounded-[24px] border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[16px] font-bold">
              <Wallet size={18} className="text-[#276152]" /> Quantum Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            {swapRequest.quantumWalletAddress ? (
              <div>
                <p className="text-[11px] font-bold uppercase text-gray-400">Wallet Address</p>
                <p className="font-mono text-[14px] text-gray-700 break-all">{swapRequest.quantumWalletAddress}</p>
                {swapRequest.walletSubmittedAt && (
                  <p className="mt-1 text-[12px] text-gray-400">
                    Submitted at {dayjs(swapRequest.walletSubmittedAt).format("DD/MM/YYYY HH:mm:ss")}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[13px] italic text-gray-400">
                An email has been sent to the user. Waiting for them to submit their Quantum wallet address.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Processing / Admin Notes */}
      {(swapRequest.processedBy || swapRequest.adminNote || swapRequest.sentAmount) && (
        <Card className="rounded-[24px] border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[16px] font-bold">Processing Notes</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {swapRequest.processedBy && (
              <div>
                <p className="text-[11px] font-bold uppercase text-gray-400">Last Processed By</p>
                <p className="text-[14px] font-medium text-gray-700">@{swapRequest.processedBy.username}</p>
              </div>
            )}
            {swapRequest.processedAt && (
              <div>
                <p className="text-[11px] font-bold uppercase text-gray-400">Processed At</p>
                <p className="text-[14px] font-medium text-gray-700">{dayjs(swapRequest.processedAt).format("DD/MM/YYYY HH:mm:ss")}</p>
              </div>
            )}
            {swapRequest.sentAmount && (
              <div>
                <p className="text-[11px] font-bold uppercase text-gray-400">Amount Sent</p>
                <p className="text-[14px] font-medium text-gray-700">{swapRequest.sentAmount.toLocaleString()} {swapRequest.outputToken}</p>
              </div>
            )}
            {swapRequest.completionTxHash && (
              <div>
                <p className="text-[11px] font-bold uppercase text-gray-400">Completion Tx Hash</p>
                <p className="font-mono text-[13px] text-gray-700 break-all">{swapRequest.completionTxHash}</p>
              </div>
            )}
            {swapRequest.adminNote && (
              <div className="sm:col-span-2">
                <p className="text-[11px] font-bold uppercase text-gray-400">Note</p>
                <p className="text-[14px] font-medium text-gray-700">{swapRequest.adminNote}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {canApprove && swapRequest.status === 'PENDING' && (
        <Card className="rounded-[24px] border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[16px] font-bold">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => setIsApproveOpen(true)}
              className="h-12 flex-1 rounded-[14px] bg-[#276152] font-bold text-white hover:bg-[#1e4d40]"
            >
              <CheckCircle2 size={18} className="mr-2" /> Approve
            </Button>
            <Button
              onClick={() => setIsRejectOpen(true)}
              variant="outline"
              className="h-12 flex-1 rounded-[14px] border-red-200 font-bold text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <XCircle size={18} className="mr-2" /> Reject
            </Button>
          </CardContent>
        </Card>
      )}

      {canApprove && swapRequest.status === 'AWAITING_TRANSFER' && (
        <Card className="rounded-[24px] border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[16px] font-bold">Complete Swap Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[13px] text-gray-500">
              Confirm this only after you have manually sent {swapRequest.outputToken} to the Quantum wallet above.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Amount Sent ({swapRequest.outputToken}):</label>
              <Input
                type="number"
                min="0"
                step="any"
                value={sentAmount}
                onChange={(e) => setSentAmount(e.target.value)}
                className="h-12 rounded-[12px] border-gray-200 focus:ring-[#276152]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Transaction Hash (optional):</label>
              <Input
                placeholder="Paste transaction hash..."
                value={completionTxHash}
                onChange={(e) => setCompletionTxHash(e.target.value)}
                className="h-12 rounded-[12px] border-gray-200 focus:ring-[#276152]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Note (optional):</label>
              <Input
                placeholder="Internal note..."
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                className="h-12 rounded-[12px] border-gray-200 focus:ring-[#276152]"
              />
            </div>
            <Button
              onClick={handleComplete}
              disabled={processing}
              className="h-12 w-full rounded-[14px] bg-[#276152] font-bold text-white hover:bg-[#1e4d40]"
            >
              {processing ? <Loader2 className="animate-spin size-4" /> : "Confirm & Close Request"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="rounded-[32px] max-w-md p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-[22px] font-black text-gray-900 leading-tight">Approve Swap Request</DialogTitle>
            <DialogDescription className="text-[14px] text-gray-500">
              This will email {swapRequest.fullName} a link to submit their Quantum wallet address.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsApproveOpen(false)} className="rounded-[12px] font-bold h-12 px-6">Cancel</Button>
            <Button
              onClick={handleApprove}
              disabled={processing}
              className="bg-[#276152] hover:bg-[#1e4d40] text-white rounded-[14px] font-black px-8 h-12 text-md flex-1 shadow-md shadow-emerald-900/10"
            >
              {processing ? <Loader2 className="animate-spin size-5" /> : "Confirm & Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="rounded-[32px] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-black text-red-900">Reject Swap Request</DialogTitle>
            <DialogDescription className="text-gray-500">
              This will reject the request from {swapRequest.fullName}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Rejection Reason:</label>
              <Input
                placeholder="Enter reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="h-12 rounded-[12px] border-gray-200 focus:ring-red-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsRejectOpen(false)} className="rounded-[12px] font-bold">Cancel</Button>
            <Button
              onClick={handleReject}
              disabled={processing}
              variant="destructive"
              className="rounded-[12px] font-bold px-8 h-12"
            >
              {processing ? <Loader2 className="animate-spin size-4" /> : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
