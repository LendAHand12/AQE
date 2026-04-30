import React, { useState } from "react"
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import apiClient from "@/lib/axios"
import { useAuth } from "@/providers/AuthProvider"

export default function LoginForm() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [requires2FA, setRequires2FA] = useState(false)
  const [userId, setUserId] = useState("")
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (requires2FA) {
        if (!twoFactorCode || twoFactorCode.length !== 6) {
          setError(t("auth.errors.invalid_2fa", "Vui lòng nhập đủ 6 số"));
          setLoading(false);
          return;
        }
        const response = await apiClient.post("/auth/login/2fa", { userId, code: twoFactorCode })
        login(response.data, response.data.token)
        navigate("/dashboard")
      } else {
        const response = await apiClient.post("/auth/login", formData)
        if (response.data.requires2FA) {
          setRequires2FA(true)
          setUserId(response.data.userId)
        } else {
          login(response.data, response.data.token)
          navigate("/dashboard")
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t("auth.errors.unknown"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg animate-in fade-in zoom-in duration-300">
          {t(error)}
        </div>
      )}

      {requires2FA ? (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-[#276152]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 text-[#276152]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Xác thực 2 lớp</h3>
            <p className="text-sm text-gray-500">Mở ứng dụng Google Authenticator và nhập mã 6 số để tiếp tục.</p>
          </div>
          <div className="flex justify-center py-4">
              <InputOTP maxLength={6} value={twoFactorCode} onChange={setTwoFactorCode}>
                  <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-14 text-lg" />
                      <InputOTPSlot index={1} className="w-12 h-14 text-lg" />
                      <InputOTPSlot index={2} className="w-12 h-14 text-lg" />
                      <InputOTPSlot index={3} className="w-12 h-14 text-lg" />
                      <InputOTPSlot index={4} className="w-12 h-14 text-lg" />
                      <InputOTPSlot index={5} className="w-12 h-14 text-lg" />
                  </InputOTPGroup>
              </InputOTP>
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full h-[44px] bg-[#276152] hover:bg-[#1e4d41] text-white font-semibold rounded-[12px] transition-all duration-300 shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <><Loader2 className="animate-spin" size={20} />{t("auth.processing")}</> : "Xác nhận"}
          </button>
          <button 
            type="button"
            onClick={() => setRequires2FA(false)}
            className="w-full h-[44px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-[12px] transition-all duration-300"
          >
            Quay lại
          </button>
        </div>
      ) : (
        <>
          {/* Email Input */}
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] group-focus-within:text-[#276152] transition-colors">
              <Mail size={20} />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder={t("auth.email_placeholder")}
              className="w-full h-[44px] pl-10 pr-4 bg-white border border-[#9ca3af] rounded-[8px] outline-none focus:border-[#276152] focus:ring-1 focus:ring-[#276152] transition-all text-[#111827] placeholder:text-[#9ca3af]"
            />
          </div>

          {/* Password Input */}
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
              placeholder={t("auth.password_placeholder")}
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

          {/* Remember & Forget */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" className="border-[#d5d7db] data-[state=checked]:bg-[#276152] data-[state=checked]:border-[#276152]" />
              <label htmlFor="remember" className="text-[12px] font-semibold text-[#6b7280] tracking-wide cursor-pointer select-none">
                {t("auth.remember_me")}
              </label>
            </div>
            <button 
              type="button" 
              onClick={() => navigate("/forgot-password")}
              className="text-[12px] font-semibold text-[#276152] hover:underline tracking-wide"
            >
              {t("auth.forgot_password")}
            </button>
          </div>

          {/* Login Button */}
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
              t("auth.login")
            )}
          </button>
        </>
      )}
    </form>
  )
}
