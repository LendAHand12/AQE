import { useEffect, useState, useRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import { useAuth } from "@/providers/AuthProvider"
import { useTranslation } from "react-i18next"

export default function ClaimProfilePage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { syncProfile } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState(t("assets.kyc_callback.verifying", "Verifying settings changes..."))
  const hasCalled = useRef(false)

  useEffect(() => {
    const handleCallback = async () => {
      if (hasCalled.current) return
      hasCalled.current = true

      const token = searchParams.get("token")
      const facetecStatus = searchParams.get("status")

      if (!token || facetecStatus !== "success") {
        setStatus('error')
        setMessage(t("assets.kyc_callback.failed_desc", "FaceID verification failed."))
        return
      }

      try {
        const response = await apiClient.post("/auth/profile/complete-update", {
          token
        })

        if (response.data.success) {
          setStatus('success')
          const successMsg = t(response.data.message || "settings.save_success")
          setMessage(successMsg)
          await syncProfile() // Refresh user data
          
          toast.success(successMsg)
          
          // Auto redirect after 5 seconds
          setTimeout(() => {
            navigate("/settings")
          }, 5000)
        }
      } catch (error: any) {
        console.error("Claim Profile Error:", error)
        setStatus('error')
        setMessage(t(error.response?.data?.message) || t("assets.kyc_callback.process_error", "An error occurred while updating profile."))
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
               <h2 className="text-[24px] font-bold text-gray-900">{t("assets.kyc_callback.loading_title", "Please wait")}</h2>
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
               <h2 className="text-[24px] font-bold text-gray-900">{t("assets.kyc_callback.success_title", "Success!")}</h2>
               <p className="text-gray-500">{message}</p>
            </div>
            <p className="text-[14px] text-gray-400">{t("assets.kyc_callback.redirect_note", "Automatically redirecting...")}</p>
            <Button 
               onClick={() => navigate("/settings")}
               className="w-full h-[56px] bg-[#276152] hover:bg-[#1e4d40] text-white rounded-[16px] font-bold"
            >
               {t("settings.go_to_settings", "Go to Settings")}
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-6">
            <div className="size-20 rounded-full bg-red-50 flex items-center justify-center text-red-500">
               <XCircle size={48} />
            </div>
            <div className="space-y-2">
               <h2 className="text-[24px] font-bold text-gray-900">{t("assets.kyc_callback.error_title", "Failed")}</h2>
               <p className="text-gray-500">{message}</p>
            </div>
            <div className="flex flex-col w-full gap-3">
               <Button 
                  onClick={() => navigate("/settings")}
                  className="w-full h-[56px] bg-[#276152] hover:bg-[#1e4d40] text-white rounded-[16px] font-bold"
               >
                  {t("assets.kyc_callback.try_again", "Try Again")}
               </Button>
               <Button 
                  variant="ghost"
                  onClick={() => navigate("/dashboard")}
                  className="w-full h-[56px] text-gray-500 font-bold"
               >
                  {t("assets.kyc_callback.back_to_dashboard", "Back to Dashboard")}
               </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
