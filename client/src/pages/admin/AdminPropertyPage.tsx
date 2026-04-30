import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Search, 
  Plus, 
  MapPin, 
  Pencil, 
  Star, 
  Trash2,
  Loader2,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import { cn, getImageUrl } from "@/lib/utils"

export default function AdminPropertyPage() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/admin/properties')
      setProperties(response.data)
    } catch (error) {
      toast.error("Không thể tải danh sách dự án")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa dự án này?")) return
    
    try {
      await apiClient.delete(`/admin/properties/${id}`)
      toast.success("Đã xóa dự án thành công")
      fetchProperties()
    } catch (error) {
      toast.error("Lỗi khi xóa dự án")
    }
  }

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#276152]" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-10">
      {/* Top Controls */}
      <div className="flex justify-end items-center gap-3">
        <div className="relative w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Tìm kiếm dự án..." 
            className="w-full pl-10 pr-4 h-[40px] border border-[#d5d7db] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#276152] font-['SVN-Gilroy:Regular',sans-serif] text-[16px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Button 
          onClick={() => navigate('/admin/properties/add')}
          className="bg-[#276152] hover:bg-[#1e4a3f] text-white h-[40px] px-6 rounded-[12px] flex items-center gap-2 border-none shadow-md font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] transition-all active:scale-95"
        >
          <span>Thêm dự án</span>
          <Plus className="w-5 h-5" />
        </Button>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-[rgba(239,239,239,0.5)] border-none h-[40px] py-0 rounded-[12px] font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] text-[#276152] focus:ring-0">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent className="rounded-[12px] border-none shadow-lg">
            <SelectItem value="all" className="font-['SVN-Gilroy:Medium',sans-serif]">Tất cả</SelectItem>
            <SelectItem value="funding" className="font-['SVN-Gilroy:Medium',sans-serif]">Đang huy động vốn</SelectItem>
            <SelectItem value="presales" className="font-['SVN-Gilroy:Medium',sans-serif]">Pre-sales</SelectItem>
            <SelectItem value="completed" className="font-['SVN-Gilroy:Medium',sans-serif]">Hoàn thành</SelectItem>
            <SelectItem value="paused" className="font-['SVN-Gilroy:Medium',sans-serif]">Tạm dừng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Property Grid */}
      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((property) => (
            <PropertyCard 
              key={property._id} 
              property={property} 
              onDelete={() => handleDelete(property._id)}
              onEdit={() => navigate(`/admin/properties/edit/${property._id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[16px] p-20 flex flex-col items-center justify-center border border-dashed border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-['SVN-Gilroy:Medium',sans-serif]">Không tìm thấy dự án nào</p>
        </div>
      )}
    </div>
  )
}

function PropertyCard({ property, onDelete, onEdit }: { property: any, onDelete: () => void, onEdit: () => void }) {
  const fundingPercent = Math.min(100, Math.round((property.currentFunding / property.totalFunding) * 100))

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'funding': return 'Đang huy động vốn'
      case 'presales': return 'Pre-sales'
      case 'completed': return 'Hoàn thành'
      case 'paused': return 'Tạm dừng'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funding': return 'bg-[#d9ede8] text-[#276152]'
      case 'presales': return 'bg-[rgba(245,158,11,0.2)] text-[#d97706]'
      case 'completed': return 'bg-[rgba(22,163,74,0.2)] text-[#16a34a]'
      case 'paused': return 'bg-[rgba(239,68,68,0.2)] text-[#ef4444]'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-[16px] p-[14px] flex flex-col gap-5 shadow-[0_10px_11.5px_rgba(0,0,0,0.02),0_41px_20.5px_rgba(0,0,0,0.02)] border border-transparent hover:border-[#276152]/10 transition-all group">
      {/* Upper Part */}
      <div className="flex flex-col gap-[11px]">
        {/* Image & Badge Container */}
        <div className="relative h-[160px] w-full rounded-[12px] overflow-hidden bg-[#f3f4f6]">
          {property.images && property.images.length > 0 ? (
            <img 
              src={getImageUrl(property.images[0])!} 
              alt={property.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
               <MapPin className="w-8 h-8 text-[#d1d5db] opacity-40" />
            </div>
          )}
          
          {/* Status Badge with Tab/Notch effect */}
          <div className="absolute top-0 right-0 bg-white pl-3 pb-3 rounded-bl-[16px]">
            <div className={cn(
              "h-[35px] px-[17px] py-[10px] flex items-center justify-center rounded-[12px]",
              getStatusColor(property.status)
            )}>
              <span className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[12px] tracking-[0.36px] whitespace-nowrap font-semibold">
                {getStatusDisplay(property.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-[6px]">
          <div className="flex justify-between items-center w-full">
            <h3 className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[18px] text-[#0d1f1d] leading-[22px] tracking-[0.54px] line-clamp-1 flex-1">
              {property.title}
            </h3>
            <p className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[14px] text-[#276152] leading-[20px] tracking-[0.42px] shrink-0">
              {property.totalFunding?.toLocaleString()}đ
            </p>
          </div>
          
          <div className="flex items-center gap-[6px] text-[#636d7d]">
            <MapPin className="w-5 h-5 text-[#636d7d]" />
            <span className="font-['SVN-Gilroy:Regular',sans-serif] text-[14px] leading-[20px] line-clamp-1">{property.address}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex flex-col gap-[7px]">
          <div className="flex justify-between items-center text-[14px] leading-[20px]">
            <span className="font-['SVN-Gilroy:Medium',sans-serif] text-[#276152]">Huy động vốn</span>
            <span className="font-['SVN-Gilroy:Regular',sans-serif] text-[#636d7d]">{fundingPercent}%</span>
          </div>
          <div className="h-[6px] w-full bg-[#efefef] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#276152] rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${fundingPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Separator Line */}
      <div className="h-0 border-t-[1.5px] border-dashed border-[#d5d7db] mx-auto w-[90%]" />

      {/* Actions */}
      <div className="flex items-center gap-[10px]">
        <Button 
          onClick={onEdit}
          className="flex-1 bg-[#d9ede8] hover:bg-[#c4e3db] text-[#276152] h-[44px] rounded-[12px] flex items-center justify-center gap-[4px] p-0 border-none shadow-none font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] tracking-[0.48px]"
        >
          <Pencil className="w-5 h-5" />
          <span>Chỉnh sửa</span>
        </Button>
        <Button 
          className="flex-1 bg-[rgba(245,158,11,0.1)] hover:bg-[rgba(245,158,11,0.2)] text-[#d97706] h-[44px] rounded-[12px] flex items-center justify-center gap-[4px] p-0 border-none shadow-none font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] tracking-[0.48px]"
        >
          <Star className="w-5 h-5" />
          <span>Pre-sales</span>
        </Button>
        <Button 
          onClick={onDelete}
          className="flex-1 bg-[rgba(239,68,68,0.1)] hover:bg-[rgba(239,68,68,0.2)] text-[#ef4444] h-[44px] rounded-[12px] flex items-center justify-center gap-[4px] p-0 border-none shadow-none font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] tracking-[0.48px]"
        >
          <Trash2 className="w-5 h-5" />
          <span>Xóa</span>
        </Button>
      </div>
    </div>
  )
}
