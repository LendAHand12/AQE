import { NavLink, useLocation } from "react-router-dom"
import { 
  Users, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  Coins,
  Building2,
  HandCoins,
  BadgePercent,
} from "lucide-react"
import { cn } from "@/lib/utils"
import logoGreen from "@/assets/logo_green.svg"

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Người dùng",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Bất động sản",
    href: "/admin/properties",
    icon: Building2,
  },
  {
    title: "Giao dịch",
    href: "/admin/transactions/payments",
    icon: HandCoins,
  },
  {
    title: "Hoa hồng",
    href: "/admin/transactions/commissions",
    icon: BadgePercent,
  },
  {
    title: "Phân phối AQE",
    href: "/admin/transactions/aqe",
    icon: Coins,
  },
  {
    title: "Quản lý Rút tiền",
    href: "/admin/withdrawals",
    icon: HandCoins,
  },
  {
    title: "Cài đặt Pool",
    href: "/admin/token-settings",
    icon: Settings,
  },
]

const bottomNavItems = [
  {
    title: "Cài đặt",
    href: "/admin/settings",
    icon: Settings,
  },
]

export default function AdminSidebar() {
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    localStorage.removeItem("admin_info")
    localStorage.removeItem("token")
    window.location.href = "/admin/login"
  }

  return (
    <div className="w-[260px] h-screen bg-[#efefef]/50 border-r border-[#d5d7db] flex flex-col fixed left-0 top-0 z-50">
      {/* Logo Section */}
      <div className="pt-8 px-6 pb-6">
        <div className="flex items-center">
          <img src={logoGreen} alt="AQ Estate Logo" className="h-[40px] w-auto object-contain" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        <div className="flex flex-col gap-2">
          {mainNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) => cn(
                  "group flex items-center px-4 py-2.5 transition-all duration-200",
                  isActive 
                    ? "bg-[#d9ede8] text-[#276152] border-l-[3px] border-[#276152] rounded-r-[12px] -ml-4 pl-[19px]" 
                    : "text-[#868f9e] hover:bg-white/50 hover:text-[#276152] rounded-[12px]"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn(
                    "w-[22px] h-[22px] transition-colors",
                    isActive ? "text-[#276152]" : "text-[#868f9e] group-hover:text-[#276152]"
                  )} />
                  <span className="text-[16px] font-semibold">{item.title}</span>
                </div>
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="px-4 pb-8 space-y-2 pt-4 border-t border-[#d5d7db]">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => cn(
                "group flex items-center px-4 py-2.5 transition-all duration-200",
                isActive 
                  ? "bg-[#d9ede8] text-[#276152] border-l-[3px] border-[#276152] rounded-r-[12px] -ml-4 pl-[19px]" 
                  : "text-[#868f9e] hover:bg-white/50 hover:text-[#276152] rounded-[12px]"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn(
                  "w-[22px] h-[22px] transition-colors",
                  isActive ? "text-[#276152]" : "text-[#868f9e] group-hover:text-[#276152]"
                )} />
                <span className="text-[16px] font-semibold tracking-[0.48px]">{item.title}</span>
              </div>
            </NavLink>
          )
        })}
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-[#868f9e] hover:bg-red-50 hover:text-red-500 rounded-[12px] transition-all duration-200 font-semibold text-[16px] tracking-[0.48px]"
        >
          <LogOut className="w-[22px] h-[22px]" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  )
}
