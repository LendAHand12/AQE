import { Globe, Check, Menu, LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { useEffect, useState, useRef } from "react"
import { getImageUrl } from "@/lib/utils"
import NotificationDropdown from "./NotificationDropdown"
import { useAuth } from "@/providers/AuthProvider"
import { useNavigate } from "react-router-dom"

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState("")
  const [greetingKey, setGreetingKey] = useState("header.good_morning")
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const userName = user?.fullName || user?.username || "User"
  const userAvatar = user?.avatar || null

  useEffect(() => {
    const updateHeaderInfo = () => {
      const now = new Date()
      const hour = now.getHours()
      
      if (hour >= 5 && hour < 12) {
        setGreetingKey("header.good_morning")
      } else if (hour >= 12 && hour < 18) {
        setGreetingKey("header.good_afternoon")
      } else {
        setGreetingKey("header.good_evening")
      }

      const daysVi = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
      const daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      
      const day = now.getDay();
      const date = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();

      if (i18n.language === 'vi') {
        setCurrentDate(`${daysVi[day]}, ${date}/${month}/${year}`);
      } else {
        setCurrentDate(`${daysEn[day]}, ${month}/${date}/${year}`);
      }
    }

    updateHeaderInfo()
    const timer = setInterval(updateHeaderInfo, 60000)
    return () => {
      clearInterval(timer)
    }
  }, [i18n.language])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    setIsLangOpen(false)
  }

  return (
    <header className="h-[90px] lg:h-[105px] bg-white py-2 border-b border-[#efefef] px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left side: Menu Toggle (Mobile) & Welcome & Date */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-[#276152] hover:bg-[#276152]/5 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        
        <div className="hidden lg:flex flex-col gap-[2px]">
          <h2 className="text-[20px] font-semibold text-[#0d1f1d] leading-[30px] tracking-[0.6px]">
            {t(greetingKey)}, {userName}
          </h2>
          <p className="text-[16px] text-[#717c8d] font-medium leading-[24px]">
            {currentDate}
          </p>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-[12px]">
        {/* Language Modal Switcher */}
        <Dialog open={isLangOpen} onOpenChange={setIsLangOpen}>
          <DialogTrigger asChild>
            <button className="h-9 border border-[#efefef] bg-white hover:bg-[#f8f9fa] transition-colors rounded-full px-3 gap-2 flex items-center justify-center outline-none text-[13px] font-semibold text-[#717c8d]">
              <Globe className="h-4 w-4" />
              <span className="uppercase">{i18n.language}</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
            <div className="bg-[#276152] p-8 text-white relative">
              <DialogHeader className="gap-1">
                <DialogTitle className="text-2xl font-bold text-white leading-tight">
                  {t("header.select_language")}
                </DialogTitle>
                <DialogDescription className="text-white/70 text-sm">
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
            </div>
          </DialogContent>
        </Dialog>

        {/* Notifications */}
        <NotificationDropdown />

        {/* User Profile - Pill Container (Info Only) */}
        <div className="relative" ref={userMenuRef}>
          <div 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="bg-[#efefef] rounded-full p-1 lg:pr-4 flex items-center lg:gap-[12px] h-[40px] lg:h-[45px] cursor-pointer hover:bg-gray-200 transition-colors"
          >
            <Avatar className="size-[32px] lg:size-[37px] border border-white shadow-sm shrink-0">
              {userAvatar && <AvatarImage key={userAvatar} src={getImageUrl(userAvatar)} className="object-cover" />}
              <AvatarFallback className="bg-[#276152] text-white font-bold text-xs">
                {userName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden lg:inline text-[16px] font-semibold text-[#0d1f1d] leading-none whitespace-nowrap">{userName}</span>
          </div>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-3 w-[180px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-semibold text-sm"
                >
                  <LogOut size={18} />
                  {t("sidebar.logout")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
