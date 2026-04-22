import { Bell, Globe, Check } from "lucide-react"
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
import { useEffect, useState } from "react"
import { getImageUrl } from "@/lib/utils"
import NotificationDropdown from "./NotificationDropdown"
import { useAuth } from "@/providers/AuthProvider"

export default function Header() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState("")
  const [greetingKey, setGreetingKey] = useState("header.good_morning")
  const [isLangOpen, setIsLangOpen] = useState(false)

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

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    setIsLangOpen(false)
  }

  return (
    <header className="h-[105px] bg-white border-b border-[#efefef] px-6 pt-[24px] pb-[25px] flex items-center justify-between sticky top-0 z-40">
      {/* Left side: Welcome & Date */}
      <div className="flex flex-col gap-[2px]">
        <h2 className="text-[20px] font-semibold text-[#0d1f1d] leading-[30px] tracking-[0.6px]">
          {t(greetingKey)}, {userName}
        </h2>
        <p className="text-[16px] text-[#717c8d] font-medium leading-[24px]">
          {currentDate}
        </p>
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
        <div className="bg-[#efefef] rounded-full pl-1 pr-4 py-1 flex items-center gap-[12px] h-[45px]">
          <Avatar className="size-[37px] border border-white shadow-sm shrink-0">
            {userAvatar && <AvatarImage key={userAvatar} src={getImageUrl(userAvatar)} className="object-cover" />}
            <AvatarFallback className="bg-[#276152] text-white font-bold text-xs">
              {userName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-[16px] font-semibold text-[#0d1f1d] leading-none whitespace-nowrap">{userName}</span>
        </div>
      </div>
    </header>
  )
}
