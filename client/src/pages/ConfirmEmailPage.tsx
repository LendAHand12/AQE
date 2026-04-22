import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import apiClient from "@/lib/axios"
import { Button } from "@/components/ui/button"
import loginBg from "@/assets/login_bg.svg"

export default function ConfirmEmailPage() {
  const { t, i18n } = useTranslation()
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const hasCalled = React.useRef(false)

  useEffect(() => {
    if (hasCalled.current) return
    hasCalled.current = true

    const confirmAccount = async () => {
      try {
        const response = await apiClient.get(`/auth/confirm/${token}`)
        setStatus("success")
        setMessage(response.data.message)
      } catch (error: any) {
        setStatus("error")
        setMessage(error.response?.data?.message || t("confirm_email.error_desc"))
      }
    }

    if (token) {
      confirmAccount()
    }
  }, [token, t])

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "vi" ? "en" : "vi")
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-[#f8faf9] overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none bg-repeat"
        style={{ backgroundImage: `url(${loginBg})`, backgroundSize: '400px' }}
      />

      {/* Language Switcher */}
      <div className="absolute top-8 right-8 z-50">
        <Button
          variant="outline"
          onClick={toggleLanguage}
          className="bg-white/80 backdrop-blur-md rounded-full px-4 h-9 font-bold text-[#276152] border-[#efefef] shadow-sm"
        >
          {i18n.language === "vi" ? "EN" : "VI"}
        </Button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <div className="bg-white rounded-[32px] shadow-2xl shadow-gray-200/50 border border-white p-8 md:p-12 text-center space-y-8">
          <AnimatePresence mode="wait">
            {status === "loading" && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="space-y-6"
              >
                <div className="relative size-20 mx-auto">
                  <div className="absolute inset-0 bg-[#276152]/10 rounded-full animate-pulse" />
                  <Loader2 className="relative size-full text-[#276152] animate-spin p-4" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-[#111827]">
                    {t("confirm_email.verifying")}
                  </h1>
                  <p className="text-[#6b7280]">
                    {t("confirm_email.verifying_desc")}
                  </p>
                </div>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="relative size-24 mx-auto">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="absolute inset-0 bg-[#276152] rounded-full shadow-lg shadow-[#276152]/20"
                  />
                  <CheckCircle2 className="relative size-full text-white p-6" />
                </div>
                
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold text-[#111827]">
                    {t("confirm_email.success_title")}
                  </h1>
                  <p className="text-lg text-[#6b7280] leading-relaxed">
                    {t("confirm_email.success_desc")}
                  </p>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={() => navigate("/login")}
                    className="w-full h-14 bg-[#276152] hover:bg-[#1e4d41] rounded-2xl text-lg font-bold shadow-xl shadow-[#276152]/10 transition-all group"
                  >
                    <span>{t("confirm_email.login_now")}</span>
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="relative size-24 mx-auto">
                  <div className="absolute inset-0 bg-red-50 rounded-full" />
                  <XCircle className="relative size-full text-red-500 p-6" />
                </div>
                
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold text-[#111827]">
                    {t("confirm_email.error_title")}
                  </h1>
                  <p className="text-lg text-[#6b7280] leading-relaxed">
                    {t("confirm_email.error_desc")}
                  </p>
                </div>

                <div className="pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/login")}
                    className="w-full h-14 border-2 border-[#efefef] hover:bg-gray-50 rounded-2xl text-lg font-bold transition-all"
                  >
                    {t("confirm_email.back_to_login")}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-6 border-t border-gray-50 flex items-center justify-center gap-2 text-sm text-[#9ca3af]">
            <ShieldCheck className="h-4 w-4" />
            <span>Secure Verification by AQ Estate</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
