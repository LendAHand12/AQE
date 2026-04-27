import React, { useState } from "react"
import { Mail, Loader2, ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import apiClient from "@/lib/axios"
import { toast } from "sonner"

export default function ForgotPasswordForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await apiClient.post("/auth/forgot-password", { email })
      setSuccess(true)
      toast.success(t("auth.forgot_password_success_title"), {
        description: t("auth.forgot_password_success_desc")
      })
    } catch (err: any) {
      toast.error(t(err.response?.data?.message || "auth.errors.unknown"))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-6 py-4 animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-[#f0fdf4] rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="text-[#22c55e]" size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-[#111827]">{t("auth.check_email")}</h3>
          <p className="text-[#6b7280] text-sm">
            {t("auth.forgot_password_instruction")}
          </p>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="w-full h-[44px] bg-[#276152] hover:bg-[#1e4d41] text-white font-semibold rounded-[12px] transition-all duration-300"
        >
          {t("auth.back_to_login")}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] group-focus-within:text-[#276152] transition-colors">
          <Mail size={20} />
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder={t("auth.email_placeholder")}
          className="w-full h-[44px] pl-10 pr-4 bg-white border border-[#9ca3af] rounded-[8px] outline-none focus:border-[#276152] focus:ring-1 focus:ring-[#276152] transition-all text-[#111827] placeholder:text-[#9ca3af]"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-[44px] bg-[#276152] hover:bg-[#1e4d41] text-white font-semibold rounded-[12px] transition-all duration-300 shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            {t("auth.processing")}
          </>
        ) : (
          t("auth.send_reset_link")
        )}
      </button>

      <button
        type="button"
        onClick={() => navigate("/login")}
        className="w-full flex items-center justify-center gap-2 text-[#6b7280] hover:text-[#276152] text-sm font-medium transition-colors"
      >
        <ArrowLeft size={16} />
        {t("auth.back_to_login")}
      </button>
    </form>
  )
}
