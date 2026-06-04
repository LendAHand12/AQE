import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Globe, Check } from "lucide-react"
import LoginForm from "@/components/auth/LoginForm"
import RegisterForm from "@/components/auth/RegisterForm"
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm"
import ResetPasswordForm from "@/components/auth/ResetPasswordForm"
import { cn } from "@/lib/utils"
import loginBg from "@/assets/login_bg.svg"

interface AuthPageProps {
  mode: "login" | "register" | "forgot-password" | "reset-password"
}

export default function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [isLangOpen, setIsLangOpen] = useState(false)

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    setIsLangOpen(false)
  }

  return (
    <div className="min-h-screen flex bg-white overflow-hidden relative">
      {/* Language Switcher Overlay */}
      <div className="absolute top-6 right-6 z-50">
        <Dialog open={isLangOpen} onOpenChange={setIsLangOpen}>
          <DialogTrigger asChild>
            <button className="bg-white/80 backdrop-blur-md border border-gray-200 px-3 py-1.5 rounded-full text-[12px] font-bold text-[#276152] shadow-sm hover:bg-white transition-all active:scale-95 flex items-center gap-1.5 outline-none uppercase">
              <Globe className="h-3.5 w-3.5" />
              <span>{i18n.language}</span>
            </button>
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

      {/* Left Panel - Illustration/Brand */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-end p-12 overflow-hidden bg-white">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] hover:scale-105"
          style={{ backgroundImage: `url(${loginBg})` }}
        />
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-6 sm:p-12 lg:p-20 bg-[#f8faf9] relative z-20 shadow-2xl">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Header Section */}
          <div className="space-y-2">
            <h1 className="text-[34px] font-bold tracking-tight text-[#111827] font-heading">
              {mode === "login" ? t("auth.welcome_back") : 
               mode === "register" ? t("auth.create_account") :
               mode === "forgot-password" ? t("auth.forgot_password_title") :
               t("auth.reset_password_title")}
            </h1>
            <p className="text-[14px] font-medium text-[#6b7280] tracking-wide">
              {mode === "login" ? t("auth.login_desc") : 
               mode === "register" ? t("auth.register_desc") :
               mode === "forgot-password" ? t("auth.forgot_password_desc") :
               t("auth.reset_password_desc")}
            </p>
          </div>

          {/* Tab Toggle - Only show for Login/Register */}
          {(mode === "login" || mode === "register") && (
            <div className="bg-[#f8faf9] p-1 rounded-[12px] flex items-center relative border border-[#e5e7eb]">
              <button
                onClick={() => navigate("/login")}
                className={cn(
                  "flex-1 py-1.5 text-[14px] font-semibold rounded-[4px] transition-all duration-300 relative z-10",
                  mode === "login" ? "text-white" : "text-[#6b7280]"
                )}
              >
                {t("auth.login")}
              </button>
              <button
                onClick={() => navigate("/register")}
                className={cn(
                  "flex-1 py-1.5 text-[14px] font-semibold rounded-[4px] transition-all duration-300 relative z-10",
                  mode === "register" ? "text-white" : "text-[#6b7280]"
                )}
              >
                {t("auth.register")}
              </button>
              
              <motion.div
                className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-[#276152] rounded-[4px] z-0"
                initial={false}
                animate={{
                  x: mode === "login" ? 0 : "100%",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
          )}

          {/* Form Content */}
          <div className="relative overflow-hidden pt-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {mode === "login" && <LoginForm />}
                {mode === "register" && <RegisterForm />}
                {mode === "forgot-password" && <ForgotPasswordForm />}
                {mode === "reset-password" && <ResetPasswordForm />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer - Switch Mode Link */}
          {(mode === "login" || mode === "register") && (
            <div className="text-center pt-2">
              <p className="text-[14px] text-[#9ca3af]">
                {mode === "login" ? t("auth.no_account") : t("auth.have_account")}
                <button
                  onClick={() => navigate(mode === "login" ? "/register" : "/login")}
                  className="text-[#276152] font-bold hover:underline ml-1"
                >
                  {mode === "login" ? t("auth.register_now") : t("auth.login")}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
