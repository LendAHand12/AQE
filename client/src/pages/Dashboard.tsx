import { useTranslation } from "react-i18next"
import { 
  Calendar, 
} from "lucide-react"

export default function Dashboard() {
  const { t } = useTranslation()
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="bg-[#276152]/5 p-8 rounded-[32px] border border-[#276152]/10 max-w-2xl w-full space-y-6">
        <div className="size-20 bg-[#276152] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#276152]/20 rotate-3">
          <Calendar className="text-white" size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-[32px] font-bold text-[#111827]">Coming Soon</h1>
          <p className="text-[#636D7D] text-[18px]">
            {t("dashboard.coming_soon_msg") || "Chúng tôi đang hoàn thiện trang Dashboard với những tính năng đầu tư cao cấp nhất. Vui lòng quay lại sau!"}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#276152]/40 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            </div>
          ))}
        </div>
        <button 
          onClick={() => window.location.href = '/pre-register'}
          className="mt-4 px-8 py-3 bg-[#276152] text-white font-bold rounded-xl hover:bg-[#1e4d40] transition-all shadow-md active:scale-95"
        >
          {t("dashboard.go_to_pre_register") || "Tham gia Pre-register ngay"}
        </button>
      </div>
    </div>
  )
}
