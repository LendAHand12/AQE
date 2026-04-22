import React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { 
  LayoutDashboard, 
  Briefcase, 
  ShoppingBag, 
  Wallet, 
  TrendingUp, 
  Settings, 
  LogOut,
  ChevronRight,
  Fingerprint,
  Rocket,
  CreditCard,
  Gift,
  History,
  Users,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import logo from "@/assets/logo_green.svg"
import { useAuth } from "@/providers/AuthProvider"

interface SidebarItem {
  icon: React.ElementType
  label: string
  path: string
  key: string
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const mainMenuItems: SidebarItem[] = [
    { icon: LayoutDashboard, label: t("sidebar.dashboard"), path: "/dashboard", key: "dashboard" },
    { icon: Rocket, label: t("sidebar.preRegister"), path: "/pre-register", key: "pre-register" },
    { icon: Users, label: t("sidebar.referrals"), path: "/referrals", key: "referrals" },
    { icon: History, label: t("sidebar.payment_history"), path: "/payment-history", key: "payments" },
    { icon: CreditCard, label: t("sidebar.balance_history"), path: "/balance-history", key: "balance" },
  ]

  const bottomMenuItems: SidebarItem[] = [
    { icon: Settings, label: t("sidebar.settings"), path: "/settings", key: "settings" },
  ]

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
      "fixed inset-y-0 left-0 z-[50] w-[280px] bg-white border-r border-[#e5e7eb] flex flex-col transition-transform duration-300 transform lg:relative lg:translate-x-0 h-screen",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Brand Header */}
      <div className="p-7 flex items-center justify-between">
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

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {mainMenuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => handleNavigate(item.path)}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-[12px] transition-all duration-300 group relative",
              isActive(item.path) 
                ? "bg-[#276152]/10 text-[#276152]" 
                : "text-[#6b7280] hover:bg-gray-50 hover:text-[#111827]"
            )}
          >
            {/* Active Indicator Line */}
            {isActive(item.path) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#276152] rounded-r-full" />
            )}
            
            <item.icon 
              size={22} 
              className={cn(
                "transition-transform group-hover:scale-110",
                isActive(item.path) ? "text-[#276152]" : "text-[#9ca3af]"
              )} 
            />
            <span className="font-semibold text-[15px] tracking-wide">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-[#e5e7eb] space-y-1">
        {bottomMenuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => handleNavigate(item.path)}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-[12px] transition-all duration-300 group",
              isActive(item.path) 
                ? "bg-[#276152]/10 text-[#276152]" 
                : "text-[#6b7280] hover:bg-gray-50 hover:text-[#111827]"
            )}
          >
            <item.icon size={22} className="text-[#9ca3af]" />
            <span className="font-semibold text-[15px] tracking-wide">
              {item.label}
            </span>
          </button>
        ))}
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-[12px] text-red-500 hover:bg-red-50 transition-all duration-300 group"
        >
          <LogOut size={22} className="text-red-400 group-hover:text-red-500" />
          <span className="font-semibold text-[15px] tracking-wide">
            {t("sidebar.logout")}
          </span>
        </button>
      </div>
    </div>
  )
}
