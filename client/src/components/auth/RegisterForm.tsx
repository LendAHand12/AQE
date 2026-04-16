import React, { useState, useEffect } from "react"
import { Mail, Lock, Eye, EyeOff, User, Phone, Loader2, CheckCircle2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import apiClient from "@/lib/axios"

export default function RegisterForm() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    refId: ""
  })

  // Track referral ID from URL
  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref) {
      setFormData(prev => ({ ...prev, refId: ref }))
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError(t("errors.password_mismatch") || "Mật khẩu xác nhận không khớp")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await apiClient.post("/auth/register", formData)
      setSuccess(response.data.message)
      // Clear form on success
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        refId: ""
      })
      // Navigate after a short delay so they can read the alert
      setTimeout(() => {
        navigate("/login")
      }, 5000)
    } catch (err: any) {
      setError(err.response?.data?.message || t("errors.unknown") || "Đã có lỗi xảy ra")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg animate-in fade-in zoom-in duration-300">
          {error}
        </div>
      )}

      {success && (
        <Alert className="bg-[#f0fdf4] border-[#bcf0da] text-[#276152] animate-in fade-in slide-in-from-top-2 duration-500">
          <CheckCircle2 className="h-4 w-4 text-[#276152]" />
          <AlertTitle className="font-bold">Đăng ký thành công!</AlertTitle>
          <AlertDescription className="text-[13px]">
            {success} Hệ thống sẽ tự động chuyển hướng về trang đăng nhập sau vài giây.
          </AlertDescription>
        </Alert>
      )}

      {/* Name Fields */}
      <div className="flex gap-4">
        <div className="relative group flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] group-focus-within:text-[#276152] transition-colors">
            <User size={20} />
          </div>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            placeholder={t("auth.last_name")}
            className="w-full h-[44px] pl-10 pr-4 bg-white border border-[#9ca3af] rounded-[8px] outline-none focus:border-[#276152] focus:ring-1 focus:ring-[#276152] transition-all text-[#111827] placeholder:text-[#9ca3af]"
          />
        </div>
        <div className="relative group flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] group-focus-within:text-[#276152] transition-colors">
            <User size={20} />
          </div>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            placeholder={t("auth.first_name")}
            className="w-full h-[44px] pl-10 pr-4 bg-white border border-[#9ca3af] rounded-[8px] outline-none focus:border-[#276152] focus:ring-1 focus:ring-[#276152] transition-all text-[#111827] placeholder:text-[#9ca3af]"
          />
        </div>
      </div>

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

      {/* Phone Input */}
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] group-focus-within:text-[#276152] transition-colors">
          <Phone size={20} />
        </div>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          placeholder={t("auth.phone_placeholder")}
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
          placeholder={t("auth.password_only")}
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

      {/* Confirm Password Input */}
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] group-focus-within:text-[#276152] transition-colors">
          <Lock size={20} />
        </div>
        <input
          type={showConfirmPassword ? "text" : "password"}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          placeholder={t("auth.confirm_password")}
          className="w-full h-[44px] pl-10 pr-10 bg-white border border-[#9ca3af] rounded-[8px] outline-none focus:border-[#276152] focus:ring-1 focus:ring-[#276152] transition-all text-[#111827] placeholder:text-[#9ca3af]"
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#276152] transition-colors"
        >
          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Terms & Conditions */}
      <div className="flex items-center gap-2 pt-1 font-sans">
        <Checkbox id="terms" required className="border-[#d5d7db] data-[state=checked]:bg-[#276152] data-[state=checked]:border-[#276152]" />
        <label htmlFor="terms" className="text-[14px] font-normal text-[#6b7280] cursor-pointer select-none">
          {t("auth.agree_terms")} <span className="text-[#276152] font-semibold">{t("auth.terms")}</span> & <span className="text-[#276152] font-semibold">{t("auth.policy")}</span>
        </label>
      </div>

      {/* Register Button */}
      <button 
        type="submit"
        disabled={loading || !!success}
        className="w-full h-[44px] bg-[#276152] hover:bg-[#1e4d41] text-white font-semibold rounded-[12px] transition-all duration-300 shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            {t("auth.processing")}
          </>
        ) : (
          t("auth.register")
        )}
      </button>
    </form>
  )
}
