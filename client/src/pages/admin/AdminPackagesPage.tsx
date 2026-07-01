import { useState, useEffect } from "react"
import {
  Plus,
  Edit2,
  Trash2,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import { useAdminPermissions } from "@/hooks/useAdminPermissions"

interface Package {
  _id: string
  title: string
  price: number
  description: string
  bonusPercent: number
  segment: "Cơ bản" | "Nâng cao" | "Cao cấp"
  aqeAmount: number
  f1CommissionPercent: number
  f2CommissionPercent: number
  isActive: boolean
  color?: string
  // Benefits properties
  stayDays?: string
  roomType?: string
  vipLounge?: boolean
  guests?: string
  roomService?: boolean
  transportation?: boolean
  savings?: string
  wellness?: boolean
  priority?: boolean
  concierge?: boolean
}

const PALETTE_COLORS = [
  '#276152', // Emerald Green
  '#1d3557', // Midnight Blue
  '#7209b7', // Rich Purple
  '#0f4c5c', // Deep Teal
  '#b7094c', // Warm Ruby
  '#4a121a', // Crimson
  '#3a0ca3', // Indigo Royal
  '#1b4965', // Ocean Blue
  '#2d3748', // Charcoal Grey
  '#e76f51', // Terracotta
  '#f4a261', // Sandy Gold
  '#e9c46a'  // Light Yellow
];

export default function AdminPackagesPage() {
  const { hasPermission } = useAdminPermissions()
  const canEdit = hasPermission("PACKAGES_EDIT")
  const canDelete = hasPermission("PACKAGES_DELETE")

  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)

  // Form states
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [aqeAmount, setAqeAmount] = useState("")
  const [bonusPercent, setBonusPercent] = useState("")
  const [f1CommissionPercent, setF1CommissionPercent] = useState("8")
  const [f2CommissionPercent, setF2CommissionPercent] = useState("2")
  const [segment, setSegment] = useState<"Cơ bản" | "Nâng cao" | "Cao cấp">("Cơ bản")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [color, setColor] = useState("")
  
  // Benefits Form States
  const [stayDays, setStayDays] = useState("")
  const [roomType, setRoomType] = useState("")
  const [vipLounge, setVipLounge] = useState(false)
  const [guests, setGuests] = useState("")
  const [roomService, setRoomService] = useState(false)
  const [transportation, setTransportation] = useState(false)
  const [savings, setSavings] = useState("")
  const [wellness, setWellness] = useState(false)
  const [priority, setPriority] = useState(false)
  const [concierge, setConcierge] = useState(false)

  useEffect(() => {
    fetchPackages()
  }, [])

  // Auto calculate AQE Received (including Bonus)
  useEffect(() => {
    const priceNum = parseFloat(price) || 0
    const bonusNum = parseFloat(bonusPercent) || 0
    const baseAqe = priceNum / 1.02
    const totalAqe = baseAqe * (1 + bonusNum / 100)
    setAqeAmount(totalAqe.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 }))
  }, [price, bonusPercent])

  const fetchPackages = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get("/admin/packages")
      setPackages(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load investment packages")
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingPackage(null)
    setTitle("")
    setPrice("")
    setAqeAmount("")
    setBonusPercent("0")
    setF1CommissionPercent("8")
    setF2CommissionPercent("2")
    setSegment("Cơ bản")
    setDescription("")
    setIsActive(true)
    setColor('#276152')
    // Reset benefits
    setStayDays("")
    setRoomType("")
    setVipLounge(false)
    setGuests("")
    setRoomService(false)
    setTransportation(false)
    setSavings("")
    setWellness(false)
    setPriority(false)
    setConcierge(false)
    setIsModalOpen(true)
  }

  const openEditModal = (pkg: Package) => {
    setEditingPackage(pkg)
    setTitle(pkg.title)
    setPrice(pkg.price.toString())
    setAqeAmount(pkg.aqeAmount.toString())
    setBonusPercent(pkg.bonusPercent.toString())
    setF1CommissionPercent(pkg.f1CommissionPercent.toString())
    setF2CommissionPercent(pkg.f2CommissionPercent.toString())
    setSegment(pkg.segment)
    setDescription(pkg.description)
    setIsActive(pkg.isActive)
    setColor(pkg.color || '#276152')
    // Load benefits
    setStayDays(pkg.stayDays || "")
    setRoomType(pkg.roomType || "")
    setVipLounge(!!pkg.vipLounge)
    setGuests(pkg.guests || "")
    setRoomService(!!pkg.roomService)
    setTransportation(!!pkg.transportation)
    setSavings(pkg.savings || "")
    setWellness(!!pkg.wellness)
    setPriority(!!pkg.priority)
    setConcierge(!!pkg.concierge)
    
    // Explicitly update calculated AQE Amount for editing modal
    const baseAqe = pkg.aqeAmount || (pkg.price / 1.02)
    const totalAqe = baseAqe * (1 + pkg.bonusPercent / 100)
    setAqeAmount(totalAqe.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 }))
    
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !price || !description) {
      toast.error("Please enter all required information")
      return
    }

    const payload = {
      title,
      price: Number(price),
      aqeAmount: Number(price) / 1.02, // auto calculated base amount saved to DB
      bonusPercent: Number(bonusPercent || 0),
      f1CommissionPercent: Number(f1CommissionPercent || 0),
      f2CommissionPercent: Number(f2CommissionPercent || 0),
      segment,
      description,
      isActive,
      color: color || undefined,
      // Benefits Payload
      stayDays,
      roomType,
      vipLounge,
      guests,
      roomService,
      transportation,
      savings,
      wellness,
      priority,
      concierge
    }

    try {
      if (editingPackage) {
        await apiClient.put(`/admin/packages/${editingPackage._id}`, payload)
        toast.success("Updated investment package successfully")
      } else {
        await apiClient.post("/admin/packages", payload)
        toast.success("Added new investment package successfully")
      }
      setIsModalOpen(false)
      fetchPackages()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "An error occurred while saving")
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this investment package?")) return

    try {
      await apiClient.delete(`/admin/packages/${id}`)
      toast.success("Deleted investment package successfully")
      fetchPackages()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete package")
    }
  }

  if (loading && packages.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#276152]" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div />
        {canEdit && (
          <Button
            onClick={openAddModal}
            className="bg-[#276152] hover:bg-[#1e4d41] text-white rounded-xl font-bold flex items-center gap-2 h-11 px-5"
          >
            <Plus size={18} />
            <span>Add New Package</span>
          </Button>
        )}
      </div>

      {/* Packages Table Card */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6">Investment Package</th>
                <th className="py-4 px-6">Price (USDT)</th>
                <th className="py-4 px-6">Segment</th>
                <th className="py-4 px-6">AQE Received</th>
                <th className="py-4 px-6">Color</th>
                <th className="py-4 px-6">Bonus (%)</th>
                <th className="py-4 px-6">Commission F1/F2</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-semibold text-[#0d1f1d]">
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400 font-medium">
                    No investment packages have been created yet.
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-[#276152]">{pkg.title}</td>
                    <td className="py-4 px-6">${pkg.price.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        pkg.segment === "Cao cấp" ? "bg-amber-50 text-amber-600" :
                        pkg.segment === "Nâng cao" ? "bg-blue-50 text-blue-600" :
                        "bg-gray-50 text-gray-600"
                      }`}>
                        {pkg.segment === "Cao cấp" ? "Premium" : pkg.segment === "Nâng cao" ? "Advanced" : "Basic"}
                      </span>
                    </td>
                    <td className="py-4 px-6">{(pkg.aqeAmount * (1 + pkg.bonusPercent / 100)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} AQE</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <span className="size-3.5 rounded-full border border-gray-200" style={{ backgroundColor: pkg.color || '#276152' }} />
                        <span className="text-xs font-mono text-gray-500">{pkg.color || '#276152'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">+{pkg.bonusPercent}%</td>
                    <td className="py-4 px-6 text-gray-500">
                      F1: <span className="text-emerald-600 font-bold">{pkg.f1CommissionPercent}%</span> | F2: <span className="text-blue-600 font-bold">{pkg.f2CommissionPercent}%</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`flex items-center gap-1.5 text-xs font-bold ${
                        pkg.isActive ? "text-emerald-600" : "text-gray-400"
                      }`}>
                        <span className={`size-2 rounded-full ${pkg.isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
                        {pkg.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(pkg)}
                        className="p-2 text-gray-400 hover:text-[#276152] hover:bg-[#d9ede8]/30 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(pkg._id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0d1f1d]/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl border border-gray-150 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-[#0d1f1d] mb-6">
              {editingPackage ? "Edit Investment Package" : "Add New Investment Package"}
            </h2>
 
            <form onSubmit={handleSave} className="space-y-4">
              <div 
                className="max-h-[65vh] overflow-y-auto pr-1 space-y-4 [&::-webkit-scrollbar]:hidden"
                style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
              >
                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase select-none">Package Title *</label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Green Package"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase select-none">Segment *</label>
                  <Select
                    value={segment}
                    onValueChange={(val: any) => setSegment(val)}
                  >
                    <SelectTrigger className="w-full rounded-xl border-gray-200" style={{ height: '44px' }}>
                      <SelectValue placeholder="Select Segment" />
                    </SelectTrigger>
                    <SelectContent className="z-[150]">
                      <SelectItem value="Cơ bản">Basic</SelectItem>
                      <SelectItem value="Nâng cao">Advanced</SelectItem>
                      <SelectItem value="Cao cấp">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase select-none">Price (USDT) *</label>
                  <Input
                    required
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1000"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase select-none">AQE Received (including Bonus)</label>
                  <Input
                    disabled
                    value={aqeAmount}
                    placeholder="Auto calculated"
                    className="h-11 rounded-xl bg-gray-50 border-gray-200 text-[#276152] font-black cursor-not-allowed select-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase select-none">Bonus %</label>
                  <Input
                    type="number"
                    min={0}
                    value={bonusPercent}
                    onChange={(e) => setBonusPercent(e.target.value)}
                    placeholder="0"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase select-none">F1 Commission (%)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={f1CommissionPercent}
                    onChange={(e) => setF1CommissionPercent(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase select-none">F2 Commission (%)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={f2CommissionPercent}
                    onChange={(e) => setF2CommissionPercent(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase select-none">Description *</label>
                <Textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Enter detailed description of package privileges..."
                  className="rounded-xl resize-none min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase select-none font-sans">Package Color *</label>
                <div className="flex flex-wrap gap-2.5 items-center mt-1">
                  {PALETTE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`size-8 rounded-full border transition-all relative ${
                        color === c
                          ? "ring-2 ring-offset-2 ring-[#276152] border-transparent scale-110"
                          : "border-gray-200 hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                  <label className="size-8 rounded-full border border-gray-200 flex items-center justify-center cursor-pointer hover:scale-105 transition-all bg-gray-50 relative overflow-hidden" title="Custom Color">
                    <Plus size={14} className="text-gray-400" />
                    <input
                      type="color"
                      value={color || '#276152'}
                      onChange={(e) => setColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                  {color && (
                    <span className="text-xs font-mono text-gray-400 ml-1 select-none">
                      Selected: {color}
                    </span>
                  )}
                </div>
              </div>

              {/* Resort Benefits Section */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <h3 className="text-xs font-black text-[#276152] uppercase tracking-wider">Resort Privileges (Comparison Table)</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase select-none">Stay Days</label>
                    <Input
                      value={stayDays}
                      onChange={(e) => setStayDays(e.target.value)}
                      placeholder="e.g. 7 ngày / năm"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase select-none">Room Type</label>
                    <Input
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                      placeholder="e.g. Horizon Room"
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase select-none">Accompanying Guests</label>
                    <Input
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      placeholder="e.g. +1, +2, None"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase select-none">Savings Level</label>
                    <Input
                      value={savings}
                      onChange={(e) => setSavings(e.target.value)}
                      placeholder="e.g. 50%, Unlimited"
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-y-3 gap-x-4 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="vipLounge"
                      checked={vipLounge}
                      onChange={(e) => setVipLounge(e.target.checked)}
                      className="rounded text-[#276152] focus:ring-[#276152] size-4 cursor-pointer"
                    />
                    <label htmlFor="vipLounge" className="text-xs font-bold text-gray-600 select-none cursor-pointer">
                      VIP Lounge Access
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="roomService"
                      checked={roomService}
                      onChange={(e) => setRoomService(e.target.checked)}
                      className="rounded text-[#276152] focus:ring-[#276152] size-4 cursor-pointer"
                    />
                    <label htmlFor="roomService" className="text-xs font-bold text-gray-600 select-none cursor-pointer">
                      Room Service
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="transportation"
                      checked={transportation}
                      onChange={(e) => setTransportation(e.target.checked)}
                      className="rounded text-[#276152] focus:ring-[#276152] size-4 cursor-pointer"
                    />
                    <label htmlFor="transportation" className="text-xs font-bold text-gray-600 select-none cursor-pointer">
                      Transportation
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="wellness"
                      checked={wellness}
                      onChange={(e) => setWellness(e.target.checked)}
                      className="rounded text-[#276152] focus:ring-[#276152] size-4 cursor-pointer"
                    />
                    <label htmlFor="wellness" className="text-xs font-bold text-gray-600 select-none cursor-pointer">
                      Wellness & Fitness
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="priority"
                      checked={priority}
                      onChange={(e) => setPriority(e.target.checked)}
                      className="rounded text-[#276152] focus:ring-[#276152] size-4 cursor-pointer"
                    />
                    <label htmlFor="priority" className="text-xs font-bold text-gray-600 select-none cursor-pointer">
                      Booking Priority
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="concierge"
                      checked={concierge}
                      onChange={(e) => setConcierge(e.target.checked)}
                      className="rounded text-[#276152] focus:ring-[#276152] size-4 cursor-pointer"
                    />
                    <label htmlFor="concierge" className="text-xs font-bold text-gray-600 select-none cursor-pointer">
                      Personal Concierge
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 py-1 border-t border-gray-100 pt-4">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-[#276152] focus:ring-[#276152] size-4 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-gray-600 select-none cursor-pointer">
                  Activate this package (Allow users to purchase)
                </label>
              </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl font-bold h-11 px-5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#276152] hover:bg-[#1e4d41] text-white rounded-xl font-bold px-6 h-11"
                >
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
