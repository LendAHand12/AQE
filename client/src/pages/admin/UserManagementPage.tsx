import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { 
  Search, 
  Trash2, 
  Eye, 
  Loader2,
  Pencil
} from "lucide-react"
import { useAdminPermissions } from "@/hooks/useAdminPermissions"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import { getImageUrl } from "@/lib/utils"
import { Pagination } from "@/components/common/Pagination"
import dayjs from "dayjs"

export default function UserManagementPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, locked: 0 })
  
  // Initialize from search params
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"))
  
  const ITEMS_PER_PAGE = 10

  const [totalPages, setTotalPages] = useState(1)
  const [fetching, setFetching] = useState(false)
  
  // Edit State
  const [editingUser, setEditingUser] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  
  const { hasPermission } = useAdminPermissions()

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/admin/users/stats')
      setStats(res.data)
    } catch (err) {}
  }

  const fetchUsers = async () => {
    if (page === 1) setLoading(true)
    else setFetching(true)
    
    try {
      const response = await apiClient.get(`/admin/users?page=${page}&limit=${ITEMS_PER_PAGE}&search=${searchTerm}&status=${statusFilter}`)
      setUsers(response.data.users)
      setTotalPages(response.data.pages)

    } catch (err: any) {
      toast.error("Không thể tải danh sách người dùng")
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }

  // Update search params when state changes
  useEffect(() => {
    const params: any = { page: page.toString() }
    if (searchTerm) params.search = searchTerm
    if (statusFilter !== 'all') params.status = statusFilter
    setSearchParams(params, { replace: true })
  }, [page, searchTerm, statusFilter])

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [page])


  // Reset page when search or filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only reset to page 1 if we're not on page 1
      if (page !== 1) {
        setPage(1)
      } else {
        fetchUsers()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter])


  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này? Thao tác này sẽ cho phép người dùng đăng ký lại bằng email cũ.")) return
    
    try {
      await apiClient.delete(`/admin/users/${id}`)
      toast.success("Xóa người dùng thành công")
      setUsers(users.filter(u => u._id !== id))
    } catch (err: any) {
      toast.error("Xóa người dùng thất bại")
    }
  }

  const handleUpdate = async () => {
    if (!editingUser) return
    try {
      await apiClient.put(`/admin/users/${editingUser._id}`, editingUser)
      toast.success("Cập nhật thành công")
      setIsEditDialogOpen(false)
      fetchUsers()
    } catch (err: any) {
      toast.error("Cập nhật thất bại")
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

    <div className="space-y-12 max-w-[1400px] mx-auto pb-10">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[rgba(239,239,239,0.5)] border-[#276152] border-l-4 p-5 rounded-r-[16px] flex flex-col justify-center h-[109px]">
          <p className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] text-[#636d7d] tracking-[0.48px] mb-2">Tổng người dùng</p>
          <p className="font-['SVN-Gilroy:Bold',sans-serif] text-[36px] text-[#0d1f1d] leading-tight tracking-[1.08px]">{stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-[rgba(239,239,239,0.5)] border-[#16a34a] border-l-4 p-5 rounded-r-[16px] flex flex-col justify-center h-[109px]">
          <p className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] text-[#636d7d] tracking-[0.48px] mb-2">Đã xác minh KYC</p>
          <p className="font-['SVN-Gilroy:Bold',sans-serif] text-[36px] text-[#0d1f1d] leading-tight tracking-[1.08px]">{stats.verified.toLocaleString()}</p>
        </div>
        <div className="bg-[rgba(239,239,239,0.5)] border-[#d97706] border-l-4 p-5 rounded-r-[16px] flex flex-col justify-center h-[109px]">
          <p className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] text-[#636d7d] tracking-[0.48px] mb-2">Chờ xác minh</p>
          <p className="font-['SVN-Gilroy:Bold',sans-serif] text-[36px] text-[#0d1f1d] leading-tight tracking-[1.08px]">{stats.pending.toLocaleString()}</p>
        </div>
        <div className="bg-[rgba(239,239,239,0.5)] border-[#ef4444] border-l-4 p-5 rounded-r-[16px] flex flex-col justify-center h-[109px]">
          <p className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] text-[#636d7d] tracking-[0.48px] mb-2">Chưa hoạt động</p>
          <p className="font-['SVN-Gilroy:Bold',sans-serif] text-[36px] text-[#0d1f1d] leading-tight tracking-[1.08px]">{stats.locked.toLocaleString()}</p>
        </div>

      </div>

      <div className="space-y-4">
        {/* Filter Area */}
        <div className="flex justify-between items-center">
          <p className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[18px] text-[#276152] tracking-[0.54px]">Danh sách thành viên</p>
          <div className="flex gap-3">
            <div className="relative w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Tìm kiếm người dùng..." 
                className="w-full pl-10 pr-4 py-2.5 border border-[#d5d7db] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#276152] font-['SVN-Gilroy:Regular',sans-serif] text-[16px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-[rgba(239,239,239,0.5)] border-none h-[44px] rounded-[12px] font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] text-[#276152] focus:ring-0">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-[12px] border-none shadow-lg">
                <SelectItem value="all" className="font-['SVN-Gilroy:Medium',sans-serif]">Tất cả</SelectItem>
                <SelectItem value="active" className="font-['SVN-Gilroy:Medium',sans-serif]">Đang hoạt động</SelectItem>
                <SelectItem value="inactive" className="font-['SVN-Gilroy:Medium',sans-serif]">Chưa hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>


        {/* Table Section */}
        <div className="bg-white rounded-[16px] border border-[rgba(239,239,239,0.5)] overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-[#d9ede8]">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="py-4 px-4 font-['SVN-Gilroy:SemiBold',sans-serif] text-[#0d1f1d] text-[16px] tracking-[0.48px] h-[44px]">Người dùng</TableHead>
                <TableHead className="py-4 px-4 font-['SVN-Gilroy:SemiBold',sans-serif] text-[#0d1f1d] text-[16px] tracking-[0.48px] h-[44px]">Email</TableHead>
                <TableHead className="py-4 px-4 font-['SVN-Gilroy:SemiBold',sans-serif] text-[#0d1f1d] text-[16px] tracking-[0.48px] h-[44px]">Thời gian đăng ký</TableHead>

                <TableHead className="py-4 px-4 font-['SVN-Gilroy:SemiBold',sans-serif] text-[#0d1f1d] text-[16px] tracking-[0.48px] h-[44px]">Số dư</TableHead>
                <TableHead className="py-4 px-4 font-['SVN-Gilroy:SemiBold',sans-serif] text-[#0d1f1d] text-[16px] tracking-[0.48px] h-[44px]">KYC</TableHead>
                <TableHead className="py-4 px-4 font-['SVN-Gilroy:SemiBold',sans-serif] text-[#0d1f1d] text-[16px] tracking-[0.48px] h-[44px]">Trạng thái</TableHead>
                <TableHead className="py-4 px-4 font-['SVN-Gilroy:SemiBold',sans-serif] text-[#0d1f1d] text-[16px] tracking-[0.48px] h-[44px] text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id} className="border-b border-[rgba(239,239,239,0.5)] hover:bg-gray-50 transition-colors">
                  <TableCell className="py-4 px-4 font-['SVN-Gilroy:Regular',sans-serif] text-[#111827] text-[16px]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#276152] text-white flex items-center justify-center text-xs font-bold overflow-hidden uppercase">
                        {user.avatar ? (
                          <img src={getImageUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span>{user.fullName?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.fullName}</span>
                        <span className="text-[12px] text-gray-400">@{user.username}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4 font-['SVN-Gilroy:Regular',sans-serif] text-[#111827] text-[16px]">{user.email}</TableCell>
                  <TableCell className="py-4 px-4 font-['SVN-Gilroy:Regular',sans-serif] text-[#111827] text-[16px]">
                    {dayjs(user.createdAt).format("DD/MM/YYYY HH:mm")}
                  </TableCell>

                  <TableCell className="py-4 px-4 font-['SVN-Gilroy:Regular',sans-serif] text-[#111827] text-[16px] font-medium">
                    {user.usdtBalance?.toLocaleString()} USDT
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    {user.kycStatus === 'verified' && (
                      <span className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] text-[#065f46] tracking-[0.48px]">Level 2</span>
                    )}
                    {user.kycStatus === 'pending' && (
                      <span className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] text-[#d97706] tracking-[0.48px]">Chờ duyệt</span>
                    )}
                    {user.kycStatus === 'unverified' && (
                      <span className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] text-gray-400 tracking-[0.48px]">Chưa xác minh</span>
                    )}
                    {user.kycStatus === 'rejected' && (
                      <span className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] text-red-400 tracking-[0.48px]">Bị từ chối</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    {user.isActive ? (
                      <span className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] text-[#065f46] tracking-[0.48px]">Đang hoạt động</span>
                    ) : (
                      <span className="font-['SVN-Gilroy:SemiBold',sans-serif] text-[16px] text-[#ef4444] tracking-[0.48px]">Chưa hoạt động</span>
                    )}
                  </TableCell>

                  <TableCell className="py-4 px-4">
                    <div className="flex justify-center gap-3">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full text-[#276152] hover:bg-[#d9ede8]"
                        onClick={() => navigate(`/admin/users/${user._id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {hasPermission('USERS_EDIT') && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full text-[#3b82f6] hover:bg-[#3b82f6]/10"
                          onClick={() => {
                            setEditingUser({...user});
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission('USERS_DELETE') && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50"
                          onClick={() => handleDelete(user._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {users.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <Search className="w-12 h-12 text-gray-200 mx-auto" />
              <p className="text-gray-400 font-medium">Không tìm thấy người dùng nào phù hợp với từ khóa.</p>
            </div>
          )}
        </div>
      </div>

      <Pagination 
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        disabled={fetching}
        totalItems={stats.total}
        itemsPerPage={ITEMS_PER_PAGE}
      />



      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent 
          className="sm:max-w-[700px] rounded-[24px] max-h-[90vh] flex flex-col p-0 overflow-hidden"
          onInteractOutside={(e) => {
            if (previewImage) e.preventDefault();
          }}
        >
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold text-[#111827]">Chỉnh sửa người dùng</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
            <div className="grid gap-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold text-[#276152] uppercase tracking-wider">Thông tin cá nhân</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Họ và Tên</label>
                    <Input value={editingUser?.fullName || ""} onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Ngày sinh</label>
                    <Input type="date" value={editingUser?.birthday ? new Date(editingUser.birthday).toISOString().split('T')[0] : ""} onChange={(e) => setEditingUser({...editingUser, birthday: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Giới tính</label>
                    <Select value={editingUser?.gender} onValueChange={(v) => setEditingUser({...editingUser, gender: v})}>
                      <SelectTrigger className="!h-11 rounded-[8px] w-full border-gray-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nam">Nam</SelectItem>
                        <SelectItem value="Nữ">Nữ</SelectItem>
                        <SelectItem value="Khác">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact & Address */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold text-[#276152] uppercase tracking-wider">Liên hệ & Địa chỉ</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Email</label>
                    <Input value={editingUser?.email || ""} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Số điện thoại</label>
                    <Input value={editingUser?.phone || ""} onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Telegram</label>
                  <Input value={editingUser?.telegram || ""} onChange={(e) => setEditingUser({...editingUser, telegram: e.target.value})} className="h-11 rounded-[8px] border-gray-200" placeholder="@username" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Địa chỉ cụ thể</label>
                  <Input value={editingUser?.address || ""} onChange={(e) => setEditingUser({...editingUser, address: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Quốc gia</label>
                    <Input value={editingUser?.nation || ""} onChange={(e) => setEditingUser({...editingUser, nation: e.target.value})} className="h-11 rounded-[8px] border-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Trạng thái KYC</label>
                    <Select value={editingUser?.kycStatus} onValueChange={(v) => setEditingUser({...editingUser, kycStatus: v})}>
                      <SelectTrigger className="!h-11 rounded-[8px] w-full border-gray-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unverified">Chưa KYC</SelectItem>
                        <SelectItem value="pending">Chờ xác minh</SelectItem>
                        <SelectItem value="verified">Đã xác minh</SelectItem>
                        <SelectItem value="rejected">Từ chối (Yêu cầu làm lại)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* KYC Images */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold text-[#276152] uppercase tracking-wider">Hình ảnh KYC</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Mặt trước ID</label>
                    <div className="border border-gray-200 rounded-[8px] h-32 flex items-center justify-center overflow-hidden bg-gray-50">
                      {editingUser?.idCardFront ? (
                        <img 
                          src={getImageUrl(editingUser.idCardFront)} 
                          alt="Front ID" 
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                          onClick={() => setPreviewImage(getImageUrl(editingUser.idCardFront))}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">Chưa cập nhật</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Mặt sau ID</label>
                    <div className="border border-gray-200 rounded-[8px] h-32 flex items-center justify-center overflow-hidden bg-gray-50">
                      {editingUser?.idCardBack ? (
                        <img 
                          src={getImageUrl(editingUser.idCardBack)} 
                          alt="Back ID" 
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                          onClick={() => setPreviewImage(getImageUrl(editingUser.idCardBack))}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">Chưa cập nhật</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Ảnh chân dung</label>
                    <div className="border border-gray-200 rounded-[8px] h-32 flex items-center justify-center overflow-hidden bg-gray-50">
                      {editingUser?.portraitPhoto ? (
                        <img 
                          src={getImageUrl(editingUser.portraitPhoto)} 
                          alt="Portrait" 
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                          onClick={() => setPreviewImage(getImageUrl(editingUser.portraitPhoto))}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">Chưa cập nhật</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Finance */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold text-[#276152] uppercase tracking-wider">Tài chính</h4>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Địa chỉ ví (USDT BEP20)</label>
                  <Input value={editingUser?.walletAddress || ""} onChange={(e) => setEditingUser({...editingUser, walletAddress: e.target.value})} className="h-11 rounded-[8px] font-mono text-xs border-gray-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Trạng thái hoạt động</label>
                  <Select value={editingUser?.isActive ? "true" : "false"} onValueChange={(v) => setEditingUser({...editingUser, isActive: v === "true"})}>
                    <SelectTrigger className="!h-11 rounded-[8px] w-full border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Đã kích hoạt (Active)</SelectItem>
                      <SelectItem value="false">Khóa tài khoản / Chưa kích hoạt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-[8px]">Hủy</Button>
            <Button onClick={handleUpdate} className="bg-[#276152] rounded-[8px] px-8">Lưu tất cả thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Overlay */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100000] bg-black/90 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm transition-opacity pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            setPreviewImage(null)
          }}
        >
          <button 
             className="absolute top-6 right-6 text-white bg-white/20 hover:bg-white/40 rounded-full p-2 transition-colors z-[100001] pointer-events-auto"
             onClick={(e) => {
               e.stopPropagation();
               setPreviewImage(null);
             }}
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <img 
            src={previewImage} 
            className="max-w-full max-h-full object-contain rounded-[12px] shadow-2xl relative z-[100001]" 
            alt="Preview" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
