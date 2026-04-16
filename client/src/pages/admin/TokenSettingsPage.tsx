import React, { useState, useEffect } from "react"
import { 
  Coins, 
  Settings2, 
  TrendingUp, 
  Database,
  Save,
  Loader2,
  RefreshCw,
  Info
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import apiClient from "@/lib/axios"

export default function TokenSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    name: "AQ Estate Token",
    symbol: "AQE",
    totalSupply: 100000000,
    usdtPool: 10000,
    currentPrice: 0.1
  })

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get("/admin/token-settings")
      setSettings({
        name: response.data.name,
        symbol: response.data.symbol,
        totalSupply: response.data.totalSupply,
        usdtPool: response.data.usdtPool,
        currentPrice: response.data.currentPrice
      })
    } catch (err) {
      toast.error("Không thể tải cấu hình Token")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiClient.put("/admin/token-settings", settings)
      toast.success("Đã cập nhật cấu hình hệ thống thành công!")
    } catch (err) {
      toast.error("Cập nhật thất bại")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 text-[#276152] animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1000px] mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-[32px] font-bold text-[#111827] flex items-center gap-3">
          <Settings2 className="w-8 h-8 text-[#276152]" /> Cấu hình Token & Explorer
        </h1>
        <p className="text-gray-500">Thiết lập các thông số cơ bản cho hệ sinh thái AQE Blockchain.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm rounded-[24px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#276152]" /> Thông tin Token
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Tên Token</label>
                  <Input 
                    value={settings.name} 
                    onChange={(e) => setSettings({...settings, name: e.target.value})} 
                    className="h-12 rounded-[12px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Ký hiệu (Symbol)</label>
                  <Input 
                    value={settings.symbol} 
                    disabled
                    className="h-12 rounded-[12px] bg-gray-50 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500">Tổng cung (Total Supply)</label>
                <div className="relative">
                  <Input 
                    type="number"
                    value={settings.totalSupply} 
                    onChange={(e) => setSettings({...settings, totalSupply: Number(e.target.value)})} 
                    className="h-12 rounded-[12px] pl-10"
                  />
                  <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[24px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#276152]" /> Tính toán giá & Thanh khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500">USDT Pool ban đầu</label>
                <div className="relative">
                  <Input 
                    type="number"
                    value={settings.usdtPool} 
                    onChange={(e) => setSettings({...settings, usdtPool: Number(e.target.value)})} 
                    className="h-12 rounded-[12px] pr-16 font-bold"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-50 px-2 py-1 rounded-[6px] border border-gray-100">
                    <span className="font-bold text-gray-400 text-[11px]">USDT</span>
                  </div>
                </div>
                <p className="text-[12px] text-gray-400 italic">Lượng USDT này sẽ dùng làm cơ sở để tính mức vốn hóa ban đầu.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500">Giá hiện tại (Current Price)</label>
                <div className="relative">
                  <Input 
                    type="number"
                    step="0.0001"
                    value={settings.currentPrice} 
                    onChange={(e) => setSettings({...settings, currentPrice: Number(e.target.value)})} 
                    className="h-12 rounded-[12px] pl-10 font-bold text-[#276152]"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">$</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button 
               type="button"
               variant="outline" 
               onClick={fetchSettings}
               className="h-12 px-6 rounded-[12px]"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Làm mới
            </Button>
            <Button 
              type="submit"
              disabled={saving}
              className="h-12 px-8 rounded-[12px] bg-[#276152] hover:bg-[#1e4d41]"
            >
              {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
              Lưu thay đổi
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-[#276152] text-white rounded-[24px]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 opacity-80 uppercase text-[11px] font-bold tracking-widest">
                <Info className="w-4 h-4" /> Bản tóm tắt Token
              </div>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60 text-sm">Vốn hóa:</span>
                  <span className="font-bold">${(settings.totalSupply * settings.currentPrice).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60 text-sm">Tỷ lệ Pool:</span>
                  <span className="font-bold">{(settings.usdtPool / settings.totalSupply * 100).toFixed(6)}%</span>
                </div>
              </div>
              <p className="text-[12px] text-white/50 italic leading-relaxed">
                Lưu ý: Việc thay đổi trực tiếp giá có thể gây biến động mạnh trên Explorer. Chỉ nên điều chỉnh khi cần cấu hình lại hệ thống.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
