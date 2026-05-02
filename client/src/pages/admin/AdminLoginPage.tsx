import React, { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { 
  Loader2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import apiClient from "@/lib/axios"
import adminLoginBg from "@/assets/admin_login_bg.svg"
import { cn } from "@/lib/utils"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showTwoFa, setShowTwoFa] = useState(false)
  const [adminId, setAdminId] = useState("")
  const [twoFaCode, setTwoFaCode] = useState(["", "", "", "", "", ""])
  const navigate = useNavigate()
  
  const twoFaRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // If we are already showing 2FA, we need to verify the code
      if (showTwoFa) {
        const otp = twoFaCode.join("")
        if (otp.length < 6) {
          toast.error("Vui lòng nhập đầy đủ mã OTP 6 chữ số")
          setLoading(false)
          return
        }
        
        const response = await apiClient.post("/admin/login/2fa", { code: otp, id: adminId })
        
        localStorage.setItem("admin_token", response.data.token)
        localStorage.setItem("admin_info", JSON.stringify(response.data))
        localStorage.setItem("token", response.data.token)
        toast.success("Xác thực thành công!")
        navigate("/admin/dashboard")
        return
      }

      const response = await apiClient.post("/admin/login", { username, password })
      
      if (response.data.requires2FA) {
        setShowTwoFa(true)
        setAdminId(response.data.id)
        toast.info("Vui lòng nhập mã xác thực Google Authenticator")
      } else {
        localStorage.setItem("admin_token", response.data.token)
        localStorage.setItem("admin_info", JSON.stringify(response.data))
        localStorage.setItem("token", response.data.token)
        toast.success("Đăng nhập hệ thống quản trị thành công!")
        navigate("/admin/dashboard")
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Thông tin đăng nhập không chính xác")
    } finally {
      setLoading(false)
    }
  }

  const handleTwoFaChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newCode = [...twoFaCode]
    newCode[index] = value
    setTwoFaCode(newCode)
    
    if (value && index < 5) {
      twoFaRefs.current[index + 1]?.focus()
    }
  }

  return (
    <div className="min-h-screen flex font-['SVN-Gilroy',sans-serif]">
      {/* Left Panel: Visuals */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-[#0d2118]">
        {/* Background Image */}
        <div className="absolute inset-0">
           <img src={adminLoginBg} alt="Admin Background" className="w-full h-full object-cover" />
        </div>
        
        {/* Dark Overlay for content readability */}
        <div className="absolute inset-0 bg-[#143530]/60" />

        {/* Decorative Grid Dots */}
        <div className="absolute inset-0 grid grid-cols-9 grid-rows-[repeat(16,minmax(0,1fr))] p-10 opacity-20 pointer-events-none">
           {Array.from({ length: 9 * 16 }).map((_, i) => (
             <div key={i} className="size-1 bg-white rounded-full place-self-center" />
           ))}
        </div>

        {/* Floating Decorative Orbs */}
        <div className="absolute top-[-120px] right-[-100px] size-[320px] bg-[#3B9A84]/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] left-[-60px] size-[280px] bg-[#276152]/30 rounded-full blur-[80px]" />
        <div className="absolute top-[40%] left-[20%] size-[120px] bg-white/5 rounded-full blur-[60px]" />

        {/* Content Container */}
        <div className="relative z-10 h-full flex flex-col justify-between p-12 pt-16">
          
          {/* Top Branding Section */}
          <div className="space-y-5">
             <div className="inline-flex items-center gap-2 bg-[#276152]/50 backdrop-blur-md px-5 py-2.5 rounded-[14px] border border-white/10">
                <span className="text-white text-lg">✦</span>
                <span className="text-white font-extrabold text-[16px] tracking-tight">AQE Estate</span>
             </div>
             <p className="text-white text-[9px] font-bold tracking-[2px] pl-2 flex items-center gap-2 opacity-80">
                <span className="text-[12px] opacity-70">⬡</span> ADMIN
             </p>
          </div>

          {/* Center Content Section */}
          <div className="space-y-12">
             <div className="space-y-0">
                <h2 className="text-white text-[52px] font-extrabold leading-[1.1] tracking-tight">Hệ thống</h2>
                <h2 className="text-[#6dbfab] text-[52px] font-extrabold leading-[1.1] tracking-tight">Quản trị</h2>
                <h2 className="text-[#3b9a84] text-[52px] font-extrabold leading-[1.1] tracking-tight">AQ Estate</h2>
                <div className="h-[3px] w-[72px] bg-[#3b9a84] rounded-full mt-6" />
             </div>

             <div className="text-[#9dd5c6] text-[14px] max-w-[500px] leading-relaxed font-medium">
                <p>Nền tảng bất động sản token hóa hàng đầu Việt Nam.</p>
                <p>Quản lý toàn bộ dự án, người dùng và giao dịch từ một nơi.</p>
             </div>

             {/* Feature Pills List */}
             <div className="space-y-3.5 max-w-[524px]">
                {[
                  { icon: '🏘', label: 'Quản lý dự án & tài sản' },
                  { icon: '👥', label: 'Phân quyền người dùng & KYC' },
                  { icon: '⚡', label: 'Pre-sales & huy động vốn thông minh' },
                  { icon: '📊', label: 'Báo cáo thời gian thực' }
                ].map((item, idx) => (
                  <div key={idx} className="h-11 bg-white/5 border border-[#3b9a84]/30 backdrop-blur-sm rounded-[12px] flex items-center px-4 gap-4 group hover:bg-white/10 transition-all cursor-default">
                     <span className="text-[18px] opacity-80 group-hover:opacity-100 transition-opacity">{item.icon}</span>
                     <span className="text-[#c5e8de] text-[13px] font-semibold">{item.label}</span>
                  </div>
                ))}
             </div>
          </div>

          {/* Stats Footer Section */}
          <div className="relative -mx-12">
            <div className="absolute inset-0 bg-black/25 backdrop-blur-md border-t border-white/5" />
            <div className="relative h-[96px] flex items-center px-12 divide-x divide-[#3b9a84]/30">
               <div className="pr-12">
                  <p className="text-white text-[19px] font-extrabold">342</p>
                  <p className="text-[#9dd5c6] text-[11px] font-medium tracking-wide">Dự án</p>
               </div>
               <div className="px-12">
                  <p className="text-white text-[19px] font-extrabold">12,847</p>
                  <p className="text-[#9dd5c6] text-[11px] font-medium tracking-wide">Người dùng</p>
               </div>
               <div className="pl-12">
                  <p className="text-white text-[19px] font-extrabold">4.8 tỷ đ</p>
                  <p className="text-[#9dd5c6] text-[11px] font-medium tracking-wide">Doanh thu</p>
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 relative overflow-hidden">
        <div className="w-full max-w-[440px] space-y-8 relative z-10">
          {/* Header Texts */}
          <div className="space-y-3">
             <p className="text-[#9CA3AF] text-[13px] font-medium">
                Chào mừng trở lại 👋
             </p>
             <h3 className="text-[#111827] text-[36px] font-extrabold tracking-tight leading-none">
                Đăng nhập
             </h3>
             <p className="text-[#6B7280] text-[14px]">
                Vui lòng xác thực danh tính quản trị viên để tiếp tục
             </p>
          </div>

          <div className="h-px bg-[#E5E7EB] w-full" />

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
               <label className="text-[12px] font-bold text-[#374151]">Email quản trị viên</label>
               <div className="relative group">
                  <div className="absolute left-[13px] top-1/2 -translate-y-1/2 size-6 bg-[#E8F5F1] rounded-lg flex items-center justify-center text-[#276152]">
                     <Mail size={14} />
                  </div>
                  <Input 
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin@aqe.vn"
                    className="h-[52px] pl-12 border-[#E5E7EB] bg-[#F9FAF9] rounded-[14px] focus-visible:ring-0 focus:border-[#276152] transition-all font-medium"
                    required
                    disabled={showTwoFa}
                  />
               </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
               <div className="flex justify-between items-center">
                  <label className="text-[12px] font-bold text-[#374151]">Mật khẩu</label>
                  {!showTwoFa && <button type="button" className="text-[#276152] text-[12px] font-semibold hover:underline">Quên mật khẩu?</button>}
               </div>
               <div className="relative group">
                  <div className="absolute left-[13px] top-1/2 -translate-y-1/2 size-6 bg-[#E8F5F1] rounded-lg flex items-center justify-center text-[#276152]">
                     <Lock size={14} />
                  </div>
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="h-[52px] pl-12 pr-12 border-[#E5E7EB] focus-visible:ring-0 focus:border-[#276152] rounded-[14px] border-2 transition-all font-bold"
                    required
                    disabled={showTwoFa}
                  />
                  {!showTwoFa && (
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#276152]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}
               </div>
            </div>

            {/* 2FA Input Area - Conditional */}
            {showTwoFa && (
              <div className="bg-[#F9FAF9] border border-[#276152] rounded-[14px] p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <label className="text-[12px] font-bold text-[#276152]">Mã xác thực 2FA</label>
                       <span className="text-[10px] bg-[#E8F5F1] text-[#276152] px-2 py-0.5 rounded-full font-bold">BẮT BUỘC</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280]">Nhập mã 6 chữ số từ ứng dụng Authenticator của bạn</p>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    {twoFaCode.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { twoFaRefs.current[i] = el; }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleTwoFaChange(i, e.target.value)}
                        className={cn(
                          "size-8 sm:size-10 rounded-[10px] border-2 bg-white text-center text-lg font-bold outline-none transition-all",
                          digit ? "border-[#276152] text-[#111827]" : "border-[#E5E7EB]"
                        )}
                        autoFocus={i === 0}
                      />
                    ))}
                    <button type="button" className="text-[#276152] text-[11px] font-bold ml-auto hover:underline" onClick={() => setShowTwoFa(false)}>Quay lại</button>
                 </div>
              </div>
            )}

            {/* Login Button */}
            <Button 
               type="submit"
               className="w-full h-[54px] bg-[#276152] hover:bg-[#1e4d41] rounded-[14px] text-white font-bold text-[15px] group relative overflow-hidden transition-all shadow-lg shadow-[#276152]/20"
               disabled={loading}
            >
               {loading ? <Loader2 className="animate-spin" /> : (
                 <div className="flex items-center justify-center gap-2">
                    <span>{showTwoFa ? "Xác nhận truy cập" : "Tiếp tục đăng nhập"}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                 </div>
               )}
               <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10" />
            </Button>
          </form>

          {/* Footer Info */}
          <div className="pt-2 space-y-4">
             <p className="text-[11px] text-[#9CA3AF] flex items-center justify-center gap-2">
                <span className="text-[#276152]">🔒</span> Kết nối được mã hóa SSL · Phiên làm việc hết hạn sau 8 giờ
             </p>
             <div className="h-px bg-[#E5E7EB] w-full" />
             <div className="flex justify-between items-start gap-4">
                <p className="text-[11px] text-[#9CA3AF] leading-relaxed flex-1">
                   AQE Estate © 2026 · Hệ thống quản trị nội bộ · Chỉ dành cho nhân viên được phân quyền
                </p>
                <div className="bg-[#E8F5F1] rounded-full px-3 py-1 text-[#276152] text-[10px] font-bold shrink-0">
                   v2.0 · Admin
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
