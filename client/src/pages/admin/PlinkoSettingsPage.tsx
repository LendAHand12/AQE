import React, { useState, useEffect } from "react"
import {
  Coins,
  Save,
  Loader2,
  RefreshCw,
  Info,
  Gamepad2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import { useAdminPermissions } from "@/hooks/useAdminPermissions"

export default function PlinkoSettingsPage() {
  const { hasPermission } = useAdminPermissions()
  const canEdit = hasPermission('SETTINGS_EDIT')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    plinkoBaseReward: 1
  })

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get("/admin/plinko-settings")
      if (response.data) {
        setSettings({
          plinkoBaseReward: response.data.plinkoBaseReward !== undefined ? response.data.plinkoBaseReward : 1
        })
      }
    } catch (err) {
      toast.error("Could not load Plinko settings")
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
      await apiClient.put("/admin/plinko-settings", {
        plinkoBaseReward: settings.plinkoBaseReward
      })
      toast.success("Plinko configurations updated successfully!")
      fetchSettings()
    } catch (err) {
      toast.error("Plinko update failed")
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
    <div className="max-w-[1000px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <Gamepad2 className="w-6 h-6 text-[#276152]" /> Plinko Game Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">Cấu hình mức thưởng AQE cơ bản mỗi lần thả bóng</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm rounded-[24px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#276152]" /> Mức thưởng AQE cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600">Giá trị X (AQE nhận được = X × Multiplier)</label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={settings.plinkoBaseReward}
                  onChange={(e) => setSettings({ ...settings, plinkoBaseReward: Number(e.target.value) })}
                  className="h-12 rounded-[12px] bg-white border-gray-200"
                  placeholder="e.g. 1"
                  required
                />
                <p className="text-[11px] text-gray-400">Ví dụ: X = 1, thả bóng rơi vào ô x5 sẽ nhận 5 AQE. X = 2, thả bóng rơi vào ô x5 sẽ nhận 10 AQE.</p>
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
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button
              type="submit"
              disabled={saving || !canEdit}
              className="h-12 px-8 rounded-[12px] bg-[#276152] hover:bg-[#1e4d41] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {canEdit ? "Save Changes" : "No permission to edit"}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-[#276152] text-white rounded-[24px]">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 opacity-80 uppercase text-[11px] font-bold tracking-widest">
                <Info className="w-4 h-4" /> Rules Info
              </div>
              <div className="text-[12px] text-white/80 leading-relaxed space-y-2">
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Nạp USDT:</strong> Mỗi 10 USDT nạp = 1 lần thả bóng (Ball).</li>
                  <li><strong>Thả bóng:</strong> Bóng rơi vào ô multiplier, AQE nhận được = X × multiplier, cộng vào thưởng chờ claim.</li>
                  <li><strong>Claim:</strong> Người dùng bấm Claim để chuyển toàn bộ AQE thưởng vào số dư AQE chính thức.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
