import React, { useState, useEffect } from "react"
import { Mail, Lock, Eye, EyeOff, User, Phone, Loader2, Fingerprint, Link2 } from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
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
  const [checkingReferral, setCheckingReferral] = useState(false)
  const [isReferralValid, setIsReferralValid] = useState(true)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    refId: ""
  })

  // Track referral ID from URL & Validate
  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref) {
      setFormData(prev => ({ ...prev, refId: ref }))
      validateReferral(ref)
    }
  }, [searchParams])

  const validateReferral = async (ref: string) => {
    setCheckingReferral(true)
    setError("")
    setIsReferralValid(true)
    try {
      await apiClient.get(`/auth/validate-referral/${ref}`)
      // If success, isReferralValid stays true
    } catch (err: any) {
      setIsReferralValid(false)
      setError(err.response?.data?.message || "auth.errors.invalid_referral")
    } finally {
      setCheckingReferral(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError(t("auth.errors.password_mismatch"))
      return
    }

    if (!isReferralValid) {
        setError(t("auth.errors.referral_not_qualified"))
        return
    }

    setLoading(true)
    setError("")

    try {
      const response = await apiClient.post("/auth/register", {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        refId: formData.refId
      })

      toast.success(t("auth.register_success_title"), {
        description: t(response.data?.message || "auth.register_success_desc"),
        duration: 5000,
      })

      // Clear form on success
      setFormData({
        fullName: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        refId: ""
      })
      
      // Navigate after a short delay
      setTimeout(() => {
        navigate("/login")
      }, 3000)
    } catch (err: any) {
      const msg = err.response?.data?.message || "auth.errors.unknown"
      setError(msg)
      toast.error(t(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg animate-in fade-in zoom-in duration-300">
          {t(error)}
        </div>
      )}

      {/* Success alert removed in favor of toast */}

      {/* Full Name & Username */}
      <div className="space-y-4">
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] group-focus-within:text-[#276152] transition-colors">
            <User size={20} />
          </div>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            placeholder={t("auth.full_name_placeholder")}
            className="w-full h-[44px] pl-10 pr-4 bg-white border border-[#9ca3af] rounded-[8px] outline-none focus:border-[#276152] focus:ring-1 focus:ring-[#276152] transition-all text-[#111827] placeholder:text-[#9ca3af]"
          />
        </div>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] group-focus-within:text-[#276152] transition-colors">
            <Fingerprint size={20} />
          </div>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder={t("auth.username_placeholder")}
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

      {/* Referral ID Input */}
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] group-focus-within:text-[#276152] transition-colors">
          <Link2 size={20} />
        </div>
        <input
          type="text"
          name="refId"
          value={formData.refId}
          onChange={handleChange}
          readOnly
          placeholder={t("auth.ref_id_placeholder")}
          className="w-full h-[44px] pl-10 pr-4 bg-gray-50 border border-[#9ca3af] rounded-[8px] outline-none cursor-not-allowed text-[#6b7280] placeholder:text-[#9ca3af]"
        />
      </div>

      {/* Terms & Conditions */}
      <div className="flex items-center gap-2 pt-1 font-sans">
        <Checkbox id="terms" required className="border-[#d5d7db] data-[state=checked]:bg-[#276152] data-[state=checked]:border-[#276152]" />
        <label htmlFor="terms" className="text-[14px] font-normal text-[#6b7280] cursor-pointer select-none">
          {t("auth.agree_terms")} <span className="text-[#276152] font-semibold">{t("auth.terms")}</span> {t("auth.and")} <span className="text-[#276152] font-semibold">{t("auth.policy")}</span>
        </label>
      </div>

      {/* Register Button */}
      <button 
        type="submit"
        disabled={loading || checkingReferral || !isReferralValid}
        className="w-full h-[44px] bg-[#276152] hover:bg-[#1e4d41] text-white font-semibold rounded-[12px] transition-all duration-300 shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
      >
        {loading || checkingReferral ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            {checkingReferral ? t("auth.checking_referral") : t("auth.processing")}
          </>
        ) : (
          t("auth.register")
        )}
      </button>
    </form>
  )
}
