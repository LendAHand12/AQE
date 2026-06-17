import { useNavigate, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  LayoutDashboard,
  Settings,
  LogOut,
  CreditCard,
  History,
  Users,
  X,
  Wallet,
  Headset,
  Coins,
  Gamepad2
} from "lucide-react"
import { cn } from "@/lib/utils"
import logo from "@/assets/logo_green.svg"
import { useAuth } from "@/providers/AuthProvider"

interface SidebarItem {
  icon: any
  label: string
  path: string
  key: string
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t, i18n } = useTranslation()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [systemTime, setSystemTime] = useState("")
  const [systemDate, setSystemDate] = useState("")

  useEffect(() => {
    const updateSystemTime = () => {
      const now = new Date()

      const timeString = now.toLocaleTimeString("en-US", {
        timeZone: "America/Chicago",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
      setSystemTime(timeString)

      const dateString = now.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
        timeZone: "America/Chicago",
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      setSystemDate(dateString)
    }

    updateSystemTime()
    const clockTimer = setInterval(updateSystemTime, 1000)
    return () => clearInterval(clockTimer)
  }, [i18n.language])

  const mainMenuItems: SidebarItem[] = [
    { icon: LayoutDashboard, label: t("sidebar.dashboard"), path: "/dashboard", key: "dashboard" },
    // { icon: Rocket, label: t("sidebar.preRegister"), path: "/pre-register", key: "pre-register" },
    { icon: Coins, label: t("sidebar.buy_aqe"), path: "/buy", key: "buy-aqe" },
    { icon: Wallet, label: t("sidebar.assets"), path: "/assets", key: "assets" },
    { icon: Gamepad2, label: i18n.language === 'vi' ? 'Trò chơi Plinko' : 'Plinko Game', path: "/plinko", key: "plinko" },
    { icon: Users, label: t("sidebar.referrals"), path: "/referrals", key: "referrals" },
    { icon: History, label: t("sidebar.payment_history"), path: "/payment-history", key: "payments" },
    { icon: CreditCard, label: t("sidebar.balance_history"), path: "/balance-history", key: "balance" },
    { icon: Headset, label: t("sidebar.tickets", { defaultValue: "Support Tickets" }), path: "/tickets", key: "tickets" },
    { icon: Settings, label: t("sidebar.settings"), path: "/settings", key: "settings" },
  ]

  const bottomMenuItems: SidebarItem[] = []

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    if (onClose) onClose()
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-[50] w-[280px] bg-white border-r border-[#e5e7eb] flex flex-col transition-transform duration-300 transform lg:sticky lg:top-0 lg:translate-x-0 h-screen",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Brand Header */}
      <div className="p-7 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AQ Estate" className="h-10 w-auto" />
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-[#6b7280] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        {systemTime && (
          <div className="flex flex-col gap-1 px-1">
            <div className="flex items-center gap-1.5 text-[#276152]">
              <div className="size-1.5 rounded-full bg-[#276152] animate-pulse" />
              <span className="text-[13px] font-bold font-mono tracking-wider">{systemTime} CST</span>
            </div>
            <span className="text-[12px] text-[#717c8d] font-medium capitalize">{systemDate}</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        <nav className="space-y-1.5">
          {mainMenuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleNavigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3.5 px-4 py-3.5 transition-all duration-300 group relative",
                isActive(item.path)
                  ? "bg-[#276152]/10 text-[#276152] rounded-r-full"
                  : "text-[#717c8d] hover:bg-[#276152]/5 hover:text-[#276152] rounded-xl mx-2"
              )}
            >
              {/* Left Accent Bar */}
              {isActive(item.path) && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#276152] rounded-r-full" />
              )}

              <div className="flex items-center gap-3.5">
                <item.icon size={22} className={cn(
                  "transition-colors",
                  isActive(item.path) ? "text-[#276152]" : "text-[#717c8d] group-hover:text-[#276152]"
                )} />
                <span className={cn(
                  "text-[15px] font-bold tracking-tight",
                  isActive(item.path) ? "text-[#276152]" : "text-[#717c8d]"
                )}>{item.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="p-6 border-t border-gray-50 space-y-2">
        {bottomMenuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => handleNavigate(item.path)}
            className={cn(
              "w-full flex items-center gap-3.5 px-4 py-3.5 transition-all duration-300 group relative",
              isActive(item.path)
                ? "bg-[#276152]/10 text-[#276152] rounded-r-full"
                : "text-[#717c8d] hover:bg-gray-50 hover:text-[#276152] rounded-xl mx-2"
            )}
          >
            {isActive(item.path) && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#276152] rounded-r-full" />
            )}
            <item.icon size={22} className={cn(
              "transition-colors",
              isActive(item.path) ? "text-[#276152]" : "text-[#717c8d] group-hover:text-[#276152]"
            )} />
            <span className={cn(
              "text-[15px] font-bold tracking-tight",
              isActive(item.path) ? "text-[#276152]" : "text-[#717c8d]"
            )}>{item.label}</span>
          </button>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-300 group"
        >
          <LogOut size={20} className="group-hover:scale-110 transition-transform" />
          <span className="text-[14px] font-bold tracking-tight">{t("sidebar.logout")}</span>
        </button>
      </div>
    </div>
  )
}
