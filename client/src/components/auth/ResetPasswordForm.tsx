import React, { useState } from "react"
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import apiClient from "@/lib/axios"
import { toast } from "sonner"

export default function ResetPasswordForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { token } = useParams<{ token: string }>()
  
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(t("auth.errors.password_mismatch"))
      return
    }

    setLoading(true)
    try {
      await apiClient.post(`/auth/reset-password/${token}`, {
        password: formData.password
      })
      toast.success(t("auth.reset_password_success_title"), {
        description: t("auth.reset_password_success_desc")
      })
      setTimeout(() => navigate("/login"), 2000)
    } catch (err: any) {
      toast.error(t(err.response?.data?.message || "auth.errors.unknown"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] group-focus-within:text-[#276152] transition-colors">
          <Lock size={20} />
        </div>
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          placeholder={t("auth.new_password_placeholder")}
          className="w-full h-[44px] pl-10 pr-10 bg-white border border-[#9ca3af] rounded-[8px] outline-none focus:border-[#276152] focus:ring-1 focus:ring-[#276152] transition-all text-[#111827] placeholder:text-[#9ca3af]"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#276152] transition-colors"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] group-focus-within:text-[#276152] transition-colors">
          <Lock size={20} />
        </div>
        <input
          type={showPassword ? "text" : "password"}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          placeholder={t("auth.confirm_new_password_placeholder")}
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
          t("auth.reset_password")
        )}
      </button>
    </form>
  )
}
