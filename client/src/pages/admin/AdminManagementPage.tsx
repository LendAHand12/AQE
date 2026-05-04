import { useState, useEffect } from "react"
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Pencil, 
  Loader2
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import dayjs from "dayjs"

// Define available permissions grouped by category
const PERMISSION_GROUPS = [
  {
    category: "Người dùng (Users)",
    permissions: [
      { id: "USERS_VIEW", label: "Xem danh sách" },
      { id: "USERS_EDIT", label: "Chỉnh sửa thông tin" },
      { id: "USERS_DELETE", label: "Xóa tài khoản" },
    ]
  },
  {
    category: "Xác thực (KYC)",
    permissions: [
      { id: "KYC_VIEW", label: "Xem yêu cầu KYC" },
      { id: "KYC_APPROVE", label: "Duyệt/Từ chối KYC" },
    ]
  },
  {
    category: "Bất động sản (Properties)",
    permissions: [
      { id: "PROPERTIES_VIEW", label: "Xem danh sách" },
      { id: "PROPERTIES_ADD", label: "Thêm mới" },
      { id: "PROPERTIES_EDIT", label: "Chỉnh sửa" },
      { id: "PROPERTIES_DELETE", label: "Xóa" },
    ]
  },
  {
    category: "Giao dịch (Transactions)",
    permissions: [
      { id: "TRANSACTIONS_VIEW", label: "Xem lịch sử giao dịch" },
      { id: "TRANSACTIONS_EXPORT", label: "Xuất dữ liệu" },
    ]
  },
  {
    category: "Rút tiền (Withdrawals)",
    permissions: [
      { id: "WITHDRAWALS_VIEW", label: "Xem yêu cầu rút" },
      { id: "WITHDRAWALS_APPROVE", label: "Duyệt rút tiền" },
    ]
  },
  {
    category: "Cài đặt Pool",
    permissions: [
      { id: "SETTINGS_VIEW", label: "Xem cài đặt Pool" },
      { id: "SETTINGS_EDIT", label: "Cập nhật cài đặt Pool" },
    ]
  }
]

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<any>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "subadmin",
    permissions: [] as string[]
  })

  const fetchAdmins = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get("/admin/accounts")
      setAdmins(response.data)
    } catch (err: any) {
      toast.error("Không thể tải danh sách tài khoản quản trị")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleOpenModal = (admin: any = null) => {
    if (admin) {
      setEditingAdmin(admin)
      setFormData({
        username: admin.username,
        password: "", // Don't show password
        role: admin.role,
        permissions: admin.permissions || []
      })
    } else {
      setEditingAdmin(null)
      setFormData({
        username: "",
        password: "",
        role: "subadmin",
        permissions: []
      })
    }
    setIsModalOpen(true)
  }

  const handlePermissionChange = (permId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permId]
        : prev.permissions.filter(p => p !== permId)
    }))
  }

  const handleSubmit = async () => {
    if (!formData.username) return toast.error("Vui lòng nhập tên đăng nhập")
    if (!editingAdmin && !formData.password) return toast.error("Vui lòng nhập mật khẩu")

    try {
      if (editingAdmin) {
        await apiClient.put(`/admin/accounts/${editingAdmin._id}`, formData)
        toast.success("Cập nhật tài khoản thành công")
      } else {
        await apiClient.post("/admin/accounts", formData)
        toast.success("Tạo tài khoản subadmin thành công")
      }
      setIsModalOpen(false)
      fetchAdmins()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Đã có lỗi xảy ra")
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) return
    try {
      await apiClient.delete(`/admin/accounts/${id}`)
      toast.success("Xóa tài khoản thành công")
      fetchAdmins()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể xóa tài khoản")
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0d1f1d]">Quản lý Admin</h1>
          <p className="text-[#6b7280]">Tạo và phân quyền cho các tài khoản quản trị hệ thống</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()}
          className="bg-[#276152] hover:bg-[#276152]/90 text-white gap-2"
        >
          <UserPlus size={18} />
          Thêm Subadmin
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-[#efefef] shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="font-bold text-[#0d1f1d]">Username</TableHead>
              <TableHead className="font-bold text-[#0d1f1d]">Vai trò</TableHead>
              <TableHead className="font-bold text-[#0d1f1d]">Quyền hạn</TableHead>
              <TableHead className="font-bold text-[#0d1f1d]">Ngày tạo</TableHead>
              <TableHead className="text-right font-bold text-[#0d1f1d]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#276152] mx-auto" />
                </TableCell>
              </TableRow>
            ) : admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-gray-400">
                  Chưa có tài khoản admin nào
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin._id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-medium text-[#0d1f1d]">{admin.username}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      admin.role === 'superadmin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {admin.role.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[400px]">
                      {admin.role === 'superadmin' ? (
                        <span className="text-xs text-gray-400 italic">Toàn quyền hệ thống</span>
                      ) : admin.permissions?.length > 0 ? (
                        admin.permissions.map((p: string) => (
                          <span key={p} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium border border-gray-200">
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-red-400 italic">Chưa có quyền</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-[#717c8d] text-sm">
                    {dayjs(admin.createdAt).format("DD/MM/YYYY HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleOpenModal(admin)}
                      >
                        <Pencil size={18} />
                      </Button>
                      {admin.role !== 'superadmin' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(admin._id)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-[#276152]" />
              {editingAdmin ? "Chỉnh sửa tài khoản" : "Tạo Subadmin mới"}
            </DialogTitle>
            <DialogDescription>
              Thiết lập quyền hạn chi tiết cho nhân viên quản trị.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0d1f1d]">Username (Email)</label>
                <Input 
                  placeholder="nhanvien@gmail.com" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0d1f1d]">Mật khẩu {editingAdmin && "(Để trống nếu không đổi)"}</label>
                <Input 
                  type="password"
                  placeholder="********" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0d1f1d]">Vai trò</label>
              <Select 
                value={formData.role} 
                onValueChange={(val) => setFormData({...formData, role: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subadmin">Subadmin (Giới hạn quyền)</SelectItem>
                  <SelectItem value="superadmin">Superadmin (Toàn quyền)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'subadmin' && (
              <div className="space-y-4 border-t pt-4">
                <label className="text-sm font-bold text-[#0d1f1d]">Phân quyền chi tiết</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.category} className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                      <h4 className="text-xs font-bold text-[#276152] uppercase tracking-wider">{group.category}</h4>
                      <div className="space-y-2">
                        {group.permissions.map((perm) => (
                          <div key={perm.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={perm.id} 
                              checked={formData.permissions.includes(perm.id)}
                              onCheckedChange={(checked) => handlePermissionChange(perm.id, !!checked)}
                            />
                            <label htmlFor={perm.id} className="text-sm font-medium leading-none cursor-pointer">
                              {perm.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button 
              className="bg-[#276152] hover:bg-[#276152]/90 text-white"
              onClick={handleSubmit}
            >
              {editingAdmin ? "Lưu thay đổi" : "Tạo tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
