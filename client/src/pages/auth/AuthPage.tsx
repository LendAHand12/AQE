import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Globe, Check } from "lucide-react"
import LoginForm from "@/components/auth/LoginForm"
import RegisterForm from "@/components/auth/RegisterForm"
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm"
import ResetPasswordForm from "@/components/auth/ResetPasswordForm"
import { cn } from "@/lib/utils"
import loginBannerNew from "@/assets/login_banner_new.jpg"
import registerBannerNew from "@/assets/register_banner_new.png"

interface AuthPageProps {
  mode: "login" | "register" | "forgot-password" | "reset-password"
}

export default function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [isLangOpen, setIsLangOpen] = useState(false)

  const bannerSrc = mode === "register" ? registerBannerNew : loginBannerNew
  const containerBg = mode === "register" ? "bg-white" : "bg-[#f4f0e5]"

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    setIsLangOpen(false)
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-white">
      {/* Language Switcher Overlay */}
      <div className="absolute top-6 right-6 z-50">
        <Dialog open={isLangOpen} onOpenChange={setIsLangOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-[12px] font-bold text-[#276152] uppercase shadow-sm backdrop-blur-md transition-all outline-none hover:bg-white active:scale-95">
              <Globe className="h-3.5 w-3.5" />
              <span>{i18n.language}</span>
            </button>
          </DialogTrigger>
          <DialogContent className="overflow-hidden rounded-3xl border-none p-0 shadow-2xl sm:max-w-[400px]">
            <div className="relative bg-[#276152] p-8 text-white">
              <DialogHeader className="gap-1">
                <DialogTitle className="text-left text-2xl leading-tight font-bold text-white">
                  {t("header.select_language")}
                </DialogTitle>
                <DialogDescription className="text-left text-sm text-white/70">
                  {t("header.select_language_desc")}
                </DialogDescription>
              </DialogHeader>
              <div className="pointer-events-none absolute -right-6 -bottom-6 opacity-10">
                <Globe size={120} />
              </div>
            </div>

            <div className="space-y-4 bg-white p-8">
              <button
                onClick={() => handleLanguageChange("en")}
                className={`group flex w-full items-center justify-between rounded-2xl border-2 p-4 transition-all ${
                  i18n.language === "en"
                    ? "border-[#276152] bg-[#276152]/5"
                    : "border-[#efefef] hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex size-10 items-center justify-center rounded-full font-bold ${
                      i18n.language === "en"
                        ? "bg-[#276152] text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    EN
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[#0d1f1d]">English</p>
                    <p className="text-xs text-gray-400">
                      System default language
                    </p>
                  </div>
                </div>
                {i18n.language === "en" && (
                  <Check className="h-5 w-5 text-[#276152]" />
                )}
              </button>

              <button
                onClick={() => handleLanguageChange("vi")}
                className={`group flex w-full items-center justify-between rounded-2xl border-2 p-4 transition-all ${
                  i18n.language === "vi"
                    ? "border-[#276152] bg-[#276152]/5"
                    : "border-[#efefef] hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex size-10 items-center justify-center rounded-full font-bold ${
                      i18n.language === "vi"
                        ? "bg-[#276152] text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    VI
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[#0d1f1d]">Tiếng Việt</p>
                    <p className="text-xs text-gray-400">
                      Ngôn ngữ mặc định hệ thống
                    </p>
                  </div>
                </div>
                {i18n.language === "vi" && (
                  <Check className="h-5 w-5 text-[#276152]" />
                )}
              </button>

              <button
                onClick={() => handleLanguageChange("es")}
                className={`group flex w-full items-center justify-between rounded-2xl border-2 p-4 transition-all ${
                  i18n.language === "es"
                    ? "border-[#276152] bg-[#276152]/5"
                    : "border-[#efefef] hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex size-10 items-center justify-center rounded-full font-bold ${
                      i18n.language === "es"
                        ? "bg-[#276152] text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    ES
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[#0d1f1d]">Español</p>
                    <p className="text-xs text-gray-400">Idioma del sistema</p>
                  </div>
                </div>
                {i18n.language === "es" && (
                  <Check className="h-5 w-5 text-[#276152]" />
                )}
              </button>

              <button
                onClick={() => handleLanguageChange("hi")}
                className={`group flex w-full items-center justify-between rounded-2xl border-2 p-4 transition-all ${
                  i18n.language === "hi"
                    ? "border-[#276152] bg-[#276152]/5"
                    : "border-[#efefef] hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex size-10 items-center justify-center rounded-full font-bold ${
                      i18n.language === "hi"
                        ? "bg-[#276152] text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    HI
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[#0d1f1d]">हिन्दी</p>
                    <p className="text-xs text-gray-400">
                      सिस्टम डिफ़ॉल्ट भाषा
                    </p>
                  </div>
                </div>
                {i18n.language === "hi" && (
                  <Check className="h-5 w-5 text-[#276152]" />
                )}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Left Panel - Illustration/Brand */}
      <div className={cn(
        "relative hidden items-center justify-center overflow-hidden select-none lg:flex lg:w-[55%]",
        containerBg
      )}>
        <motion.img
          src={bannerSrc}
          alt="AQ Estate Infographic"
          className="pointer-events-none h-full w-full object-contain transition-transform duration-[12s] ease-out hover:scale-[1.01]"
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="relative z-20 flex w-full flex-col items-center justify-center bg-[#f8faf9] p-6 shadow-2xl sm:p-12 lg:w-[45%] lg:p-20">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Header Section */}
          <div className="space-y-2">
            <h1 className="font-heading text-[34px] font-bold tracking-tight text-[#111827]">
              {mode === "login"
                ? t("auth.welcome_back")
                : mode === "register"
                  ? t("auth.create_account")
                  : mode === "forgot-password"
                    ? t("auth.forgot_password_title")
                    : t("auth.reset_password_title")}
            </h1>
            <p className="text-[14px] font-medium tracking-wide text-[#6b7280]">
              {mode === "login"
                ? t("auth.login_desc")
                : mode === "register"
                  ? t("auth.register_desc")
                  : mode === "forgot-password"
                    ? t("auth.forgot_password_desc")
                    : t("auth.reset_password_desc")}
            </p>
          </div>

          {/* Tab Toggle - Only show for Login/Register */}
          {(mode === "login" || mode === "register") && (
            <div className="relative flex items-center rounded-[12px] border border-[#e5e7eb] bg-[#f8faf9] p-1">
              <button
                onClick={() => navigate("/login")}
                className={cn(
                  "relative z-10 flex-1 rounded-[4px] py-1.5 text-[14px] font-semibold transition-all duration-300",
                  mode === "login" ? "text-white" : "text-[#6b7280]"
                )}
              >
                {t("auth.login")}
              </button>
              <button
                onClick={() => navigate("/register")}
                className={cn(
                  "relative z-10 flex-1 rounded-[4px] py-1.5 text-[14px] font-semibold transition-all duration-300",
                  mode === "register" ? "text-white" : "text-[#6b7280]"
                )}
              >
                {t("auth.register")}
              </button>

              <motion.div
                className="absolute top-1 bottom-1 left-1 z-0 w-[calc(50%-4px)] rounded-[4px] bg-[#276152]"
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
            <div className="pt-2 text-center">
              <p className="text-[14px] text-[#9ca3af]">
                {mode === "login"
                  ? t("auth.no_account")
                  : t("auth.have_account")}
                <button
                  onClick={() =>
                    navigate(mode === "login" ? "/register" : "/login")
                  }
                  className="ml-1 font-bold text-[#276152] hover:underline"
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
