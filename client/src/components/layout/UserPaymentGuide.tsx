import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/providers/AuthProvider"
import { useTranslation } from "react-i18next"
import apiClient from "@/lib/axios"
import { Check, ChevronRight, ChevronDown, X, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"

export default function UserPaymentGuide() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [paymentsData, setPaymentsData] = useState<any>(null)
  const [dismissed, setDismissed] = useState(
    localStorage.getItem("hidePaymentGuide") === "true"
  )

  const fetchPayments = async () => {
    try {
      const res = await apiClient.get("/payments/my-payments?page=1&limit=10")
      setPaymentsData(res.data)
    } catch (err) {
      console.error("Failed to fetch payments for guide:", err)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchPayments()
  }, [user, location.pathname]) // Refetch on mount, user change or route navigation

  if (!user) return null

  const transactions = paymentsData?.transactions || []
  const summary = paymentsData?.summary || { totalPaid: 0 }
  
  // Checking transaction status for payment success instead of user.paidUsdtPreRegister
  const hasPaid = summary.totalPaid > 0 || transactions.some((tx: any) => tx.status === 'SUCCESS')

  const triggerFireworks = () => {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
    }, 250)
  }

  useEffect(() => {
    if (hasPaid && !dismissed) {
      triggerFireworks()
    }
  }, [hasPaid, dismissed])

  if (dismissed) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            localStorage.removeItem("hidePaymentGuide")
            setDismissed(false)
          }}
          className="bg-[#276152] hover:bg-[#1e4d41] text-white rounded-full px-4 py-3 shadow-xl hover:shadow-[#276152]/30 flex items-center gap-2 text-xs sm:text-sm font-bold transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer border border-[#276152]/10"
        >
          <Sparkles className="h-4 w-4 animate-pulse text-yellow-300" />
          <span>{t("guide.show_btn")}</span>
        </button>
      </div>
    )
  }

  const kycDone = user.kycStatus === 'verified' || user.kycStatus === 'pending'
  const hasInitiatedPayment = transactions.length > 0
  const isAwaitingApproval = transactions.some((tx: any) => tx.status === 'AWAITING_APPROVAL')

  // Calculate step states
  // Step 1: Register Account (always completed)
  // Step 2: KYC (completed if kycDone)
  // Step 3: Initiate Payment (completed if hasInitiatedPayment)
  // Step 4: Select method & transfer (completed if hasPaid or isAwaitingApproval)
  // Step 5: Successful Payment
  const steps = [
    {
      id: 1,
      title: t("guide.step1"),
      status: "completed",
      onClick: () => navigate("/dashboard")
    },
    {
      id: 2,
      title: t("guide.step2"),
      status: kycDone ? "completed" : "current",
      onClick: () => navigate("/settings?tab=kyc")
    },
    {
      id: 3,
      title: t("guide.step3"),
      status: kycDone 
        ? (hasInitiatedPayment ? "completed" : "current")
        : "locked",
      onClick: kycDone ? () => navigate("/buy") : null
    },
    {
      id: 4,
      title: t("guide.step4"),
      status: hasInitiatedPayment
        ? (hasPaid || isAwaitingApproval ? "completed" : "current")
        : "locked",
      onClick: hasInitiatedPayment
        ? () => {
            const pendingTx = transactions.find((tx: any) => tx.status === 'PENDING')
            if (pendingTx) {
              navigate(`/pay?pid=${pendingTx.paymentId}&method=${pendingTx.metadata?.method === 'ZELLE' ? 'zelle' : 'wallet'}`)
            } else {
              const firstTx = transactions[0]
              if (firstTx) {
                navigate(`/pay?pid=${firstTx.paymentId}&method=${firstTx.metadata?.method === 'ZELLE' ? 'zelle' : 'wallet'}`)
              } else {
                navigate("/buy")
              }
            }
          }
        : null
    },
    {
      id: 5,
      title: isAwaitingApproval ? t("guide.awaiting") : t("guide.step5"),
      status: hasPaid 
        ? "completed" 
        : (isAwaitingApproval ? "current" : "upcoming"),
      onClick: (hasPaid || isAwaitingApproval) ? () => navigate("/payment-history") : null
    }
  ]

  const handleDismiss = () => {
    localStorage.setItem("hidePaymentGuide", "true")
    setDismissed(true)
  }

  return (
    <div className="bg-white border border-[#efefef] rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6 relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Background accents */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none">
        <Sparkles size={80} />
      </div>

      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className={cn("h-5 w-5 text-[#276152]", !hasPaid && "animate-bounce")} />
          <h4 className="font-extrabold text-[#0d1f1d] text-[15px] tracking-tight">
            {t("guide.title")}
          </h4>
        </div>
        <button 
          onClick={handleDismiss}
          className="bg-gray-50 hover:bg-rose-50 text-gray-500 hover:text-rose-600 px-3 py-1.5 rounded-full border border-gray-200/80 hover:border-rose-200/60 flex items-center gap-1.5 text-[11px] sm:text-xs font-bold transition-all shadow-sm hover:shadow-rose-100/50 active:scale-95 cursor-pointer shrink-0"
          title={t("guide.dismiss")}
        >
          <X size={12} className="stroke-[3]" />
          <span>{t("guide.dismiss")}</span>
        </button>
      </div>

      {/* Steps List */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 pb-2 pt-1">
        {steps.map((step, index) => {
          const isInteractive = step.onClick !== null
          const status = step.status
          
          return (
            <React.Fragment key={step.id}>
              <button
                disabled={!isInteractive}
                onClick={step.onClick || undefined}
                className={cn(
                  "flex items-center gap-2.5 text-left transition-all shrink-0 rounded-xl p-1.5 pr-3 outline-none w-full md:w-auto border",
                  isInteractive 
                    ? "hover:bg-[#276152]/5 cursor-pointer active:scale-95" 
                    : "cursor-default",
                  isInteractive && status === "current"
                    ? "border-dashed border-[#276152]/30 bg-[#276152]/[0.01]" 
                    : "border-transparent"
                )}
                title={isInteractive ? t("guide.click_to_go") : undefined}
              >
                {/* Step Circle indicator */}
                <div className={cn(
                  "size-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shrink-0",
                  status === "completed" 
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20" 
                    : status === "current" 
                      ? "bg-[#276152] text-white animate-pulse shadow-sm shadow-[#276152]/20" 
                      : "bg-gray-50 text-gray-300 border border-gray-100"
                )}>
                  {status === "completed" ? (
                    <Check size={14} className="stroke-[3]" />
                  ) : (
                    step.id
                  )}
                </div>

                {/* Step Text Label */}
                <span className={cn(
                  "text-[13px] font-bold block md:whitespace-nowrap",
                  status === "completed" 
                    ? "text-emerald-600 font-extrabold" 
                    : status === "current" 
                      ? "text-[#276152] font-black" 
                      : "text-gray-400 font-medium"
                )}>
                  {step.title}
                </span>
              </button>

              {index < steps.length - 1 && (
                <>
                  <ChevronRight className="h-4 w-4 text-gray-200 shrink-0 hidden md:block" />
                  <ChevronDown className="h-4 w-4 text-gray-200 shrink-0 block md:hidden ml-3" />
                </>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Congratulatory Alert Banner */}
      <AnimatePresence>
        {hasPaid && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onClick={triggerFireworks}
            className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 overflow-hidden shadow-sm cursor-pointer hover:bg-emerald-100/50 transition-colors"
            title={t("guide.click_for_fireworks", { defaultValue: "Click to celebrate!" })}
          >
            <div className="size-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 animate-bounce">
              <Sparkles size={20} />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="font-extrabold text-emerald-800 text-sm">
                {t("guide.congrats")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
