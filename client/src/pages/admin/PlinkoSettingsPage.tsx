import React, { useState, useEffect } from "react"
import {
  Coins,
  Save,
  Loader2,
  RefreshCw,
  Info,
  Gamepad2,
  Trophy
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
    plinkoBaseReward: 1,
    jackpotContributionPercent: 0.1, // displayed as %, stored on server as decimal (0.001 = 0.1%)
    targetJackpot: 1000
  })
  const [currentJackpot, setCurrentJackpot] = useState(0)

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get("/admin/plinko-settings")
      if (response.data) {
        const rate = response.data.jackpotContributionRate !== undefined ? response.data.jackpotContributionRate : 0.001
        setSettings({
          plinkoBaseReward: response.data.plinkoBaseReward !== undefined ? response.data.plinkoBaseReward : 1,
          jackpotContributionPercent: rate * 100,
          targetJackpot: response.data.targetJackpot !== undefined ? response.data.targetJackpot : 1000
        })
        setCurrentJackpot(response.data.currentJackpot || 0)
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
        plinkoBaseReward: settings.plinkoBaseReward,
        jackpotContributionRate: settings.jackpotContributionPercent / 100,
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

  return (
    <div className="max-w-[1000px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <Gamepad2 className="w-6 h-6 text-[#276152]" /> Plinko Game Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">Configure the base AQE reward per ball drop</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm rounded-[24px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#276152]" /> Base AQE Reward
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600">Value X (AQE received = X × Multiplier)</label>
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
                <p className="text-[11px] text-gray-400">Example: X = 1, landing on the x5 slot gives 5 AQE. X = 2, landing on the x5 slot gives 10 AQE.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[24px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Jackpot Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Jackpot Contribution Rate (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.jackpotContributionPercent}
                    onChange={(e) => setSettings({ ...settings, jackpotContributionPercent: Number(e.target.value) })}
                    className="h-12 rounded-[12px] bg-white border-gray-200"
                    placeholder="e.g. 0.1"
                    required
                  />
                  <p className="text-[11px] text-gray-400">Example: 0.1 means 0.1% of every USDT deposit a user makes will be added to the Jackpot pool.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Target Jackpot (USDT)</label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={settings.targetJackpot}
                    onChange={(e) => setSettings({ ...settings, targetJackpot: Number(e.target.value) })}
                    className="h-12 rounded-[12px] bg-white border-gray-200"
                    placeholder="e.g. 1000"
                    required
                  />
                  <p className="text-[11px] text-gray-400">Once the Jackpot pool reaches this amount, the Jackpot slots (the two outer x110 edges) become armed.</p>
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
          <Card className="border-none bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-[24px]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 opacity-90 uppercase text-[11px] font-bold tracking-widest">
                <Trophy className="w-4 h-4" /> Live Jackpot Pool
              </div>
              <div>
                <span className="text-white/70 text-xs block mb-1">Current Jackpot Pool</span>
                <span className="text-3xl font-black">{currentJackpot.toFixed(4)} USDT</span>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-white/90 mb-1.5">
                  <span>Progress to Target</span>
                  <span>{settings.targetJackpot > 0 ? Math.min(100, (currentJackpot / settings.targetJackpot) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-500"
                    style={{ width: `${settings.targetJackpot > 0 ? Math.min(100, (currentJackpot / settings.targetJackpot) * 100) : 0}%` }}
                  />
                </div>
              </div>
              {currentJackpot >= settings.targetJackpot && settings.targetJackpot > 0 && (
                <div className="bg-black/20 rounded-[12px] p-3 text-[12px] font-bold text-center">
                  🎉 Jackpot is ARMED — ready to be won!
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none bg-[#276152] text-white rounded-[24px]">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 opacity-80 uppercase text-[11px] font-bold tracking-widest">
                <Info className="w-4 h-4" /> Rules Info
              </div>
              <div className="text-[12px] text-white/80 leading-relaxed space-y-2">
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>USDT Deposit:</strong> Every 10 USDT deposited = 1 ball drop.</li>
                  <li><strong>Ball Drop:</strong> The ball lands on a multiplier slot, AQE received = X × multiplier, added to the pending claim reward.</li>
                  <li><strong>Claim:</strong> Users click Claim to move the entire pending AQE reward into their official AQE balance.</li>
                  <li><strong>Jackpot:</strong> Once the pool reaches the Target, landing on one of the two outer edges (x110) wins the entire Jackpot converted to AQE, instead of the usual multiplier reward.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
