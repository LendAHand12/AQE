import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { 
  Users, 
  Search, 
  Trash2, 
  Edit, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  Filter
} from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
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
import { getImageUrl, cn } from "@/lib/utils"

export default function UserManagementPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Edit State
  const [editingUser, setEditingUser] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  const fetchUsers = async () => {
    try {
      const response = await apiClient.get("/admin/users")
      setUsers(response.data)
    } catch (err: any) {
      toast.error("Không thể tải danh sách người dùng")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

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

  const filteredUsers = users.filter(u => 
    `${u.fullName} ${u.username} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 text-[#276152] animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-[32px] font-bold text-[#111827] flex items-center gap-3">
            <Users className="w-8 h-8 text-[#276152]" /> Quản lý thành viên
          </h1>
          <p className="text-gray-500">Xem, chỉnh sửa và quản lý tất cả thành viên trong hệ thống.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 rounded-full border-gray-200 text-gray-600 bg-white font-bold h-fit shadow-sm">
          Tổng số: {users.length} thành viên
        </Badge>
      </div>

      <div className="flex gap-4 items-center bg-white p-2 rounded-[16px] shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input 
            placeholder="Tìm kiếm theo tên hoặc email..." 
            className="pl-12 h-12 border-none focus-visible:ring-0 text-md font-medium" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="ghost" className="h-12 w-12 rounded-[12px] hover:bg-gray-100">
          <Filter className="w-5 h-5 text-gray-500" />
        </Button>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-[#f8faf9]">
            <TableRow className="border-b border-gray-100 hover:bg-transparent">
              <TableHead className="w-[300px] py-6 font-bold text-[#111827] h-full">Họ & Tên</TableHead>
              <TableHead className="font-bold text-[#111827]">Email</TableHead>
              <TableHead className="font-bold text-[#111827]">Trạng thái</TableHead>
              <TableHead className="font-bold text-[#111827]">KYC</TableHead>
              <TableHead className="font-bold text-[#111827]">Ngày tham gia</TableHead>
              <TableHead className="text-right font-bold text-[#111827] pr-8">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user._id} className="border-b border-gray-50 hover:bg-[#f8faf9]/50 transition-colors">
                <TableCell className="py-5 font-bold text-[#111827]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#276152] text-white flex items-center justify-center text-sm font-bold shadow-inner overflow-hidden border border-gray-100 uppercase">
                      {user.avatar ? (
                        <img src={getImageUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{user.fullName?.charAt(0)}</span>
                      )}
                    </div>
                    {user.fullName}
                  </div>
                </TableCell>
                <TableCell className="text-gray-600 font-medium">{user.email}</TableCell>
                <TableCell>
                  {user.isActive ? (
                    <Badge className="bg-[#d9ede8] hover:bg-[#d9ede8] text-[#1e4d40] border-none font-bold px-3 py-1">Đã kích hoạt</Badge>
                  ) : (
                    <Badge variant="outline" className="border-gray-200 text-gray-400 font-bold px-3 py-1">Chưa kích hoạt</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.kycStatus === 'verified' && <Badge className="bg-blue-50 text-blue-600 border-none font-bold flex w-fit gap-1 items-center px-2 py-0.5"><CheckCircle2 size={12}/> Đã duyệt</Badge>}
                  {user.kycStatus === 'pending' && <Badge className="bg-orange-50 text-orange-600 border-none font-bold flex w-fit gap-1 items-center px-2 py-0.5"><Clock size={12}/> Chờ duyệt</Badge>}
                  {user.kycStatus === 'unverified' && <Badge className="bg-gray-100 text-gray-500 border-none font-bold flex w-fit gap-1 items-center px-2 py-0.5"><AlertCircle size={12}/> Chưa KYC</Badge>}
                </TableCell>
                <TableCell className="text-gray-500 text-sm font-medium">
                  {new Date(user.createdAt).toLocaleString("vi-VN")}
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 rounded-full text-[#276152] hover:bg-[#d9ede8]"
                      onClick={() => {
                        setEditingUser(user)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 rounded-full text-red-500 hover:bg-red-50"
                      onClick={() => handleDelete(user._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredUsers.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <Search className="w-12 h-12 text-gray-200 mx-auto" />
            <p className="text-gray-400 font-medium">Không tìm thấy người dùng nào phù hợp với từ khóa.</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[24px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
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
                    <Input value={editingUser?.fullName || ""} onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})} className="h-11 rounded-[8px]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Ngày sinh</label>
                    <Input type="date" value={editingUser?.birthday ? new Date(editingUser.birthday).toISOString().split('T')[0] : ""} onChange={(e) => setEditingUser({...editingUser, birthday: e.target.value})} className="h-11 rounded-[8px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Giới tính</label>
                    <Select value={editingUser?.gender} onValueChange={(v) => setEditingUser({...editingUser, gender: v})}>
                      <SelectTrigger className="h-11 rounded-[8px]"><SelectValue /></SelectTrigger>
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
                    <Input value={editingUser?.email || ""} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="h-11 rounded-[8px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Số điện thoại</label>
                    <Input value={editingUser?.phone || ""} onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})} className="h-11 rounded-[8px]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Telegram</label>
                  <Input value={editingUser?.telegram || ""} onChange={(e) => setEditingUser({...editingUser, telegram: e.target.value})} className="h-11 rounded-[8px]" placeholder="@username" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Địa chỉ cụ thể</label>
                  <Input value={editingUser?.address || ""} onChange={(e) => setEditingUser({...editingUser, address: e.target.value})} className="h-11 rounded-[8px]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Quốc gia</label>
                    <Input value={editingUser?.nation || ""} onChange={(e) => setEditingUser({...editingUser, nation: e.target.value})} className="h-11 rounded-[8px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Trạng thái KYC</label>
                    <Select value={editingUser?.kycStatus} onValueChange={(v) => setEditingUser({...editingUser, kycStatus: v})}>
                      <SelectTrigger className="h-11 rounded-[8px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unverified">Chưa KYC</SelectItem>
                        <SelectItem value="pending">Chờ xác minh</SelectItem>
                        <SelectItem value="verified">Đã xác minh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Finance */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold text-[#276152] uppercase tracking-wider">Tài chính</h4>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Địa chỉ ví (USDT BEP20)</label>
                  <Input value={editingUser?.walletAddress || ""} onChange={(e) => setEditingUser({...editingUser, walletAddress: e.target.value})} className="h-11 rounded-[8px] font-mono text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">Trạng thái hoạt động</label>
                  <Select value={editingUser?.isActive ? "true" : "false"} onValueChange={(v) => setEditingUser({...editingUser, isActive: v === "true"})}>
                    <SelectTrigger className="h-11 rounded-[8px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Đã kích hoạt</SelectItem>
                      <SelectItem value="false">Khóa tài khoản</SelectItem>
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
    </div>
  )
}
