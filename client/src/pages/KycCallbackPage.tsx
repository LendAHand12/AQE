import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import { useAuth } from "@/providers/AuthProvider"
import { useTranslation } from "react-i18next"

export default function KycCallbackPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { syncProfile } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState(t("assets.kyc_callback.verifying"))

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token")
      const facetecTid = searchParams.get("facetect_tid")
      const facetecStatus = searchParams.get("status")
      const ageEstimate = searchParams.get("age_estimate")

      if (!token || facetecStatus !== "success") {
        setStatus('error')
        setMessage(t("assets.kyc_callback.failed_desc"))
        return
      }

      try {
        const response = await apiClient.post("/kyc/complete-face-scan", {
          token,
          facetecTid,
          status: facetecStatus,
          ageEstimate
        })

        if (response.data.success) {
          setStatus('success')
          setMessage(t("assets.kyc_callback.success_msg"))
          await syncProfile() // Refresh user data
          
          toast.success(t("assets.kyc_callback.success_toast"))
          
          // Auto redirect after 3 seconds
          setTimeout(() => {
            navigate("/settings?tab=kyc")
          }, 3000)
        }
      } catch (error: any) {
        console.error("Callback Error:", error)
        setStatus('error')
        setMessage(error.response?.data?.message || t("assets.kyc_callback.process_error"))
      }
    }

    handleCallback()
  }, [t, searchParams, navigate, syncProfile])

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-white rounded-[32px] p-10 shadow-xl space-y-8">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="size-16 text-[#276152] animate-spin" />
            <div className="space-y-2">
               <h2 className="text-[24px] font-bold text-gray-900">{t("assets.kyc_callback.loading_title")}</h2>
               <p className="text-gray-500">{message}</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-6">
            <div className="size-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
               <CheckCircle2 size={48} />
            </div>
            <div className="space-y-2">
               <h2 className="text-[24px] font-bold text-gray-900">{t("assets.kyc_callback.success_title")}</h2>
               <p className="text-gray-500">{message}</p>
            </div>
            <p className="text-[14px] text-gray-400">{t("assets.kyc_callback.redirect_note")}</p>
            <Button 
               onClick={() => navigate("/settings?tab=kyc")}
               className="w-full h-[56px] bg-[#276152] hover:bg-[#1e4d40] text-white rounded-[16px] font-bold"
            >
               {t("assets.kyc_callback.back_to_settings")}
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-6">
            <div className="size-20 rounded-full bg-red-50 flex items-center justify-center text-red-500">
               <XCircle size={48} />
            </div>
            <div className="space-y-2">
               <h2 className="text-[24px] font-bold text-gray-900">{t("assets.kyc_callback.error_title")}</h2>
               <p className="text-gray-500">{message}</p>
            </div>
            <div className="flex flex-col w-full gap-3">
               <Button 
                  onClick={() => navigate("/settings?tab=kyc")}
                  className="w-full h-[56px] bg-[#276152] hover:bg-[#1e4d40] text-white rounded-[16px] font-bold"
               >
                  {t("assets.kyc_callback.try_again")}
               </Button>
               <Button 
                  variant="ghost"
                  onClick={() => navigate("/dashboard")}
                  className="w-full h-[56px] text-gray-500 font-bold"
               >
                  {t("assets.kyc_callback.back_to_dashboard")}
               </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
