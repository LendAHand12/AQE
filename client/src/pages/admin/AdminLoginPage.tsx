import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Loader2, Lock, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import apiClient from "@/lib/axios"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await apiClient.post("/admin/login", { username, password })
      localStorage.setItem("admin_token", response.data.token)
      localStorage.setItem("admin_info", JSON.stringify(response.data))
      // Also set the main token for interceptors
      localStorage.setItem("token", response.data.token)
      
      toast.success("Đăng nhập Admin thành công!")
      navigate("/admin/users")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Đăng nhập thất bại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8faf9] p-6">
      <Card className="w-full max-w-[400px] border-none shadow-2xl rounded-[20px] overflow-hidden">
        <div className="bg-[#276152] p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
            <Lock className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Portal</CardTitle>
          <CardDescription className="text-white/60">AQ Estate Management System</CardDescription>
        </div>
        <CardContent className="p-8 pt-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-500 uppercase tracking-widest pl-1">Username</label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 pl-12 border-gray-200 rounded-[12px] focus:ring-[#276152]"
                  required
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-500 uppercase tracking-widest pl-1">Password</label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-12 border-gray-200 rounded-[12px] focus:ring-[#276152]"
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-[#276152] hover:bg-[#1e4d41] rounded-[12px] font-bold text-lg shadow-lg shadow-[#276152]/20 transition-all active:scale-95"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : "Sign In to Admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
