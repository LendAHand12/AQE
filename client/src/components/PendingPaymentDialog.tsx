import { useState, useEffect } from "react"
import { Clock, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface PendingPaymentDialogProps {
  pendingTransaction: {
    paymentId: number
    amount: number
    status: "PENDING" | "AWAITING_APPROVAL"
    metadata?: { method?: string }
  } | null | undefined
  onCancelled: () => void
}

export function PendingPaymentDialog({ pendingTransaction, onCancelled }: PendingPaymentDialogProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [cancelling, setCancelling] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)

  // Re-arm the popup whenever a new/different pending order shows up
  useEffect(() => {
    setAcknowledged(false)
  }, [pendingTransaction?.paymentId, pendingTransaction?.status])

  if (!pendingTransaction || acknowledged) return null

  const isAwaiting = pendingTransaction.status === "AWAITING_APPROVAL"
  const uiMethod = pendingTransaction.metadata?.method === "ZELLE" ? "zelle" : "wallet"

  const handleContinue = () => {
    navigate(`/pay?pid=${pendingTransaction.paymentId}&method=${uiMethod}`)
  }

  const handleCancel = async () => {
    if (!window.confirm(t("payments.page.cancel_confirm"))) return
    setCancelling(true)
    try {
      await apiClient.post("/payments/cancel", { paymentId: pendingTransaction.paymentId })
      toast.success(t("payments.page.cancel_success"))
      onCancelled()
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[420px] rounded-3xl p-6"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center space-y-3">
          <div className="size-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <Clock size={26} />
          </div>
          <DialogTitle className="text-xl font-black text-[#0d1f1d]">
            {isAwaiting
              ? t("payments.pending_order.title_awaiting")
              : t("payments.pending_order.title_pending")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t(isAwaiting ? "payments.pending_order.desc_awaiting" : "payments.pending_order.desc_pending", {
              amount: pendingTransaction.amount?.toLocaleString()
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-2">
          {isAwaiting ? (
            <Button
              onClick={() => setAcknowledged(true)}
              className="w-full h-12 bg-[#276152] hover:bg-[#1e4d41] text-white rounded-xl font-bold"
            >
              {t("payments.pending_order.acknowledge_btn")}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleContinue}
                className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {t("payments.pending_order.continue_btn")}
                <ArrowRight size={16} />
              </Button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-sm font-bold text-rose-500 hover:text-rose-600 hover:underline disabled:opacity-50 py-1.5"
              >
                {cancelling ? t("auth.processing") : t("payments.pending_order.cancel_btn")}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
