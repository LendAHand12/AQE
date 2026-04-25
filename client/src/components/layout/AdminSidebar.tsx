import { NavLink, useLocation } from "react-router-dom"
import { 
  Users, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  Wallet,
  Coins
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Quản lý thành viên",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Lịch sử thanh toán",
    href: "/admin/transactions/payments",
    icon: Wallet,
  },
  {
    title: "Lịch sử hoa hồng",
    href: "/admin/transactions/commissions",
    icon: Users,
  },
  {
    title: "Phân phối AQE",
    href: "/admin/transactions/aqe",
    icon: Coins,
  },
  {
    title: "Cài đặt Pool & Token",
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
    <div className="w-[280px] h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-50">
      {/* Logo Section */}
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#276152] rounded-[12px] flex items-center justify-center shadow-lg shadow-[#276152]/20">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-[#111827] leading-tight">AQ Estate</h1>
            <p className="text-[11px] font-bold text-[#276152] uppercase tracking-[1px]">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) => cn(
              "group flex items-center justify-between px-4 py-3 rounded-[12px] transition-all duration-200",
              isActive 
                ? "bg-[#f0f7f5] text-[#276152]" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                location.pathname === item.href ? "text-[#276152]" : "text-gray-400 group-hover:text-gray-600"
              )} />
              <span className="text-[15px] font-semibold">{item.title}</span>
            </div>
            {location.pathname === item.href && (
              <ChevronRight className="w-4 h-4" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-100 italic text-[12px] text-gray-400 px-8 py-6">
        <p>Phiên bản: 1.0.0</p>
      </div>

      <div className="p-4 mb-4">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-[12px] transition-all duration-200 font-bold"
        >
          <LogOut size={20} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  )
}
