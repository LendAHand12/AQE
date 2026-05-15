import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { 
  X,
  UploadCloud,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { toast } from "sonner"
import apiClient from "@/lib/axios"

export default function AddPropertyPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    title: "",
    address: "",
    totalFunding: "",
    tokenPrice: "",
    minInvestment: "",
    expectedApy: "",
    status: "presales",
    duration: "",
    startDate: "",
    endDate: "",
    description: "",
    roi: "",
    expectedAppreciation: "",
    managementFee: "",
    propertyType: "",
    legalNumber: "",
    managementUnit: "",
    preSalesActive: true,
    preSalesStartDate: "",
    preSalesSlots: "",
    preSalesBonus: "10",
    preSalesDeadline: ""
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      if (images.length + filesArray.length > 10) {
        toast.error("Maximum 10 images")
        return
      }
      
      setImages(prev => [...prev, ...filesArray])
      
      const newPreviews = filesArray.map(file => URL.createObjectURL(file))
      setPreviews(prev => [...prev, ...newPreviews])
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const data = new FormData()
      
      // Append basic fields
      Object.entries(formData).forEach(([key, value]) => {
        if (!key.startsWith('preSales')) {
           data.append(key, value.toString())
        }
      })

      // Handle nested preSales
      const preSales = {
        isActive: formData.preSalesActive,
        startDate: formData.preSalesStartDate,
        slots: formData.preSalesSlots,
        bonusToken: formData.preSalesBonus,
        depositDeadline: formData.preSalesDeadline
      }
      data.append('preSales', JSON.stringify(preSales))

      // Append images
      images.forEach(image => {
        data.append('images', image)
      })

      await apiClient.post('/admin/properties', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success("Project added successfully")
      navigate('/admin/properties')
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not add project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="h-10 w-10 text-[#276152] hover:bg-[#d9ede8] rounded-full"
          >
            <CaretLeft className="w-6 h-6" />
          </Button>
          <h2 className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[24px] text-[#276152]">Add New Project</h2>
        </div>
        <p className="font-['SVN-Gilroy:Regular',sans-serif] text-[16px] text-[#636d7d] ml-12">
          Fill in all the information to create a new real estate project
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Images Section */}
        <div className="bg-white border border-[#e5e7ea] p-6 rounded-[16px] space-y-6">
          <div className="flex flex-col gap-1">
            <h3 className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[18px] text-[#276152]">Project Images</h3>
            <p className="text-[14px] text-[#636d7d]">Maximum 10 images · The first image is the main cover image</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative aspect-video rounded-[12px] overflow-hidden group border border-[#d5d7db]">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                {index === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-[#276152]/80 text-white text-[10px] text-center py-1 font-bold">
                    COVER IMAGE
                  </div>
                )}
              </div>
            ))}
            
            {images.length < 10 && (
              <label className="aspect-video border-2 border-dashed border-[#d5d7db] rounded-[12px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                <UploadCloud className="w-6 h-6 text-[#868f9e]" />
                <span className="text-[14px] text-[#868f9e]">Add images ({images.length}/10)</span>
              </label>
            )}
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="bg-white border border-[#e5e7ea] p-6 rounded-[16px] space-y-8">
          <h3 className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[18px] text-[#276152]">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[#0d1f1d] text-[16px] font-semibold">Project Name *</Label>
              <Input 
                required
                placeholder="VD: AQE Tower Suite 12"
                className="h-[44px] rounded-[8px] border-[#9ca3af]"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0d1f1d] text-[16px] font-semibold">Address *</Label>
              <Input 
                required
                placeholder="e.g. District 1, HCM City"
                className="h-[44px] rounded-[8px] border-[#9ca3af]"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-[#0d1f1d] text-[16px] font-semibold">Total Funding Amount (USDT) *</Label>
              <Input 
                required
                type="number"
                placeholder="0"
                className="h-[44px] rounded-[8px] border-[#9ca3af]"
                value={formData.totalFunding}
                onChange={e => setFormData({...formData, totalFunding: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0d1f1d] text-[16px] font-semibold">Price per Token (USDT) *</Label>
              <Input 
                required
                type="number"
                step="0.01"
                placeholder="0"
                className="h-[44px] rounded-[8px] border-[#9ca3af]"
                value={formData.tokenPrice}
                onChange={e => setFormData({...formData, tokenPrice: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0d1f1d] text-[16px] font-semibold">Minimum Investment (USDT) *</Label>
              <Input 
                required
                type="number"
                placeholder="0"
                className="h-[44px] rounded-[8px] border-[#9ca3af]"
                value={formData.minInvestment}
                onChange={e => setFormData({...formData, minInvestment: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-[#0d1f1d] text-[16px] font-semibold">Expected APY (%) *</Label>
              <Input 
                required
                type="number"
                placeholder="0"
                className="h-[44px] rounded-[8px] border-[#9ca3af]"
                value={formData.expectedApy}
                onChange={e => setFormData({...formData, expectedApy: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0d1f1d] text-[16px] font-semibold">Project Status</Label>
              <Select value={formData.status} onValueChange={val => setFormData({...formData, status: val})}>
                <SelectTrigger className="h-[44px] rounded-[8px] border-[#9ca3af]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presales">Pre-sales</SelectItem>
                  <SelectItem value="funding">Funding</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#0d1f1d] text-[16px] font-semibold">Duration (Months) *</Label>
              <Input 
                required
                type="number"
                placeholder="0"
                className="h-[44px] rounded-[8px] border-[#9ca3af]"
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[#0d1f1d] text-[16px] font-semibold">Sales Start Date *</Label>
              <Input 
                required
                type="date"
                className="h-[44px] rounded-[8px] border-[#9ca3af]"
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0d1f1d] text-[16px] font-semibold">Funding Close Date *</Label>
              <Input 
                required
                type="date"
                className="h-[44px] rounded-[8px] border-[#9ca3af]"
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#0d1f1d] text-[16px] font-semibold">Detailed Description *</Label>
            <Textarea 
              required
              placeholder="Enter description: location, amenities, legal, investment opportunities, potential returns..."
              className="min-h-[120px] rounded-[8px] border-[#9ca3af]"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </div>

        {/* Financial & Legal Section */}
        <div className="bg-white border border-[#e5e7ea] p-6 rounded-[16px] space-y-8">
          <h3 className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[18px] text-[#276152]">Financial & Legal Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[#0d1f1d] text-[16px] font-semibold">Annual ROI (%)</Label>
              <Input 
                type="number"
                placeholder="0"
                className="h-[44px] rounded-[8px] border-[#9ca3af]"
                value={formData.roi}
                onChange={e => setFormData({...formData, roi: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0d1f1d] text-[16px] font-semibold">Expected Appreciation (%)</Label>
              <Input 
                type="number"
                placeholder="0"
                className="h-[44px] rounded-[8px] border-[#9ca3af]"
                value={formData.expectedAppreciation}
                onChange={e => setFormData({...formData, expectedAppreciation: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[#0d1f1d] text-[16px] font-semibold">Management Fee (%)</Label>
              <Input 
                type="number"
                placeholder="0"
                className="h-[44px] rounded-[8px] border-[#9ca3af]"
                value={formData.managementFee}
                onChange={e => setFormData({...formData, managementFee: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0d1f1d] text-[16px] font-semibold">Property Type</Label>
              <Input 
                placeholder="e.g. Apartment / Villa..."
                className="h-[44px] rounded-[8px] border-[#9ca3af]"
                value={formData.propertyType}
                onChange={e => setFormData({...formData, propertyType: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[#0d1f1d] text-[16px] font-semibold">Legal Registration Number</Label>
              <Input 
                placeholder="VD: GP-0001/2025/BXD"
                className="h-[44px] rounded-[8px] border-[#9ca3af]"
                value={formData.legalNumber}
                onChange={e => setFormData({...formData, legalNumber: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0d1f1d] text-[16px] font-semibold">Management Unit</Label>
              <Input 
                placeholder="VD: AQE Property Management"
                className="h-[44px] rounded-[8px] border-[#9ca3af]"
                value={formData.managementUnit}
                onChange={e => setFormData({...formData, managementUnit: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Pre-sales Section */}
        <div className="bg-[#e1f1ee]/50 p-6 rounded-[16px] space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-['SVN-Gilroy:Bold',sans-serif] text-[24px] text-[#276152]">Enable Pre-sales - Early Registration</h3>
              <p className="text-[16px] text-[#0d1f1d]">
                Investors **deposit 30%** before opening | <strong>Full payment</strong> → +10% token bonus | <strong>Insufficient</strong> → token = deposit amount.
              </p>
            </div>
            <Switch 
              checked={formData.preSalesActive}
              onCheckedChange={val => setFormData({...formData, preSalesActive: val})}
              className="data-[state=checked]:bg-[#276152]"
            />
          </div>

          {formData.preSalesActive && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-[#0d1f1d] text-[16px] font-semibold">Pre-sales Opening Date</Label>
                <Input 
                  type="date"
                  className="h-[44px] rounded-[8px] border-white bg-white"
                  value={formData.preSalesStartDate}
                  onChange={e => setFormData({...formData, preSalesStartDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0d1f1d] text-[16px] font-semibold">Limited Slots</Label>
                <Input 
                  type="number"
                  placeholder="e.g. 500 people"
                  className="h-[44px] rounded-[8px] border-white bg-white"
                  value={formData.preSalesSlots}
                  onChange={e => setFormData({...formData, preSalesSlots: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0d1f1d] text-[16px] font-semibold">Bonus tokens (%)</Label>
                <Input 
                  type="number"
                  placeholder="10"
                  className="h-[44px] rounded-[8px] border-white bg-white"
                  value={formData.preSalesBonus}
                  onChange={e => setFormData({...formData, preSalesBonus: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0d1f1d] text-[16px] font-semibold">Deposit Payment Deadline</Label>
                <Input 
                  type="date"
                  className="h-[44px] rounded-[8px] border-white bg-white"
                  value={formData.preSalesDeadline}
                  onChange={e => setFormData({...formData, preSalesDeadline: e.target.value})}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="h-[48px] px-8 rounded-[12px] border-[#276152] text-[#276152] hover:bg-[#d9ede8]"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={loading}
            className="h-[48px] px-12 rounded-[12px] bg-[#276152] hover:bg-[#1e4a3f] text-white"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Create Project
          </Button>
        </div>
      </form>
    </div>
  )
}

function CaretLeft(props: any) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}
