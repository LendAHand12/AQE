import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Globe, Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import apiClient from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import loginBg from "@/assets/login_bg.svg"

export default function ConfirmEmailPage() {
  const { t, i18n } = useTranslation()
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const hasCalled = React.useRef(false)
  const [isLangOpen, setIsLangOpen] = useState(false)

  useEffect(() => {
    if (hasCalled.current) return
    hasCalled.current = true

    const confirmAccount = async () => {
      try {
        await apiClient.get(`/auth/confirm/${token}`)
        setStatus("success")
      } catch (error: any) {
        setStatus("error")
      }
    }

    if (token) {
      confirmAccount()
    }
  }, [token, t])

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    setIsLangOpen(false)
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
        <Dialog open={isLangOpen} onOpenChange={setIsLangOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-white/80 backdrop-blur-md rounded-full px-4 h-9 font-bold text-[#276152] border-[#efefef] shadow-sm flex items-center gap-1.5 outline-none uppercase"
            >
              <Globe className="h-4 w-4" />
              <span>{i18n.language}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
            <div className="bg-[#276152] p-8 text-white relative">
              <DialogHeader className="gap-1">
                <DialogTitle className="text-2xl font-bold text-white leading-tight text-left">
                  {t("header.select_language")}
                </DialogTitle>
                <DialogDescription className="text-white/70 text-sm text-left">
                  {t("header.select_language_desc")}
                </DialogDescription>
              </DialogHeader>
              <div className="absolute -bottom-6 -right-6 opacity-10 pointer-events-none">
                <Globe size={120} />
              </div>
            </div>
            
            <div className="p-8 space-y-4 bg-white">
              <button 
                onClick={() => handleLanguageChange('en')}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                  i18n.language === 'en' 
                    ? 'border-[#276152] bg-[#276152]/5' 
                    : 'border-[#efefef] hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-full flex items-center justify-center font-bold ${
                    i18n.language === 'en' ? 'bg-[#276152] text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    EN
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[#0d1f1d]">English</p>
                    <p className="text-xs text-gray-400">System default language</p>
                  </div>
                </div>
                {i18n.language === 'en' && <Check className="text-[#276152] h-5 w-5" />}
              </button>

              <button 
                onClick={() => handleLanguageChange('vi')}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                  i18n.language === 'vi' 
                    ? 'border-[#276152] bg-[#276152]/5' 
                    : 'border-[#efefef] hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-full flex items-center justify-center font-bold ${
                    i18n.language === 'vi' ? 'bg-[#276152] text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    VI
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[#0d1f1d]">Tiếng Việt</p>
                    <p className="text-xs text-gray-400">Ngôn ngữ mặc định hệ thống</p>
                  </div>
                </div>
                {i18n.language === 'vi' && <Check className="text-[#276152] h-5 w-5" />}
              </button>

              <button 
                onClick={() => handleLanguageChange('es')}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                  i18n.language === 'es' 
                    ? 'border-[#276152] bg-[#276152]/5' 
                    : 'border-[#efefef] hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-full flex items-center justify-center font-bold ${
                    i18n.language === 'es' ? 'bg-[#276152] text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    ES
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[#0d1f1d]">Español</p>
                    <p className="text-xs text-gray-400">Idioma del sistema</p>
                  </div>
                </div>
                {i18n.language === 'es' && <Check className="text-[#276152] h-5 w-5" />}
              </button>

              <button 
                onClick={() => handleLanguageChange('hi')}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                  i18n.language === 'hi' 
                    ? 'border-[#276152] bg-[#276152]/5' 
                    : 'border-[#efefef] hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-full flex items-center justify-center font-bold ${
                    i18n.language === 'hi' ? 'bg-[#276152] text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    HI
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[#0d1f1d]">हिन्दी</p>
                    <p className="text-xs text-gray-400">सिस्टम डिफ़ॉल्ट भाषा</p>
                  </div>
                </div>
                {i18n.language === 'hi' && <Check className="text-[#276152] h-5 w-5" />}
              </button>
            </div>
          </DialogContent>
        </Dialog>
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
