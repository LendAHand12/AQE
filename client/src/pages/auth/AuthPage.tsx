import React from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import LoginForm from "@/components/auth/LoginForm"
import RegisterForm from "@/components/auth/RegisterForm"
import { cn } from "@/lib/utils"
import loginBg from "@/assets/login_bg.svg"

interface AuthPageProps {
  mode: "login" | "register"
}

export default function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === "vi" ? "en" : "vi"
    i18n.changeLanguage(newLang)
  }

  return (
    <div className="min-h-screen flex bg-white overflow-hidden relative">
      {/* Language Switcher Overlay */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleLanguage}
          className="bg-white/80 backdrop-blur-md border border-gray-200 px-3 py-1.5 rounded-full text-[12px] font-bold text-[#276152] shadow-sm hover:bg-white transition-all active:scale-95"
        >
          {i18n.language === "vi" ? "EN" : "VI"}
        </button>
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
              {mode === "login" ? t("auth.welcome_back") : t("auth.create_account")}
            </h1>
            <p className="text-[14px] font-medium text-[#6b7280] tracking-wide">
              {mode === "login" ? t("auth.login_desc") : t("auth.register_desc")}
            </p>
          </div>

          {/* Tab Toggle */}
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
                {mode === "login" ? <LoginForm /> : <RegisterForm />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer - Switch Mode Link */}
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
        </div>
      </div>
    </div>
  )
}
