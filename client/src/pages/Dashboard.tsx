import React from "react"
import { useTranslation } from "react-i18next"

export default function Dashboard() {
  const { t } = useTranslation()
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#111827] font-heading">
          {t("dashboard.welcome", { name: `${user.lastName} ${user.firstName}` })}
        </h1>
        <p className="text-[#6b7280] text-lg">
          {t("dashboard.success")} Khám phá các cơ hội đầu tư bất động sản tốt nhất cùng AQ Estate.
        </p>
      </div>

      {/* Main Content (Placeholder for now) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="h-[160px] bg-white rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] p-6 group hover:border-[#276152]/30 transition-all duration-300"
          >
            <div className="w-12 h-12 bg-gray-50 rounded-xl mb-4 group-hover:bg-[#276152]/5 transition-colors" />
            <div className="h-4 bg-gray-100 rounded-full w-2/3 mb-2" />
            <div className="h-4 bg-gray-50 rounded-full w-1/2" />
          </div>
        ))}
      </div>

      <div className="w-full h-[400px] bg-white rounded-3xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] p-8 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-[#276152]/5 rounded-full flex items-center justify-center mb-6">
          <div className="w-10 h-10 bg-[#276152]/10 rounded-full" />
        </div>
        <h3 className="text-xl font-bold text-[#111827] mb-2 font-heading">Chưa có dữ liệu phân tích</h3>
        <p className="text-gray-500 max-w-sm">
          Bắt đầu hành trình đầu tư của bạn bằng cách khám phá các dự án tại Marketplace.
        </p>
      </div>
    </div>
  )
}
