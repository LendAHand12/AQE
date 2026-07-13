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
    initialJackpot: 1000,
    targetJackpot: 5000,
    currentJackpot: 1000
  })

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get("/admin/plinko-settings")
      if (response.data) {
        setSettings({
          initialJackpot: response.data.initialJackpot || 1000,
          targetJackpot: response.data.targetJackpot || 5000,
          currentJackpot: response.data.currentJackpot || response.data.initialJackpot || 1000
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
        initialJackpot: settings.initialJackpot,
        targetJackpot: settings.targetJackpot
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

  const jackpotProgress = settings.targetJackpot > 0 
    ? (settings.currentJackpot / settings.targetJackpot) * 100 
    : 0

  return (
    <div className="max-w-[1000px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <Gamepad2 className="w-6 h-6 text-[#276152]" /> Plinko Game Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">Configure jackpot properties and track target progression</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm rounded-[24px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#276152]" /> Jackpot Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Initial Jackpot (AQE)</label>
                  <Input 
                    type="number"
                    value={settings.initialJackpot} 
                    onChange={(e) => setSettings({ ...settings, initialJackpot: Number(e.target.value) })} 
                    className="h-12 rounded-[12px] bg-white border-gray-200"
                    placeholder="e.g. 1000"
                    required
                  />
                  <p className="text-[11px] text-gray-400">The baseline value that the jackpot resets to after a user wins.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Target Jackpot (AQE)</label>
                  <Input 
                    type="number"
                    value={settings.targetJackpot} 
                    onChange={(e) => setSettings({ ...settings, targetJackpot: Number(e.target.value) })} 
                    className="h-12 rounded-[12px] bg-white border-gray-200"
                    placeholder="e.g. 5000"
                    required
                  />
                  <p className="text-[11px] text-gray-400">The amount needed before the jackpot displays 100% and can be claimed.</p>
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
                <Info className="w-4 h-4" /> Live Jackpot Pool
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-white/60 text-xs block mb-1">Current Jackpot Pool</span>
                  <span className="text-3xl font-black">{settings.currentJackpot.toFixed(4)} AQE</span>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs font-semibold text-white/80 mb-1.5">
                    <span>Progress to Target</span>
                    <span>{jackpotProgress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden border border-white/10">
                    <div 
                      className="bg-white h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, jackpotProgress)}%` }}
                    />
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Target Jackpot:</span>
                    <span className="font-bold">{settings.targetJackpot.toFixed(2)} AQE</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Initial Jackpot:</span>
                    <span className="font-bold">{settings.initialJackpot.toFixed(2)} AQE</span>
                  </div>
                </div>
              </div>
              
              <div className="text-[12px] text-white/60 leading-relaxed bg-black/15 p-4 rounded-[16px] border border-white/5 space-y-2">
                <p className="font-bold text-white/90">Rules Info:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>USDT Deposits:</strong> 1% of all deposit amounts are added to the live jackpot pool automatically.</li>
                  <li><strong>Game Rewards:</strong> Normal drops reward a random value between 0.001% and 0.01% of the live jackpot.</li>
                  <li><strong>Winner:</strong> When the jackpot reaches the target (100%), hitting the jackpot slot (extreme outer edges) awards the entire live jackpot pool and resets it to the initial value.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
